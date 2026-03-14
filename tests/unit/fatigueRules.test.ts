import { describe, expect, it } from 'vitest'
import { deriveMonitoringState } from '../../src/renderer/src/features/monitoring/fatigueRules'

const thresholds = {
  earThreshold: 0.21,
  blinkReminderSeconds: 8,
  drowsinessHoldSeconds: 3.5,
  lowLightThreshold: 0.22
}

describe('deriveMonitoringState', () => {
  it('reports no-face before other states', () => {
    expect(
      deriveMonitoringState({
        brightnessScore: 0.8,
        elapsedSeconds: 120,
        faceDetected: false,
        thresholds,
        breakSettings: { enabled: true, intervalMinutes: 20 },
        eyeClosureSeconds: 0,
        timeSinceLastBlinkSeconds: 0,
        calibrationStatus: 'ready',
        drowsinessWarningsEnabled: true
      }).status
    ).toBe('no-face')
  })

  it('stays in calibration-needed until calibration is ready', () => {
    expect(
      deriveMonitoringState({
        brightnessScore: 0.7,
        elapsedSeconds: 60,
        faceDetected: true,
        thresholds,
        breakSettings: { enabled: true, intervalMinutes: 20 },
        eyeClosureSeconds: 0,
        timeSinceLastBlinkSeconds: 0,
        calibrationStatus: 'not-started',
        drowsinessWarningsEnabled: true
      }).status
    ).toBe('calibration-needed')
  })

  it('reports blink-reminder after a sustained open-eye streak', () => {
    expect(
      deriveMonitoringState({
        brightnessScore: 0.7,
        elapsedSeconds: 240,
        faceDetected: true,
        thresholds,
        breakSettings: { enabled: true, intervalMinutes: 20 },
        eyeClosureSeconds: 0.2,
        timeSinceLastBlinkSeconds: 8.4,
        calibrationStatus: 'ready',
        drowsinessWarningsEnabled: true
      }).status
    ).toBe('blink-reminder')
  })

  it('reports drowsiness-warning after sustained closure when enabled', () => {
    expect(
      deriveMonitoringState({
        brightnessScore: 0.7,
        elapsedSeconds: 240,
        faceDetected: true,
        thresholds,
        breakSettings: { enabled: true, intervalMinutes: 20 },
        eyeClosureSeconds: 3.7,
        timeSinceLastBlinkSeconds: 1,
        calibrationStatus: 'ready',
        drowsinessWarningsEnabled: true
      }).status
    ).toBe('drowsiness-warning')
  })

  it('falls back to break-due when drowsiness warnings are disabled', () => {
    expect(
      deriveMonitoringState({
        brightnessScore: 0.7,
        elapsedSeconds: 1200,
        faceDetected: true,
        thresholds,
        breakSettings: { enabled: true, intervalMinutes: 20 },
        eyeClosureSeconds: 3.7,
        timeSinceLastBlinkSeconds: 0.5,
        calibrationStatus: 'ready',
        drowsinessWarningsEnabled: false
      }).status
    ).toBe('break-due')
  })
})
