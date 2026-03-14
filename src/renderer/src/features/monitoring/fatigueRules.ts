import type { CalibrationStatus, MonitoringStatus, ThresholdSettings } from '@shared/types'

interface MonitoringStateInput {
  brightnessScore: number
  elapsedSeconds: number
  faceDetected: boolean
  thresholds: ThresholdSettings
  breakSettings: { enabled: boolean; intervalMinutes: number }
  eyeClosureSeconds: number
  timeSinceLastBlinkSeconds: number
  calibrationStatus: CalibrationStatus
  drowsinessWarningsEnabled: boolean
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function deriveMonitoringState(
  input: MonitoringStateInput
): { eyeStrainScore: number; eyeStrainProgress: number; status: MonitoringStatus } {
  const eyeStrainProgress = clamp(input.timeSinceLastBlinkSeconds / input.thresholds.blinkReminderSeconds, 0, 1)
  const sessionLoad = clamp(input.elapsedSeconds / 3600, 0, 1)
  const eyeStrainScore = Number((eyeStrainProgress * 0.8 + sessionLoad * 0.2).toFixed(2))

  if (!input.faceDetected) {
    return { eyeStrainScore: 0, eyeStrainProgress: 0, status: 'no-face' }
  }

  if (input.brightnessScore < input.thresholds.lowLightThreshold) {
    return { eyeStrainScore: eyeStrainScore * 0.25, eyeStrainProgress, status: 'low-light' }
  }

  if (input.calibrationStatus === 'running') {
    return { eyeStrainScore: 0, eyeStrainProgress: 0, status: 'calibrating' }
  }

  if (input.calibrationStatus !== 'ready') {
    return { eyeStrainScore: 0, eyeStrainProgress: 0, status: 'calibration-needed' }
  }

  if (input.drowsinessWarningsEnabled && input.eyeClosureSeconds >= input.thresholds.drowsinessHoldSeconds) {
    return {
      eyeStrainScore: Math.max(eyeStrainScore, 1),
      eyeStrainProgress,
      status: 'drowsiness-warning'
    }
  }

  if (input.timeSinceLastBlinkSeconds >= input.thresholds.blinkReminderSeconds) {
    return {
      eyeStrainScore: Math.max(eyeStrainScore, 1),
      eyeStrainProgress: 1,
      status: 'blink-reminder'
    }
  }

  if (input.breakSettings.enabled && input.elapsedSeconds >= input.breakSettings.intervalMinutes * 60) {
    return { eyeStrainScore, eyeStrainProgress, status: 'break-due' }
  }

  return { eyeStrainScore, eyeStrainProgress, status: 'monitoring' }
}
