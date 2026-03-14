import { describe, expect, it } from 'vitest'
import { calculateEyeAspectRatio } from '../../src/renderer/src/features/monitoring/ear'

describe('calculateEyeAspectRatio', () => {
  it('returns zero for invalid points', () => {
    expect(calculateEyeAspectRatio([])).toBe(0)
  })

  it('calculates the standard EAR ratio', () => {
    const ratio = calculateEyeAspectRatio([
      [0, 0],
      [1, 2],
      [2, 2],
      [4, 0],
      [2, -2],
      [1, -2]
    ])

    expect(ratio).toBeCloseTo(1, 5)
  })
})
