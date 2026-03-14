function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function normalizePersistedEarThreshold(
  persistedEarThreshold: number | undefined,
  fallbackEarThreshold: number
) {
  if (persistedEarThreshold === undefined) {
    return fallbackEarThreshold
  }

  if (persistedEarThreshold > fallbackEarThreshold) {
    return fallbackEarThreshold
  }

  return persistedEarThreshold
}

export function normalizePersistedBreakDurationSeconds(
  persistedBreakSettings:
    | {
        durationSeconds?: number
        durationMinutes?: number
      }
    | undefined,
  fallbackDurationSeconds: number
) {
  if (typeof persistedBreakSettings?.durationSeconds === 'number') {
    return clamp(Math.round(persistedBreakSettings.durationSeconds), 5, 120)
  }

  if (typeof persistedBreakSettings?.durationMinutes === 'number') {
    return fallbackDurationSeconds
  }

  return fallbackDurationSeconds
}
