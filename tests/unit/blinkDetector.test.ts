import { describe, expect, it } from 'vitest'
import { detectBlink } from '../../src/renderer/src/features/monitoring/blinkDetector'

describe('detectBlink', () => {
  it('tracks eye closure duration while the eye is closed', () => {
    const next = detectBlink({
      ear: 0.15,
      closeThreshold: 0.2,
      openThreshold: 0.24,
      blinkMinDurationMs: 80,
      blinkMaxDurationMs: 600,
      timestamp: 120,
      trackingEnabled: true,
      state: { closedEyesStartedAt: 20, eyeClosureSeconds: 0.05, blinkCount: 0, openEyesSinceBlinkMs: 0 }
    })

    expect(next.closedEyesStartedAt).toBe(20)
    expect(next.eyeClosureSeconds).toBeCloseTo(0.1, 2)
    expect(next.blinkCount).toBe(0)
  })

  it('counts a blink once the eye reopens after a short closure', () => {
    const next = detectBlink({
      ear: 0.3,
      closeThreshold: 0.2,
      openThreshold: 0.24,
      blinkMinDurationMs: 80,
      blinkMaxDurationMs: 600,
      timestamp: 410,
      trackingEnabled: true,
      state: {
        closedEyesStartedAt: 200,
        eyeClosureSeconds: 0.21,
        blinkCount: 2,
        openEyesSinceBlinkMs: 140
      }
    })

    expect(next.closedEyesStartedAt).toBeUndefined()
    expect(next.eyeClosureSeconds).toBe(0)
    expect(next.blinkCount).toBe(3)
    expect(next.lastBlinkAt).toBe(410)
    expect(next.openEyesSinceBlinkMs).toBe(0)
  })
})
