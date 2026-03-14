import type { BreakSettings as BreakSettingsType } from '@shared/types'

export function BreakSettings({
  settings,
  onChange
}: {
  settings: BreakSettingsType
  onChange(value: BreakSettingsType): void
}) {
  return (
    <label className="field checkbox">
      <input
        type="checkbox"
        checked={settings.enabled}
        onChange={(event) => onChange({ ...settings, enabled: event.target.checked })}
      />
      Enable break reminders
    </label>
  )
}
