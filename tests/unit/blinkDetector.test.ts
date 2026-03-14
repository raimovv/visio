import { describe, expect, it } from 'vitest'
import { detectBlink } from '../../src/renderer/src/features/monitoring/blinkDetector'
import type { BlinkThresholds } from '../../src/renderer/src/features/monitoring/thresholds'

const thresholds: BlinkThresholds = {
  leftCloseThreshold: 0.16,
  rightCloseThreshold: 0.17,
  leftOpenThreshold: 0.24,
  rightOpenThreshold: 0.27,
  closeThreshold: 0.165,
  openThreshold: 0.255
}

describe('detectBlink', () => {
  it('tracks eye closure duration while the eyes remain closed', () => {
    const next = detectBlink({
      leftEar: 0.12,
      rightEar: 0.11,
      blinkLeftScore: 0.82,
      blinkRightScore: 0.84,
      thresholds,
      blinkMinDurationMs: 60,
      blinkMaxDurationMs: 1000,
      timestamp: 120,
      trackingEnabled: true,
      state: {
        recentSamples: [{ timestamp: 80, averageEar: 0.12, closureScore: 0.88 }],
        closedEyesStartedAt: 20,
        eyeClosureSeconds: 0.05,
        blinkCount: 0,
        blinkDetected: false,
        peakClosureScore: 0.88,
        minCombinedEar: 0.12
      }
    })

    expect(next.closedEyesStartedAt).toBe(20)
    expect(next.eyeClosureSeconds).toBeCloseTo(0.1, 2)
    expect(next.blinkCount).toBe(0)
    expect(next.blinkDetected).toBe(false)
  })

  it('counts a blink once both eyes reopen after a short closure', () => {
    const next = detectBlink({
      leftEar: 0.31,
      rightEar: 0.32,
      blinkLeftScore: 0.08,
      blinkRightScore: 0.07,
      thresholds,
      blinkMinDurationMs: 60,
      blinkMaxDurationMs: 1000,
      timestamp: 410,
      trackingEnabled: true,
      state: {
        recentSamples: [
          { timestamp: 220, averageEar: 0.13, closureScore: 0.93 },
          { timestamp: 280, averageEar: 0.11, closureScore: 0.97 }
        ],
        closedEyesStartedAt: 200,
        eyeClosureSeconds: 0.21,
        blinkCount: 2,
        blinkDetected: false,
        peakClosureScore: 0.97,
        minCombinedEar: 0.11
      }
    })

    expect(next.closedEyesStartedAt).toBeUndefined()
    expect(next.eyeClosureSeconds).toBe(0)
    expect(next.blinkCount).toBe(3)
    expect(next.lastBlinkAt).toBe(410)
    expect(next.blinkDetected).toBe(true)
  })
})
