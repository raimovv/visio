interface BlinkThresholds {
  closeThreshold: number
  openThreshold: number
}

const MIN_CALIBRATION_SAMPLES = 45
const MIN_CALIBRATION_EAR = 0.1
const MAX_CALIBRATION_EAR = 0.6

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function percentile(sortedValues: number[], ratio: number) {
  if (sortedValues.length === 0) {
    return 0
  }

  const index = (sortedValues.length - 1) * ratio
  const lowerIndex = Math.floor(index)
  const upperIndex = Math.ceil(index)

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex]
  }

  const weight = index - lowerIndex
  return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight
}

export function computeBlinkThresholds(
  baselineEar: number | undefined,
  minimumEarThreshold: number
): BlinkThresholds {
  if (!baselineEar) {
    const closeThreshold = minimumEarThreshold
    return {
      closeThreshold,
      openThreshold: Number((closeThreshold + 0.03).toFixed(3))
    }
  }

  const closeThreshold = Number(Math.max(minimumEarThreshold, baselineEar * 0.52).toFixed(3))
  const openThreshold = Number(Math.max(closeThreshold + 0.018, baselineEar * 0.6).toFixed(3))

  return { closeThreshold, openThreshold }
}

export function finalizeCalibrationBaseline(samples: number[], minimumEarThreshold: number) {
  const validSamples = samples
    .filter((sample) => sample >= MIN_CALIBRATION_EAR && sample <= MAX_CALIBRATION_EAR)
    .sort((left, right) => left - right)

  if (validSamples.length < MIN_CALIBRATION_SAMPLES) {
    return undefined
  }

  const start = Math.floor(validSamples.length * 0.15)
  const end = Math.max(start + 1, Math.ceil(validSamples.length * 0.8))
  const trimmed = validSamples.slice(start, end)
  const baseline = percentile(trimmed, 0.35)

  return Number(clamp(baseline, Math.max(minimumEarThreshold, MIN_CALIBRATION_EAR), 0.5).toFixed(3))
}
