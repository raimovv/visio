import type { AppSettings, MonitoringSnapshot, MonitoringStatus } from '@shared/types'
import type { MonitoringFrameInput, MonitoringRuntimeState } from './monitoringTypes'
import { detectBlink } from './blinkDetector'
import { updateBreakCycle, createBreakRuntimeState } from './breakCycle'
import { deriveMonitoringState } from './fatigueRules'
import { deriveScreenAttention } from './attention'
import {
  computeBlinkThresholds,
  finalizeCalibrationBaseline,
  type BlinkCalibrationProfile
} from './thresholds'
import { formatMonitoringStatus } from '@renderer/utils/status'

const CALIBRATION_DURATION_MS = 6000
const MAX_CALIBRATION_DURATION_MS = 10000
const MIN_VALID_EAR = 0.08
const MAX_VALID_EAR = 0.7
const MIN_CALIBRATION_EAR = 0.12
const MAX_CALIBRATION_EAR = 0.6
const EAR_SMOOTHING_ALPHA = 0.2

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
  calibrationProgress: number,
  breakProgressSeconds: number,
  breakDurationSeconds: number,
  workCycleElapsedSeconds: number,
  workIntervalMinutes: number
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

  if (status === 'break-in-progress') {
    return `Away break: ${breakProgressSeconds.toFixed(1)} / ${breakDurationSeconds}s`
  }

  if (status === 'break-due') {
    return `20-20-20 break: look away for ${breakDurationSeconds}s`
  }

  if (status === 'looking-away') {
    return 'Eye-strain timer paused while you look away'
  }

  if (status === 'low-light') {
    return 'Increase room lighting'
  }

  if (status === 'no-face') {
    return 'Face not detected'
  }

  const remainingSeconds = Math.max(0, blinkReminderSeconds - timeSinceLastBlinkSeconds)
  const breakRemainingMinutes = Math.max(0, workIntervalMinutes - workCycleElapsedSeconds / 60)
  return `EAR: ${smoothedEar.toFixed(3)} | Blink in ${remainingSeconds.toFixed(1)}s | Break in ${breakRemainingMinutes.toFixed(1)}m`
}

function updateCalibration(
  runtime: MonitoringRuntimeState,
  leftEar: number,
  rightEar: number,
  faceDetected: boolean,
  screenFacing: boolean,
  timestamp: number,
  minimumEarThreshold: number
) {
  if (runtime.calibration.status !== 'running') {
    return {
      calibration: runtime.calibration,
      baselineEar: runtime.calibration.profile?.combinedBaselineEar,
      calibrationProgress: runtime.calibration.status === 'ready' ? 1 : 0,
      completed: false
    }
  }

  const elapsedMs = Math.max(0, timestamp - (runtime.calibration.startedAt ?? timestamp))
  const nextSamples =
    faceDetected &&
    screenFacing &&
    leftEar >= MIN_CALIBRATION_EAR &&
    leftEar <= MAX_CALIBRATION_EAR &&
    rightEar >= MIN_CALIBRATION_EAR &&
    rightEar <= MAX_CALIBRATION_EAR
      ? [...runtime.calibration.samples, { leftEar, rightEar }]
      : runtime.calibration.samples

  const minimumReached = elapsedMs >= runtime.calibration.durationMs
  const maximumReached = elapsedMs >= MAX_CALIBRATION_DURATION_MS

  if ((minimumReached && nextSamples.length >= 45) || maximumReached) {
    const profile = finalizeCalibrationBaseline(nextSamples, minimumEarThreshold)
    if (profile) {
      return {
        calibration: {
          status: 'ready',
          durationMs: CALIBRATION_DURATION_MS,
          samples: [],
          profile
        },
        baselineEar: profile.combinedBaselineEar,
        calibrationProgress: 1,
        completed: true
      }
    }

    if (runtime.calibration.profile) {
      return {
        calibration: {
          status: 'ready',
          durationMs: CALIBRATION_DURATION_MS,
          samples: [],
          profile: runtime.calibration.profile
        },
        baselineEar: runtime.calibration.profile.combinedBaselineEar,
        calibrationProgress: 1,
        completed: false
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
    baselineEar: runtime.calibration.profile?.combinedBaselineEar,
    calibrationProgress: Number(clamp(elapsedMs / runtime.calibration.durationMs, 0, 1).toFixed(2)),
    completed: false
  }
}

export function createMonitoringRuntimeState(): MonitoringRuntimeState {
  return {
    blink: {
      recentSamples: [],
      eyeClosureSeconds: 0,
      blinkCount: 0,
      blinkDetected: false
    },
    calibration: {
      status: 'not-started',
      durationMs: CALIBRATION_DURATION_MS,
      samples: []
    },
    breakCycle: createBreakRuntimeState(),
    smoothedEar: undefined,
    timeSinceLastBlinkMs: 0,
    lastFrameTimestamp: undefined
  }
}

export function startCalibrationRun(runtime: MonitoringRuntimeState, timestamp: number): MonitoringRuntimeState {
  return {
    ...runtime,
    blink: {
      ...runtime.blink,
      recentSamples: [],
      closedEyesStartedAt: undefined,
      eyeClosureSeconds: 0,
      lastTimestamp: timestamp,
      blinkDetected: false,
      peakClosureScore: undefined,
      minCombinedEar: undefined
    },
    timeSinceLastBlinkMs: 0,
    lastFrameTimestamp: timestamp,
    calibration: {
      status: 'running',
      startedAt: timestamp,
      durationMs: CALIBRATION_DURATION_MS,
      samples: [],
      profile: runtime.calibration.profile
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
      eyeClosureSeconds: 0,
      breakProgressSeconds: 0,
      breakProgress: 0
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
  const leftEar = sanitizeEar(frame.leftEar)
  const rightEar = sanitizeEar(frame.rightEar)
  const rawEar = Number(((leftEar + rightEar) / 2).toFixed(3))
  const smoothedEar = frame.faceDetected && rawEar >= MIN_VALID_EAR ? smoothEar(rawEar, runtime.smoothedEar) : 0
  const attention = deriveScreenAttention(frame.faceDetected, frame.eyeSignals, frame.headPose)
  const calibrationUpdate = updateCalibration(
    runtime,
    leftEar,
    rightEar,
    frame.faceDetected,
    attention.screenFacing,
    frame.timestamp,
    settings.thresholds.earThreshold
  )
  const calibrationProfile: BlinkCalibrationProfile | undefined = calibrationUpdate.calibration.profile
  const baselineEar = calibrationProfile?.combinedBaselineEar ?? snapshot.metrics.baselineEar
  const thresholds = computeBlinkThresholds(calibrationProfile, settings.thresholds.earThreshold)
  const trackingEnabled = frame.faceDetected && calibrationUpdate.calibration.status === 'ready'

  let blinkState = detectBlink({
    leftEar,
    rightEar,
    blinkLeftScore: frame.eyeSignals.blinkLeft,
    blinkRightScore: frame.eyeSignals.blinkRight,
    thresholds,
    blinkMinDurationMs: 60,
    blinkMaxDurationMs: 1000,
    timestamp: frame.timestamp,
    trackingEnabled,
    state: runtime.blink
  })

  if (calibrationUpdate.completed) {
    blinkState = {
      ...blinkState,
      recentSamples: [],
      closedEyesStartedAt: undefined,
      eyeClosureSeconds: 0,
      lastTimestamp: frame.timestamp,
      blinkDetected: false,
      peakClosureScore: undefined,
      minCombinedEar: undefined
    }
  }

  const deltaMs = runtime.lastFrameTimestamp !== undefined ? Math.max(0, frame.timestamp - runtime.lastFrameTimestamp) : 0
  let timeSinceLastBlinkMs = runtime.timeSinceLastBlinkMs

  if (blinkState.blinkDetected) {
    timeSinceLastBlinkMs = 0
  } else if (
    trackingEnabled &&
    frame.faceDetected &&
    attention.screenFacing &&
    blinkState.eyeClosureSeconds === 0
  ) {
    timeSinceLastBlinkMs += deltaMs
  }

  const breakUpdate = updateBreakCycle({
    state: runtime.breakCycle,
    timestamp: frame.timestamp,
    settings: settings.breakSettings,
    faceDetected: frame.faceDetected,
    screenFacing: attention.screenFacing
  })

  if (breakUpdate.justCompleted) {
    timeSinceLastBlinkMs = 0
  }

  const sessionStart = snapshot.activeSession?.startedAt ? Date.parse(snapshot.activeSession.startedAt) : frame.timestamp
  const elapsedSeconds = Math.max(snapshot.metrics.elapsedSeconds, Math.floor((frame.timestamp - sessionStart) / 1000))
  const timeSinceLastBlinkSeconds = Number((timeSinceLastBlinkMs / 1000).toFixed(2))
  const derived = deriveMonitoringState({
    brightnessScore: frame.brightnessScore,
    faceDetected: frame.faceDetected,
    screenFacing: attention.screenFacing,
    thresholds: settings.thresholds,
    breakSettings: settings.breakSettings,
    eyeClosureSeconds: blinkState.eyeClosureSeconds,
    timeSinceLastBlinkSeconds,
    calibrationStatus: calibrationUpdate.calibration.status,
    drowsinessWarningsEnabled: settings.drowsinessWarningsEnabled,
    workCycleElapsedSeconds: breakUpdate.workCycleElapsedSeconds,
    breakProgressSeconds: breakUpdate.breakProgressSeconds
  })

  const overlayProgress =
    derived.status === 'calibrating'
      ? calibrationUpdate.calibrationProgress
      : derived.status === 'break-due' || derived.status === 'break-in-progress'
        ? breakUpdate.breakProgress
        : derived.eyeStrainProgress

  const nextActiveSession = snapshot.activeSession
    ? {
        ...snapshot.activeSession,
        completedBreaks: breakUpdate.state.completedBreaks,
        breakTakenAt: breakUpdate.state.breakTakenAt
      }
    : undefined

  return {
    runtime: {
      blink: blinkState,
      calibration: calibrationUpdate.calibration,
      breakCycle: breakUpdate.state,
      smoothedEar,
      timeSinceLastBlinkMs,
      lastFrameTimestamp: frame.timestamp
    },
    snapshot: {
      ...snapshot,
      status: derived.status,
      activeSession: nextActiveSession,
      metrics: {
        ...snapshot.metrics,
        ear: rawEar,
        leftEar,
        rightEar,
        smoothedEar,
        blinkCount: blinkState.blinkCount,
        eyeStrainScore: derived.eyeStrainScore,
        eyeStrainProgress: derived.eyeStrainProgress,
        timeSinceLastBlinkSeconds,
        faceDetected: frame.faceDetected,
        screenFacing: attention.screenFacing,
        brightnessScore: frame.brightnessScore,
        elapsedSeconds,
        workCycleElapsedSeconds: breakUpdate.workCycleElapsedSeconds,
        eyeClosureSeconds: blinkState.eyeClosureSeconds,
        breakProgressSeconds: breakUpdate.breakProgressSeconds,
        breakProgress: breakUpdate.breakProgress,
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
          calibrationUpdate.calibrationProgress,
          breakUpdate.breakProgressSeconds,
          settings.breakSettings.durationSeconds,
          breakUpdate.workCycleElapsedSeconds,
          settings.breakSettings.intervalMinutes
        ),
        progress: overlayProgress
      }
    } satisfies MonitoringSnapshot
  }
}

