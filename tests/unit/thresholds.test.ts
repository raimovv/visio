import { describe, expect, it } from 'vitest'
import { computeBlinkThresholds, finalizeCalibrationBaseline } from '../../src/renderer/src/features/monitoring/thresholds'

describe('computeBlinkThresholds', () => {
  it('derives conservative per-eye thresholds from the calibrated baseline', () => {
    const thresholds = computeBlinkThresholds(
      {
        leftBaselineEar: 0.39,
        rightBaselineEar: 0.43,
        combinedBaselineEar: 0.41
      },
      0.12
    )

    expect(thresholds.leftCloseThreshold).toBe(0.156)
    expect(thresholds.rightCloseThreshold).toBe(0.172)
    expect(thresholds.closeThreshold).toBe(0.164)
    expect(thresholds.openThreshold).toBe(0.255)
  })

  it('falls back to the minimum floor when there is no baseline yet', () => {
    const thresholds = computeBlinkThresholds(undefined, 0.12)

    expect(thresholds.closeThreshold).toBe(0.12)
    expect(thresholds.openThreshold).toBe(0.16)
  })
})

describe('finalizeCalibrationBaseline', () => {
  it('biases calibration away from wide-eye outliers while preserving relaxed eye baselines', () => {
    const samples = [
      ...Array.from({ length: 50 }, (_, index) => ({ leftEar: 0.32 + (index % 5) * 0.01, rightEar: 0.34 + (index % 5) * 0.01 })),
      ...Array.from({ length: 10 }, () => ({ leftEar: 0.47, rightEar: 0.48 }))
    ]

    const baseline = finalizeCalibrationBaseline(samples, 0.12)

    expect(baseline).toBeDefined()
    expect(baseline!.combinedBaselineEar).toBeLessThan(0.4)
    expect(baseline!.combinedBaselineEar).toBeGreaterThan(0.32)
  })
})
