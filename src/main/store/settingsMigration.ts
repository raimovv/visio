export function normalizePersistedEarThreshold(
  persistedEarThreshold: number | undefined,
  fallbackEarThreshold: number
) {
  if (persistedEarThreshold === undefined) {
    return fallbackEarThreshold
  }

  // In the current model this value is only a conservative fallback floor.
  // Older builds stored learned thresholds here, which can be much higher and break blink detection.
  if (persistedEarThreshold > fallbackEarThreshold) {
    return fallbackEarThreshold
  }

  return persistedEarThreshold
}
