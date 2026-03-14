import type { CalibrationSample } from './monitoringTypes'

export interface BlinkCalibrationProfile {
  leftBaselineEar: number
  rightBaselineEar: number
  combinedBaselineEar: number
}

export interface BlinkThresholds {
  leftCloseThreshold: number
  rightCloseThreshold: number
  leftOpenThreshold: number
  rightOpenThreshold: number
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

function finalizeEyeBaseline(values: number[], minimumEarThreshold: number) {
  const validSamples = values
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

function computeEyeThresholds(baselineEar: number | undefined, minimumEarThreshold: number) {
  if (!baselineEar) {
    const closeThreshold = minimumEarThreshold
    return {
      closeThreshold,
      openThreshold: Number((closeThreshold + 0.04).toFixed(3))
    }
  }

  const closeThreshold = Number(Math.max(minimumEarThreshold, baselineEar * 0.4).toFixed(3))
  const openThreshold = Number(Math.max(closeThreshold + 0.04, baselineEar * 0.62).toFixed(3))

  return { closeThreshold, openThreshold }
}

export function computeBlinkThresholds(
  profile: BlinkCalibrationProfile | undefined,
  minimumEarThreshold: number
): BlinkThresholds {
  const left = computeEyeThresholds(profile?.leftBaselineEar, minimumEarThreshold)
  const right = computeEyeThresholds(profile?.rightBaselineEar, minimumEarThreshold)

  return {
    leftCloseThreshold: left.closeThreshold,
    rightCloseThreshold: right.closeThreshold,
    leftOpenThreshold: left.openThreshold,
    rightOpenThreshold: right.openThreshold,
    closeThreshold: Number(((left.closeThreshold + right.closeThreshold) / 2).toFixed(3)),
    openThreshold: Number(((left.openThreshold + right.openThreshold) / 2).toFixed(3))
  }
}

export function finalizeCalibrationBaseline(samples: CalibrationSample[], minimumEarThreshold: number) {
  const leftBaselineEar = finalizeEyeBaseline(
    samples.map((sample) => sample.leftEar),
    minimumEarThreshold
  )
  const rightBaselineEar = finalizeEyeBaseline(
    samples.map((sample) => sample.rightEar),
    minimumEarThreshold
  )

  if (!leftBaselineEar || !rightBaselineEar) {
    return undefined
  }

  return {
    leftBaselineEar,
    rightBaselineEar,
    combinedBaselineEar: Number(((leftBaselineEar + rightBaselineEar) / 2).toFixed(3))
  } satisfies BlinkCalibrationProfile
}
