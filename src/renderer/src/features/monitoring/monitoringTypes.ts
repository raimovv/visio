import type { CalibrationStatus, MonitoringStatus, MonitoringSnapshot } from '@shared/types'
import type { BlinkCalibrationProfile } from './thresholds'
import type { EyeBlendshapeSignals, HeadPose } from '@renderer/features/mediapipe/landmarkTypes'

export interface MonitoringFrameInput {
  leftEar: number
  rightEar: number
  brightnessScore: number
  faceDetected: boolean
  eyeSignals: EyeBlendshapeSignals
  headPose?: HeadPose
  timestamp: number
}

export interface BlinkFrameSample {
  timestamp: number
  averageEar: number
  closureScore: number
}

export interface BlinkDetectionState {
  recentSamples: BlinkFrameSample[]
  closedEyesStartedAt?: number
  eyeClosureSeconds: number
  blinkCount: number
  lastBlinkAt?: number
  lastTimestamp?: number
  blinkDetected: boolean
  peakClosureScore?: number
  minCombinedEar?: number
}

export interface CalibrationSample {
  leftEar: number
  rightEar: number
}

export interface CalibrationRuntimeState {
  status: CalibrationStatus
  startedAt?: number
  durationMs: number
  samples: CalibrationSample[]
  profile?: BlinkCalibrationProfile
}

export interface BreakRuntimeState {
  lastTimestamp?: number
  workCycleElapsedMs: number
  breakConfirmMs: number
  breakProgressMs: number
  completedBreaks: number
  breakTakenAt: string[]
}

export interface MonitoringRuntimeState {
  blink: BlinkDetectionState
  calibration: CalibrationRuntimeState
  breakCycle: BreakRuntimeState
  smoothedEar?: number
  timeSinceLastBlinkMs: number
  lastFrameTimestamp?: number
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
