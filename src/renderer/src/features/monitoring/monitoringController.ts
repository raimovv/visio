import type { AppSettings, MonitoringSnapshot, MonitoringStatus } from '@shared/types'
import type { MonitoringFrameInput, MonitoringRuntimeState } from './monitoringTypes'
import { calculateEyeAspectRatio } from './ear'
import { detectBlink } from './blinkDetector'
import { deriveMonitoringState } from './fatigueRules'
import { computeBlinkThresholds, finalizeCalibrationBaseline } from './thresholds'
import { formatMonitoringStatus } from '@renderer/utils/status'

const CALIBRATION_DURATION_MS = 6000
const MAX_CALIBRATION_DURATION_MS = 10000
const MIN_VALID_EAR = 0.08
const MAX_VALID_EAR = 0.7
const MIN_CALIBRATION_EAR = 0.12
const MAX_CALIBRATION_EAR = 0.6
const EAR_SMOOTHING_ALPHA = 0.28

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function sanitizeEar(ear: number) {
  if (!Number.isFinite(ear) || ear <= 0) {
    return 0
  }

  return Number(clamp(ear, 0, MAX_VALID_EAR).toFixed(3))
}

function smoothEar(currentEar: number, previousEar?: number) {
  if (currentEar <= 0) {
    return 0
  }

  if (previousEar === undefined || previousEar <= 0) {
    return currentEar
  }

  return Number((previousEar * (1 - EAR_SMOOTHING_ALPHA) + currentEar * EAR_SMOOTHING_ALPHA).toFixed(3))
}

function buildOverlaySublabel(
  status: MonitoringStatus,
  smoothedEar: number,
  eyeClosureSeconds: number,
  timeSinceLastBlinkSeconds: number,
  blinkReminderSeconds: number,
  calibrationProgress: number
) {
  if (status === 'calibrating') {
    return `Relaxed gaze capture: ${Math.round(calibrationProgress * 100)}%`
  }

  if (status === 'calibration-needed') {
    return 'Run recalibration from the dashboard'
  }

  if (status === 'drowsiness-warning') {
    return `Eyes closed: ${eyeClosureSeconds.toFixed(1)}s`
  }

  if (status === 'blink-reminder') {
    return `Open-eye streak: ${timeSinceLastBlinkSeconds.toFixed(1)}s`
  }

  if (status === 'break-due') {
    return 'Take a short eye break'
  }

  if (status === 'low-light') {
    return 'Increase room lighting'
  }

  if (status === 'no-face') {
    return 'Face not detected'
  }

  const remainingSeconds = Math.max(0, blinkReminderSeconds - timeSinceLastBlinkSeconds)
  return `EAR: ${smoothedEar.toFixed(3)} | Blink in ${remainingSeconds.toFixed(1)}s`
}

function updateCalibration(
  runtime: MonitoringRuntimeState,
  smoothedEar: number,
  faceDetected: boolean,
  timestamp: number,
  minimumEarThreshold: number
) {
  if (runtime.calibration.status !== 'running') {
    return {
      calibration: runtime.calibration,
      baselineEar: undefined as number | undefined,
      calibrationProgress: runtime.calibration.status === 'ready' ? 1 : 0,
      completed: false
    }
  }

  const elapsedMs = Math.max(0, timestamp - (runtime.calibration.startedAt ?? timestamp))
  const nextSamples =
    faceDetected && smoothedEar >= MIN_CALIBRATION_EAR && smoothedEar <= MAX_CALIBRATION_EAR
      ? [...runtime.calibration.samples, smoothedEar]
      : runtime.calibration.samples

  const minimumReached = elapsedMs >= runtime.calibration.durationMs
  const maximumReached = elapsedMs >= MAX_CALIBRATION_DURATION_MS

  if ((minimumReached && nextSamples.length >= 45) || maximumReached) {
    const baselineEar = finalizeCalibrationBaseline(nextSamples, minimumEarThreshold)
    if (baselineEar) {
      return {
        calibration: {
          status: 'ready',
          durationMs: CALIBRATION_DURATION_MS,
          samples: []
        },
        baselineEar,
        calibrationProgress: 1,
        completed: true
      }
    }

    return {
      calibration: {
        status: 'not-started',
        durationMs: CALIBRATION_DURATION_MS,
        samples: []
      },
      baselineEar: undefined,
      calibrationProgress: 0,
      completed: false
    }
  }

  return {
    calibration: {
      ...runtime.calibration,
      samples: nextSamples
    },
    baselineEar: undefined as number | undefined,
    calibrationProgress: Number(clamp(elapsedMs / runtime.calibration.durationMs, 0, 1).toFixed(2)),
    completed: false
  }
}

export function createMonitoringRuntimeState(): MonitoringRuntimeState {
  return {
    blink: {
      eyeClosureSeconds: 0,
      blinkCount: 0,
      openEyesSinceBlinkMs: 0
    },
    calibration: {
      status: 'not-started',
      durationMs: CALIBRATION_DURATION_MS,
      samples: []
    },
    smoothedEar: undefined
  }
}

export function startCalibrationRun(runtime: MonitoringRuntimeState, timestamp: number): MonitoringRuntimeState {
  return {
    ...runtime,
    blink: {
      ...runtime.blink,
      closedEyesStartedAt: undefined,
      eyeClosureSeconds: 0,
      openEyesSinceBlinkMs: 0,
      lastTimestamp: timestamp
    },
    calibration: {
      status: 'running',
      startedAt: timestamp,
      durationMs: CALIBRATION_DURATION_MS,
      samples: []
    }
  }
}

export function buildCalibrationSnapshot(snapshot: MonitoringSnapshot): MonitoringSnapshot {
  return {
    ...snapshot,
    status: 'calibrating',
    metrics: {
      ...snapshot.metrics,
      calibrationStatus: 'running',
      calibrationProgress: 0,
      eyeStrainScore: 0,
      eyeStrainProgress: 0,
      timeSinceLastBlinkSeconds: 0,
      eyeClosureSeconds: 0
    },
    overlay: {
      ...snapshot.overlay,
      status: 'calibrating',
      label: 'Calibrating',
      sublabel: 'Relaxed gaze capture: 0%',
      progress: 0
    }
  }
}

export function processMonitoringFrame(
  frame: MonitoringFrameInput,
  snapshot: MonitoringSnapshot,
  settings: AppSettings,
  runtime: MonitoringRuntimeState
) {
  const leftEar = calculateEyeAspectRatio(frame.leftEye)
  const rightEar = calculateEyeAspectRatio(frame.rightEye)
  const rawEar = sanitizeEar(Number(((leftEar + rightEar) / 2).toFixed(3)))
  const smoothedEar =
    frame.faceDetected && rawEar >= MIN_VALID_EAR ? smoothEar(rawEar, runtime.smoothedEar) : 0

  const calibrationUpdate = updateCalibration(
    runtime,
    smoothedEar,
    frame.faceDetected,
    frame.timestamp,
    settings.thresholds.earThreshold
  )

  const baselineEar = calibrationUpdate.baselineEar ?? snapshot.metrics.baselineEar
  const thresholds = computeBlinkThresholds(baselineEar, settings.thresholds.earThreshold)
  const trackingEnabled = frame.faceDetected && calibrationUpdate.calibration.status === 'ready'

  let blinkState = detectBlink({
    ear: smoothedEar,
    closeThreshold: thresholds.closeThreshold,
    openThreshold: thresholds.openThreshold,
    blinkMinDurationMs: 80,
    blinkMaxDurationMs: 600,
    timestamp: frame.timestamp,
    trackingEnabled,
    state: runtime.blink
  })

  if (calibrationUpdate.completed) {
    blinkState = {
      ...blinkState,
      closedEyesStartedAt: undefined,
      eyeClosureSeconds: 0,
      openEyesSinceBlinkMs: 0,
      lastTimestamp: frame.timestamp
    }
  }

  const sessionStart = snapshot.activeSession?.startedAt ? Date.parse(snapshot.activeSession.startedAt) : frame.timestamp
  const elapsedSeconds = Math.max(snapshot.metrics.elapsedSeconds, Math.floor((frame.timestamp - sessionStart) / 1000))
  const timeSinceLastBlinkSeconds = Number((blinkState.openEyesSinceBlinkMs / 1000).toFixed(2))

  const derived = deriveMonitoringState({
    brightnessScore: frame.brightnessScore,
    elapsedSeconds,
    faceDetected: frame.faceDetected,
    thresholds: settings.thresholds,
    breakSettings: settings.breakSettings,
    eyeClosureSeconds: blinkState.eyeClosureSeconds,
    timeSinceLastBlinkSeconds,
    calibrationStatus: calibrationUpdate.calibration.status,
    drowsinessWarningsEnabled: settings.drowsinessWarningsEnabled
  })

  const overlayProgress =
    derived.status === 'calibrating' ? calibrationUpdate.calibrationProgress : derived.eyeStrainProgress

  return {
    runtime: {
      blink: blinkState,
      calibration: calibrationUpdate.calibration,
      smoothedEar
    },
    snapshot: {
      ...snapshot,
      status: derived.status,
      metrics: {
        ...snapshot.metrics,
        ear: rawEar,
        smoothedEar,
        blinkCount: blinkState.blinkCount,
        eyeStrainScore: derived.eyeStrainScore,
        eyeStrainProgress: derived.eyeStrainProgress,
        timeSinceLastBlinkSeconds,
        faceDetected: frame.faceDetected,
        brightnessScore: frame.brightnessScore,
        elapsedSeconds,
        eyeClosureSeconds: blinkState.eyeClosureSeconds,
        activeEarThreshold: thresholds.closeThreshold,
        baselineEar,
        calibrationStatus: calibrationUpdate.calibration.status,
        calibrationProgress: calibrationUpdate.calibrationProgress,
        lastBlinkAt: blinkState.lastBlinkAt ? new Date(blinkState.lastBlinkAt).toLocaleTimeString() : undefined
      },
      overlay: {
        ...snapshot.overlay,
        visible: settings.overlay.visible,
        status: derived.status,
        label: formatMonitoringStatus(derived.status),
        sublabel: buildOverlaySublabel(
          derived.status,
          smoothedEar,
          blinkState.eyeClosureSeconds,
          timeSinceLastBlinkSeconds,
          settings.thresholds.blinkReminderSeconds,
          calibrationUpdate.calibrationProgress
        ),
        progress: overlayProgress
      }
    } satisfies MonitoringSnapshot
  }
}
