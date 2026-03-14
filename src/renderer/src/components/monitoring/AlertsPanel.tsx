import type { MonitoringSnapshot } from '@shared/types'
import { formatMonitoringStatus, isAlertStatus } from '@renderer/utils/status'

function getAlertMessage(snapshot: MonitoringSnapshot) {
  if (snapshot.status === 'blink-reminder') {
    return 'Open-eye time is above your healthy blink limit. Blink a few times and reset your eyes.'
  }

  if (snapshot.status === 'drowsiness-warning') {
    return 'Drowsiness warning active. Your eyes have been closed too long.'
  }

  if (snapshot.status === 'break-due') {
    return 'Break reminder active. Step away for a short eye reset.'
  }

  if (snapshot.status === 'camera-error') {
    return 'Camera pipeline needs attention before monitoring can continue.'
  }

  if (snapshot.status === 'calibration-needed') {
    return 'Calibration has not been run yet. Start a 6-second calibration to lock in your baseline EAR.'
  }

  if (snapshot.status === 'calibrating') {
    return 'Calibration is running. Keep your eyes open and stay steady until the capture completes.'
  }

  return 'No active alerts.'
}

export function AlertsPanel({ snapshot }: { snapshot: MonitoringSnapshot }) {
  return (
    <section className={`card alert-card ${isAlertStatus(snapshot.status) ? `status-${snapshot.status}` : ''}`}>
      <h2>Alerts</h2>
      <p>
        <strong>{formatMonitoringStatus(snapshot.status)}:</strong> {getAlertMessage(snapshot)}
      </p>
    </section>
  )
}
