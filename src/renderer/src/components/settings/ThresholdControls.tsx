import type { ThresholdSettings } from '@shared/types'
import { clamp } from '@renderer/utils/numbers'

export function ThresholdControls({
  thresholds,
  onChange
}: {
  thresholds: ThresholdSettings
  onChange(value: ThresholdSettings): void
}) {
  const updateBlinkReminder = (value: number) => {
    onChange({
      ...thresholds,
      blinkReminderSeconds: Number(clamp(value, 3, 30).toFixed(1))
    })
  }

  const updateDrowsinessDelay = (value: number) => {
    onChange({
      ...thresholds,
      drowsinessHoldSeconds: Number(clamp(value, 1, 10).toFixed(1))
    })
  }

  return (
    <div className="stack">
      <label className="field">
        Blink reminder delay (seconds)
        <div className="range-row">
          <input
            type="range"
            min="3"
            max="30"
            step="0.5"
            value={thresholds.blinkReminderSeconds}
            onChange={(event) => updateBlinkReminder(Number(event.target.value))}
          />
          <input
            type="number"
            min="3"
            max="30"
            step="0.5"
            value={thresholds.blinkReminderSeconds}
            onChange={(event) => updateBlinkReminder(Number(event.target.value))}
          />
        </div>
      </label>
      <label className="field">
        Drowsiness warning delay (seconds)
        <div className="range-row">
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={thresholds.drowsinessHoldSeconds}
            onChange={(event) => updateDrowsinessDelay(Number(event.target.value))}
          />
          <input
            type="number"
            min="1"
            max="10"
            step="0.5"
            value={thresholds.drowsinessHoldSeconds}
            onChange={(event) => updateDrowsinessDelay(Number(event.target.value))}
          />
        </div>
      </label>
      <p className="helper-text">
        Blink reminders use open-eye time while you are actively looking at the screen. Looking away pauses the timer.
        Drowsiness warnings only trigger on sustained eye closure.
      </p>
    </div>
  )
}
