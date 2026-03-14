import type { OverlaySettings as OverlaySettingsType } from '@shared/types'

export function OverlaySettings({
  settings,
  onChange
}: {
  settings: OverlaySettingsType
  onChange(value: OverlaySettingsType): void
}) {
  return (
    <div className="stack">
      <label className="field checkbox">
        <input
          type="checkbox"
          checked={settings.visible}
          onChange={(event) => onChange({ ...settings, visible: event.target.checked })}
        />
        Show overlay
      </label>
      <label className="field">
        Overlay corner
        <select value={settings.corner} onChange={(event) => onChange({ ...settings, corner: event.target.value as OverlaySettingsType['corner'] })}>
          <option value="top-right">Top right</option>
          <option value="top-left">Top left</option>
          <option value="bottom-right">Bottom right</option>
          <option value="bottom-left">Bottom left</option>
        </select>
      </label>
      <label className="field checkbox">
        <input
          type="checkbox"
          checked={settings.clickThrough}
          onChange={(event) => onChange({ ...settings, clickThrough: event.target.checked })}
        />
        Click-through overlay
      </label>
      <p className="helper-text">Turn click-through off to use the overlay button and drag handle.</p>
    </div>
  )
}
