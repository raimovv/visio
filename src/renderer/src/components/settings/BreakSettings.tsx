import type { BreakSettings as BreakSettingsType } from '@shared/types'

export function BreakSettings({
  settings,
  onChange
}: {
  settings: BreakSettingsType
  onChange(value: BreakSettingsType): void
}) {
  return (
    <section className="stack section-block">
      <h3>20-20-20 Breaks</h3>
      <label className="field checkbox">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(event) => onChange({ ...settings, enabled: event.target.checked })}
        />
        Enable 20-20-20 break reminders
      </label>
      <p className="helper-text">
        Visio tracks active on-screen work, reminds you after {settings.intervalMinutes} minutes, and only logs the
        break once you stay away from the screen for {settings.durationSeconds} continuous seconds.
      </p>
    </section>
  )
}
