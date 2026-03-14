import type { AppSettings, MonitoringSnapshot, OverlayState } from '@shared/types'

export const APP_NAME = 'Visio'
export const DASHBOARD_WINDOW_KEY = 'dashboard'
export const OVERLAY_WINDOW_KEY = 'overlay'

export const defaultSettings: AppSettings = {
  startMinimized: false,
  launchOnStartup: false,
  notificationsEnabled: true,
  drowsinessWarningsEnabled: true,
  selectedCameraId: undefined,
  breakSettings: {
    enabled: true,
    intervalMinutes: 20,
    durationSeconds: 20
  },
  overlay: {
    visible: true,
    corner: 'top-right',
    clickThrough: false
  },
  thresholds: {
    earThreshold: 0.12,
    blinkReminderSeconds: 8,
    drowsinessHoldSeconds: 3.5,
    lowLightThreshold: 0.22
  }
}

export const defaultOverlayState: OverlayState = {
  visible: true,
  status: 'idle',
  label: 'Idle',
  sublabel: 'Waiting to start',
  progress: 0
}

export const defaultSnapshot: MonitoringSnapshot = {
  status: 'idle',
  metrics: {
    ear: 0,
    leftEar: 0,
    rightEar: 0,
    smoothedEar: 0,
    blinkCount: 0,
    eyeStrainScore: 0,
    eyeStrainProgress: 0,
    timeSinceLastBlinkSeconds: 0,
    faceDetected: false,
    screenFacing: true,
    brightnessScore: 0,
    elapsedSeconds: 0,
    workCycleElapsedSeconds: 0,
    eyeClosureSeconds: 0,
    breakProgressSeconds: 0,
    breakProgress: 0,
    activeEarThreshold: defaultSettings.thresholds.earThreshold,
    calibrationStatus: 'not-started',
    calibrationProgress: 0
  },
  overlay: defaultOverlayState
}
