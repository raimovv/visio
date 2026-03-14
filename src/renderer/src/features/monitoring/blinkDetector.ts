import type { BlinkDetectionState } from './monitoringTypes'
import type { BlinkThresholds } from './thresholds'

interface BlinkDetectorInput {
  leftEar: number
  rightEar: number
  blinkLeftScore: number
  blinkRightScore: number
  thresholds: BlinkThresholds
  blinkMinDurationMs: number
  blinkMaxDurationMs: number
  timestamp: number
  trackingEnabled: boolean
  state: BlinkDetectionState
}

const SAMPLE_WINDOW_MS = 1600
const CLOSED_SCORE_THRESHOLD = 0.74
const OPEN_SCORE_THRESHOLD = 0.34

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toClosureScore(ear: number, closeThreshold: number, openThreshold: number, blinkScore: number) {
  const span = Math.max(0.02, openThreshold - closeThreshold)
  const earClosure = clamp((openThreshold - ear) / span, 0, 1)
  const blended = blinkScore > 0 ? earClosure * 0.55 + blinkScore * 0.45 : earClosure
  return Number(clamp(blended, 0, 1).toFixed(3))
}

export function detectBlink(input: BlinkDetectorInput): BlinkDetectionState {
  const averageEar = Number(((input.leftEar + input.rightEar) / 2).toFixed(3))

  if (!input.trackingEnabled) {
    return {
      ...input.state,
      recentSamples: [],
      closedEyesStartedAt: undefined,
      eyeClosureSeconds: 0,
      lastTimestamp: input.timestamp,
      blinkDetected: false,
      peakClosureScore: undefined,
      minCombinedEar: undefined
    }
  }

  const leftClosureScore = toClosureScore(
    input.leftEar,
    input.thresholds.leftCloseThreshold,
    input.thresholds.leftOpenThreshold,
    input.blinkLeftScore
  )
  const rightClosureScore = toClosureScore(
    input.rightEar,
    input.thresholds.rightCloseThreshold,
    input.thresholds.rightOpenThreshold,
    input.blinkRightScore
  )
  const combinedClosureScore = Number(((leftClosureScore + rightClosureScore) / 2).toFixed(3))
  const strongBlinkSignal = (input.blinkLeftScore + input.blinkRightScore) / 2
  const recentSamples = [...input.state.recentSamples, { timestamp: input.timestamp, averageEar, closureScore: combinedClosureScore }].filter(
    (sample) => sample.timestamp >= input.timestamp - SAMPLE_WINDOW_MS
  )
  const closedNow =
    (leftClosureScore >= 0.68 && rightClosureScore >= 0.68) ||
    combinedClosureScore >= CLOSED_SCORE_THRESHOLD ||
    strongBlinkSignal >= 0.72
  const openNow =
    combinedClosureScore <= OPEN_SCORE_THRESHOLD &&
    leftClosureScore <= 0.45 &&
    rightClosureScore <= 0.45 &&
    strongBlinkSignal <= 0.55

  if (input.state.closedEyesStartedAt !== undefined) {
    const closureStartedAt = input.state.closedEyesStartedAt
    const peakClosureScore = Math.max(input.state.peakClosureScore ?? 0, combinedClosureScore, strongBlinkSignal)
    const minCombinedEar = Math.min(input.state.minCombinedEar ?? averageEar, averageEar)

    if (openNow) {
      const closedDurationMs = input.timestamp - closureStartedAt
      const closureSamples = recentSamples.filter((sample) => sample.timestamp >= closureStartedAt - 80)
      const peakWindowClosure = Math.max(...closureSamples.map((sample) => sample.closureScore), peakClosureScore)
      const minWindowEar = Math.min(...closureSamples.map((sample) => sample.averageEar), minCombinedEar)
      const isBlink =
        closedDurationMs >= input.blinkMinDurationMs &&
        closedDurationMs <= input.blinkMaxDurationMs &&
        peakWindowClosure >= 0.76 &&
        minWindowEar <= input.thresholds.closeThreshold + 0.03

      return {
        recentSamples,
        closedEyesStartedAt: undefined,
        eyeClosureSeconds: 0,
        blinkCount: input.state.blinkCount + (isBlink ? 1 : 0),
        lastBlinkAt: isBlink ? input.timestamp : input.state.lastBlinkAt,
        lastTimestamp: input.timestamp,
        blinkDetected: isBlink,
        peakClosureScore: undefined,
        minCombinedEar: undefined
      }
    }

    return {
      ...input.state,
      recentSamples,
      closedEyesStartedAt: closureStartedAt,
      eyeClosureSeconds: Number(((input.timestamp - closureStartedAt) / 1000).toFixed(2)),
      lastTimestamp: input.timestamp,
      blinkDetected: false,
      peakClosureScore,
      minCombinedEar
    }
  }

  if (closedNow) {
    return {
      ...input.state,
      recentSamples,
      closedEyesStartedAt: input.timestamp,
      eyeClosureSeconds: 0,
      lastTimestamp: input.timestamp,
      blinkDetected: false,
      peakClosureScore: Math.max(combinedClosureScore, strongBlinkSignal),
      minCombinedEar: averageEar
    }
  }

  return {
    ...input.state,
    recentSamples,
    closedEyesStartedAt: undefined,
    eyeClosureSeconds: 0,
    lastTimestamp: input.timestamp,
    blinkDetected: false,
    peakClosureScore: undefined,
    minCombinedEar: undefined
  }
}
