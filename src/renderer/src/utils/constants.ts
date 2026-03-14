import type { AppSettings, MonitoringSnapshot } from '@shared/types'

export const defaultRendererSettings: AppSettings = {
  startMinimized: false,
  launchOnStartup: false,
  notificationsEnabled: true,
  drowsinessWarningsEnabled: true,
  selectedCameraId: undefined,
  breakSettings: {
    enabled: true,
    intervalMinutes: 20,
    durationMinutes: 2
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

export const initialSnapshot: MonitoringSnapshot = {
  status: 'idle',
  metrics: {
    ear: 0,
    smoothedEar: 0,
    blinkCount: 0,
    eyeStrainScore: 0,
    eyeStrainProgress: 0,
    timeSinceLastBlinkSeconds: 0,
    faceDetected: false,
    brightnessScore: 0,
    elapsedSeconds: 0,
    eyeClosureSeconds: 0,
    activeEarThreshold: defaultRendererSettings.thresholds.earThreshold,
    calibrationStatus: 'not-started',
    calibrationProgress: 0
  },
  overlay: {
    visible: true,
    status: 'idle',
    label: 'Idle',
    sublabel: 'Waiting to start',
    progress: 0
  }
}


