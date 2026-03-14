import { describe, expect, it } from 'vitest'
import { computeBlinkThresholds, finalizeCalibrationBaseline } from '../../src/renderer/src/features/monitoring/thresholds'

describe('computeBlinkThresholds', () => {
  it('derives a conservative close threshold from the calibrated baseline', () => {
    const thresholds = computeBlinkThresholds(0.41, 0.12)

    expect(thresholds.closeThreshold).toBe(0.213)
    expect(thresholds.openThreshold).toBe(0.246)
  })

  it('falls back to the minimum floor when there is no baseline yet', () => {
    const thresholds = computeBlinkThresholds(undefined, 0.12)

    expect(thresholds.closeThreshold).toBe(0.12)
    expect(thresholds.openThreshold).toBe(0.15)
  })
})

describe('finalizeCalibrationBaseline', () => {
  it('biases calibration away from wide-eye outliers', () => {
    const samples = [
      ...Array.from({ length: 50 }, (_, index) => 0.33 + (index % 5) * 0.01),
      ...Array.from({ length: 10 }, () => 0.46)
    ]

    const baseline = finalizeCalibrationBaseline(samples, 0.12)

    expect(baseline).toBeDefined()
    expect(baseline!).toBeLessThan(0.4)
    expect(baseline!).toBeGreaterThan(0.32)
  })
})
