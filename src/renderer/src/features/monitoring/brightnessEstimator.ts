export function normalizeBrightness(rawBrightness: number) {
  return Math.min(1, Math.max(0, rawBrightness))
}
