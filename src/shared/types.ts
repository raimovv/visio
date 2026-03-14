export type MonitoringStatus =
  | 'idle'
  | 'initializing'
  | 'calibration-needed'
  | 'calibrating'
  | 'monitoring'
  | 'blink-reminder'
  | 'paused'
  | 'no-face'
  | 'low-light'
  | 'drowsiness-warning'
  | 'break-due'
  | 'break-in-progress'
  | 'camera-error'

export type CalibrationStatus = 'not-started' | 'running' | 'ready'

export interface MonitoringMetrics {
  ear: number
  leftEar: number
  rightEar: number
  smoothedEar: number
  blinkCount: number
  eyeStrainScore: number
  eyeStrainProgress: number
  timeSinceLastBlinkSeconds: number
  faceDetected: boolean
  screenFacing: boolean
  brightnessScore: number
  elapsedSeconds: number
  workCycleElapsedSeconds: number
  eyeClosureSeconds: number
  breakProgressSeconds: number
  breakProgress: number
  activeEarThreshold: number
  baselineEar?: number
  calibrationStatus: CalibrationStatus
  calibrationProgress: number
  lastBlinkAt?: string
}

export interface OverlayState {
  visible: boolean
  status: MonitoringStatus
  label: string
  sublabel: string
  progress: number
}

export interface BreakSettings {
  enabled: boolean
  intervalMinutes: number
  durationSeconds: number
}

export interface OverlaySettings {
  visible: boolean
  corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  clickThrough: boolean
}

export interface ThresholdSettings {
  earThreshold: number
  blinkReminderSeconds: number
  drowsinessHoldSeconds: number
  lowLightThreshold: number
}

export interface AppSettings {
  selectedCameraId?: string
  startMinimized: boolean
  launchOnStartup: boolean
  notificationsEnabled: boolean
  drowsinessWarningsEnabled: boolean
  breakSettings: BreakSettings
  overlay: OverlaySettings
  thresholds: ThresholdSettings
}

export interface SessionSummary {
  id: string
  startedAt: string
  endedAt?: string
  blinkCount: number
  averageEar: number
  fatigueEvents: number
  breakAlerts: number
  completedBreaks: number
  breakTakenAt: string[]
  durationSeconds: number
}

export interface MonitoringSnapshot {
  status: MonitoringStatus
  metrics: MonitoringMetrics
  overlay: OverlayState
  activeSession?: SessionSummary
}

export interface NotificationPayload {
  title: string
  body: string
}
