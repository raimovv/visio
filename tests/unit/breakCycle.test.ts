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

  it('does not reset the work cycle for a partial away break', () => {
    const start = updateBreakCycle({
      state: { ...createBreakRuntimeState(), lastTimestamp: 0, workCycleElapsedMs: 20 * 60 * 1000, breakProgressMs: 0, completedBreaks: 0, breakTakenAt: [] },
      timestamp: 10000,
      settings,
      faceDetected: false,
      screenFacing: false
    })

    const returned = updateBreakCycle({
      state: start.state,
      timestamp: 12000,
      settings,
      faceDetected: true,
      screenFacing: true
    })

    expect(returned.due).toBe(true)
    expect(returned.breakProgressSeconds).toBe(0)
    expect(returned.workCycleElapsedSeconds).toBe(1200)
  })

  it('completes and logs a break after 20 continuous away seconds', () => {
    const next = updateBreakCycle({
      state: { ...createBreakRuntimeState(), lastTimestamp: 0, workCycleElapsedMs: 20 * 60 * 1000, breakProgressMs: 0, completedBreaks: 0, breakTakenAt: [] },
      timestamp: 20000,
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
