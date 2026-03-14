import { describe, expect, it } from 'vitest'
import {
  normalizePersistedBreakDurationSeconds,
  normalizePersistedEarThreshold
} from '../../src/main/store/settingsMigration'

describe('normalizePersistedEarThreshold', () => {
  it('resets legacy learned thresholds down to the fallback floor', () => {
    expect(normalizePersistedEarThreshold(0.39, 0.12)).toBe(0.12)
    expect(normalizePersistedEarThreshold(0.21, 0.12)).toBe(0.12)
    expect(normalizePersistedEarThreshold(0.18, 0.12)).toBe(0.12)
  })

  it('keeps valid lower fallback values', () => {
    expect(normalizePersistedEarThreshold(undefined, 0.12)).toBe(0.12)
    expect(normalizePersistedEarThreshold(0.1, 0.12)).toBe(0.1)
  })
})

describe('normalizePersistedBreakDurationSeconds', () => {
  it('forces legacy minute-based settings back to the 20-second rule default', () => {
    expect(normalizePersistedBreakDurationSeconds({ durationMinutes: 2 }, 20)).toBe(20)
  })

  it('keeps new duration-seconds settings in range', () => {
    expect(normalizePersistedBreakDurationSeconds({ durationSeconds: 25 }, 20)).toBe(25)
    expect(normalizePersistedBreakDurationSeconds(undefined, 20)).toBe(20)
  })
})
