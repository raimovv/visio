import type { BreakSettings } from '@shared/types'
import type { BreakRuntimeState } from './monitoringTypes'

interface UpdateBreakCycleInput {
  state: BreakRuntimeState
  timestamp: number
  settings: BreakSettings
  faceDetected: boolean
  screenFacing: boolean
}

interface BreakCycleUpdate {
  state: BreakRuntimeState
  due: boolean
  inProgress: boolean
  justCompleted: boolean
  workCycleElapsedSeconds: number
  breakProgressSeconds: number
  breakProgress: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function createBreakRuntimeState(): BreakRuntimeState {
  return {
    workCycleElapsedMs: 0,
    breakProgressMs: 0,
    completedBreaks: 0,
    breakTakenAt: []
  }
}

export function updateBreakCycle(input: UpdateBreakCycleInput): BreakCycleUpdate {
  const intervalMs = input.settings.intervalMinutes * 60 * 1000
  const breakDurationMs = input.settings.durationSeconds * 1000
  const deltaMs = input.state.lastTimestamp !== undefined ? Math.max(0, input.timestamp - input.state.lastTimestamp) : 0

  if (!input.settings.enabled) {
    return {
      state: {
        ...createBreakRuntimeState(),
        lastTimestamp: input.timestamp
      },
      due: false,
      inProgress: false,
      justCompleted: false,
      workCycleElapsedSeconds: 0,
      breakProgressSeconds: 0,
      breakProgress: 0
    }
  }

  let workCycleElapsedMs = input.state.workCycleElapsedMs
  let breakProgressMs = input.state.breakProgressMs
  let completedBreaks = input.state.completedBreaks
  let breakTakenAt = input.state.breakTakenAt
  const isAwayFromScreen = !input.faceDetected || !input.screenFacing

  if (workCycleElapsedMs < intervalMs && input.faceDetected && input.screenFacing) {
    workCycleElapsedMs = Math.min(intervalMs, workCycleElapsedMs + deltaMs)
  }

  let breakDue = workCycleElapsedMs >= intervalMs
  let justCompleted = false

  if (breakDue) {
    if (isAwayFromScreen) {
      breakProgressMs = Math.min(breakDurationMs, breakProgressMs + deltaMs)
      if (breakProgressMs >= breakDurationMs) {
        justCompleted = true
        completedBreaks += 1
        breakTakenAt = [...breakTakenAt, new Date(input.timestamp).toISOString()]
        workCycleElapsedMs = 0
        breakProgressMs = 0
        breakDue = false
      }
    } else if (breakProgressMs > 0) {
      breakProgressMs = 0
    }
  } else if (breakProgressMs > 0) {
    breakProgressMs = 0
  }

  return {
    state: {
      lastTimestamp: input.timestamp,
      workCycleElapsedMs,
      breakProgressMs,
      completedBreaks,
      breakTakenAt
    },
    due: breakDue,
    inProgress: breakProgressMs > 0,
    justCompleted,
    workCycleElapsedSeconds: Number((workCycleElapsedMs / 1000).toFixed(2)),
    breakProgressSeconds: Number((breakProgressMs / 1000).toFixed(2)),
    breakProgress: Number(clamp(breakProgressMs / breakDurationMs, 0, 1).toFixed(2))
  }
}

