import type { BlinkDetectionState } from './monitoringTypes'

interface BlinkDetectorInput {
  ear: number
  closeThreshold: number
  openThreshold: number
  blinkMinDurationMs: number
  blinkMaxDurationMs: number
  timestamp: number
  trackingEnabled: boolean
  state: BlinkDetectionState
}

export function detectBlink(input: BlinkDetectorInput): BlinkDetectionState {
  const deltaMs = input.state.lastTimestamp ? Math.max(0, input.timestamp - input.state.lastTimestamp) : 0

  if (!input.trackingEnabled) {
    return {
      ...input.state,
      closedEyesStartedAt: undefined,
      eyeClosureSeconds: 0,
      lastTimestamp: input.timestamp
    }
  }

  if (input.state.closedEyesStartedAt !== undefined || input.ear <= input.closeThreshold) {
    const closedEyesStartedAt = input.state.closedEyesStartedAt ?? input.timestamp

    if (input.ear >= input.openThreshold) {
      const closedDurationMs = input.timestamp - closedEyesStartedAt
      const isBlink =
        closedDurationMs >= input.blinkMinDurationMs && closedDurationMs <= input.blinkMaxDurationMs

      return {
        closedEyesStartedAt: undefined,
        eyeClosureSeconds: 0,
        blinkCount: input.state.blinkCount + (isBlink ? 1 : 0),
        lastBlinkAt: isBlink ? input.timestamp : input.state.lastBlinkAt,
        lastTimestamp: input.timestamp,
        openEyesSinceBlinkMs: isBlink ? 0 : input.state.openEyesSinceBlinkMs
      }
    }

    return {
      ...input.state,
      closedEyesStartedAt,
      eyeClosureSeconds: Number(((input.timestamp - closedEyesStartedAt) / 1000).toFixed(2)),
      lastTimestamp: input.timestamp
    }
  }

  return {
    ...input.state,
    closedEyesStartedAt: undefined,
    eyeClosureSeconds: 0,
    lastTimestamp: input.timestamp,
    openEyesSinceBlinkMs: input.state.openEyesSinceBlinkMs + deltaMs
  }
}
