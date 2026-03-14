import type { CalibrationStatus, MonitoringStatus, MonitoringSnapshot } from '@shared/types'

export interface MonitoringFrameInput {
  leftEye: [number, number][]
  rightEye: [number, number][]
  brightnessScore: number
  faceDetected: boolean
  timestamp: number
}

export interface BlinkDetectionState {
  closedEyesStartedAt?: number
  eyeClosureSeconds: number
  blinkCount: number
  lastBlinkAt?: number
  lastTimestamp?: number
  openEyesSinceBlinkMs: number
}

export interface CalibrationRuntimeState {
  status: CalibrationStatus
  startedAt?: number
  durationMs: number
  samples: number[]
}

export interface MonitoringRuntimeState {
  blink: BlinkDetectionState
  calibration: CalibrationRuntimeState
  smoothedEar?: number
}

export interface MonitoringActions {
  paused: boolean
  running: boolean
  start(): void
  stop(): void
  pauseResume(): void
  hideDashboard(): void
}

export interface CalibrationControls {
  running: boolean
  ready: boolean
  canStart: boolean
  start(): void
}

export interface MonitoringControllerResult {
  snapshot: MonitoringSnapshot
  runtime: MonitoringRuntimeState
}

export type AlertStatus = Extract<
  MonitoringStatus,
  'blink-reminder' | 'drowsiness-warning' | 'break-due' | 'camera-error'
>
