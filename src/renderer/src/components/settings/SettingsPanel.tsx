import type { AppSettings } from '@shared/types'
import { CameraSelector } from './CameraSelector'
import { ThresholdControls } from './ThresholdControls'
import { BreakSettings } from './BreakSettings'
import { OverlaySettings } from './OverlaySettings'

interface SettingsPanelProps {
  settings: AppSettings
  devices: MediaDeviceInfo[]
  onSave(settings: Partial<AppSettings>): void
}

export function SettingsPanel({ settings, devices, onSave }: SettingsPanelProps) {
  return (
    <section className="card">
      <h2>Controls & Settings</h2>
      <CameraSelector
        devices={devices}
        selectedCameraId={settings.selectedCameraId}
        onChange={(selectedCameraId) => onSave({ selectedCameraId })}
      />
      <ThresholdControls thresholds={settings.thresholds} onChange={(thresholds) => onSave({ thresholds })} />
      <div className="stack section-block">
        <label className="field checkbox">
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(event) => onSave({ notificationsEnabled: event.target.checked })}
          />
          Enable sound and desktop notifications
        </label>
        <label className="field checkbox">
          <input
            type="checkbox"
            checked={settings.drowsinessWarningsEnabled}
            onChange={(event) => onSave({ drowsinessWarningsEnabled: event.target.checked })}
          />
          Enable drowsiness warning
        </label>
      </div>
      <BreakSettings settings={settings.breakSettings} onChange={(breakSettings) => onSave({ breakSettings })} />
      <OverlaySettings settings={settings.overlay} onChange={(overlay) => onSave({ overlay })} />
    </section>
  )
}
