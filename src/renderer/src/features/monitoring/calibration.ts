import type { ThresholdSettings } from '@shared/types'

export function calibrateThresholds(samples: number[], current: ThresholdSettings): ThresholdSettings {
  if (samples.length === 0) return current
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length
  return {
    ...current,
    earThreshold: Number((mean * 0.78).toFixed(3))
  }
}
