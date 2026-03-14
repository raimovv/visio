import { describe, expect, it } from 'vitest'
import { deriveMonitoringState } from '../../src/renderer/src/features/monitoring/fatigueRules'

const thresholds = {
  earThreshold: 0.12,
  blinkReminderSeconds: 8,
  drowsinessHoldSeconds: 3.5,
  lowLightThreshold: 0.22
}

describe('deriveMonitoringState', () => {
  it('reports no-face before other states', () => {
    expect(
      deriveMonitoringState({
        brightnessScore: 0.8,
        faceDetected: false,
        thresholds,
        breakSettings: { enabled: true, intervalMinutes: 20 },
        eyeClosureSeconds: 0,
        timeSinceLastBlinkSeconds: 0,
        calibrationStatus: 'ready',
        drowsinessWarningsEnabled: true,
        workCycleElapsedSeconds: 120,
        breakProgressSeconds: 0
      }).status
    ).toBe('no-face')
  })

  it('stays in calibration-needed until calibration is ready', () => {
    expect(
      deriveMonitoringState({
        brightnessScore: 0.7,
        faceDetected: true,
        thresholds,
        breakSettings: { enabled: true, intervalMinutes: 20 },
        eyeClosureSeconds: 0,
        timeSinceLastBlinkSeconds: 0,
        calibrationStatus: 'not-started',
        drowsinessWarningsEnabled: true,
        workCycleElapsedSeconds: 60,
        breakProgressSeconds: 0
      }).status
    ).toBe('calibration-needed')
  })

  it('reports blink-reminder after a sustained open-eye streak', () => {
    expect(
      deriveMonitoringState({
        brightnessScore: 0.7,
        faceDetected: true,
        thresholds,
        breakSettings: { enabled: true, intervalMinutes: 20 },
        eyeClosureSeconds: 0.2,
        timeSinceLastBlinkSeconds: 8.4,
        calibrationStatus: 'ready',
        drowsinessWarningsEnabled: true,
        workCycleElapsedSeconds: 240,
        breakProgressSeconds: 0
      }).status
    ).toBe('blink-reminder')
  })

  it('reports drowsiness-warning after sustained closure when enabled', () => {
    expect(
      deriveMonitoringState({
        brightnessScore: 0.7,
        faceDetected: true,
        thresholds,
        breakSettings: { enabled: true, intervalMinutes: 20 },
        eyeClosureSeconds: 3.7,
        timeSinceLastBlinkSeconds: 1,
        calibrationStatus: 'ready',
        drowsinessWarningsEnabled: true,
        workCycleElapsedSeconds: 240,
        breakProgressSeconds: 0
      }).status
    ).toBe('drowsiness-warning')
  })

  it('reports break-due once the 20-minute work cycle is reached', () => {
    expect(
      deriveMonitoringState({
        brightnessScore: 0.7,
        faceDetected: true,
        thresholds,
        breakSettings: { enabled: true, intervalMinutes: 20 },
        eyeClosureSeconds: 0,
        timeSinceLastBlinkSeconds: 2,
        calibrationStatus: 'ready',
        drowsinessWarningsEnabled: false,
        workCycleElapsedSeconds: 1200,
        breakProgressSeconds: 0
      }).status
    ).toBe('break-due')
  })

  it('reports break-in-progress once the no-face break countdown has started', () => {
    expect(
      deriveMonitoringState({
        brightnessScore: 0.7,
        faceDetected: false,
        thresholds,
        breakSettings: { enabled: true, intervalMinutes: 20 },
        eyeClosureSeconds: 0,
        timeSinceLastBlinkSeconds: 2,
        calibrationStatus: 'ready',
        drowsinessWarningsEnabled: false,
        workCycleElapsedSeconds: 1200,
        breakProgressSeconds: 9
      }).status
    ).toBe('break-in-progress')
  })
})
