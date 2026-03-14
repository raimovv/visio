interface CameraSelectorProps {
  devices: MediaDeviceInfo[]
  selectedCameraId?: string
  onChange(cameraId?: string): void
}

export function CameraSelector({ devices, selectedCameraId, onChange }: CameraSelectorProps) {
  return (
    <label className="field">
      Camera
      <select value={selectedCameraId ?? ''} onChange={(event) => onChange(event.target.value || undefined)}>
        <option value="">Default camera</option>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
          </option>
        ))}
      </select>
    </label>
  )
}
