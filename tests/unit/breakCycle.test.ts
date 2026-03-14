import { describe, expect, it } from 'vitest'
import { createBreakRuntimeState, updateBreakCycle } from '../../src/renderer/src/features/monitoring/breakCycle'

const settings = {
  enabled: true,
  intervalMinutes: 20,
  durationSeconds: 20
}

describe('updateBreakCycle', () => {
  it('triggers a break after 20 minutes of active screen-facing work', () => {
    let state = createBreakRuntimeState()
    state = updateBreakCycle({ state, timestamp: 0, settings, faceDetected: true, screenFacing: true }).state

    const next = updateBreakCycle({
      state,
      timestamp: 20 * 60 * 1000,
      settings,
      faceDetected: true,
      screenFacing: true
    })

    expect(next.due).toBe(true)
    expect(next.workCycleElapsedSeconds).toBe(1200)
  })

  it('waits 5 seconds of no-face time before starting the 20-second break countdown', () => {
    const next = updateBreakCycle({
      state: { ...createBreakRuntimeState(), lastTimestamp: 0, workCycleElapsedMs: 20 * 60 * 1000, breakConfirmMs: 0, breakProgressMs: 0, completedBreaks: 0, breakTakenAt: [] },
      timestamp: 4000,
      settings,
      faceDetected: false,
      screenFacing: false
    })

    expect(next.breakConfirmationSeconds).toBe(4)
    expect(next.breakProgressSeconds).toBe(0)
    expect(next.inProgress).toBe(false)
  })

  it('completes and logs a break after 5 seconds confirm plus 20 seconds no-face countdown', () => {
    const next = updateBreakCycle({
      state: { ...createBreakRuntimeState(), lastTimestamp: 0, workCycleElapsedMs: 20 * 60 * 1000, breakConfirmMs: 0, breakProgressMs: 0, completedBreaks: 0, breakTakenAt: [] },
      timestamp: 25000,
      settings,
      faceDetected: false,
      screenFacing: false
    })

    expect(next.justCompleted).toBe(true)
    expect(next.due).toBe(false)
    expect(next.state.completedBreaks).toBe(1)
    expect(next.state.breakTakenAt).toHaveLength(1)
    expect(next.workCycleElapsedSeconds).toBe(0)
  })
})
