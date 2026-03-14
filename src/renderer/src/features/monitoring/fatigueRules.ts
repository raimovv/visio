import type { CalibrationStatus, MonitoringStatus, ThresholdSettings } from '@shared/types'

interface MonitoringStateInput {
  brightnessScore: number
  faceDetected: boolean
  thresholds: ThresholdSettings
  breakSettings: { enabled: boolean; intervalMinutes: number }
  eyeClosureSeconds: number
  timeSinceLastBlinkSeconds: number
  calibrationStatus: CalibrationStatus
  drowsinessWarningsEnabled: boolean
  workCycleElapsedSeconds: number
  breakProgressSeconds: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function deriveMonitoringState(
  input: MonitoringStateInput
): { eyeStrainScore: number; eyeStrainProgress: number; status: MonitoringStatus } {
  const eyeStrainProgress = clamp(input.timeSinceLastBlinkSeconds / input.thresholds.blinkReminderSeconds, 0, 1)
  const workCycleProgress = input.breakSettings.enabled
    ? clamp(input.workCycleElapsedSeconds / (input.breakSettings.intervalMinutes * 60), 0, 1)
    : 0
  const eyeStrainScore = Number((eyeStrainProgress * 0.75 + workCycleProgress * 0.25).toFixed(2))
  const breakDue = input.breakSettings.enabled && workCycleProgress >= 1
  const breakInProgress = breakDue && input.breakProgressSeconds > 0

  if (input.calibrationStatus === 'running') {
    return { eyeStrainScore: 0, eyeStrainProgress: 0, status: 'calibrating' }
  }

  if (breakInProgress) {
    return { eyeStrainScore: 0, eyeStrainProgress: 0, status: 'break-in-progress' }
  }

  if (!input.faceDetected) {
    return { eyeStrainScore: 0, eyeStrainProgress: 0, status: 'no-face' }
  }

  if (input.calibrationStatus !== 'ready') {
    return { eyeStrainScore: 0, eyeStrainProgress: 0, status: 'calibration-needed' }
  }

  if (input.brightnessScore < input.thresholds.lowLightThreshold) {
    return { eyeStrainScore: eyeStrainScore * 0.25, eyeStrainProgress, status: 'low-light' }
  }

  if (input.drowsinessWarningsEnabled && input.eyeClosureSeconds >= input.thresholds.drowsinessHoldSeconds) {
    return {
      eyeStrainScore: Math.max(eyeStrainScore, 1),
      eyeStrainProgress,
      status: 'drowsiness-warning'
    }
  }

  if (breakDue) {
    return { eyeStrainScore, eyeStrainProgress: 1, status: 'break-due' }
  }

  if (input.timeSinceLastBlinkSeconds >= input.thresholds.blinkReminderSeconds) {
    return {
      eyeStrainScore: Math.max(eyeStrainScore, 1),
      eyeStrainProgress: 1,
      status: 'blink-reminder'
    }
  }

  return { eyeStrainScore, eyeStrainProgress, status: 'monitoring' }
}
