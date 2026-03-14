import type { MonitoringStatus } from '@shared/types'

const statusLabels: Record<MonitoringStatus, string> = {
  idle: 'Idle',
  initializing: 'Initializing',
  'calibration-needed': 'Calibration Needed',
  calibrating: 'Calibrating',
  monitoring: 'Monitoring',
  'blink-reminder': 'Blink Reminder',
  'looking-away': 'Looking Away',
  paused: 'Paused',
  'no-face': 'No Face Detected',
  'low-light': 'Low Light',
  'drowsiness-warning': 'Drowsiness Warning',
  'break-due': 'Break Due',
  'break-in-progress': 'Break In Progress',
  'camera-error': 'Camera Error'
}

export function formatMonitoringStatus(status: MonitoringStatus) {
  return statusLabels[status]
}

export function isAlertStatus(status: MonitoringStatus) {
  return (
    status === 'blink-reminder' ||
    status === 'drowsiness-warning' ||
    status === 'break-due' ||
    status === 'camera-error'
  )
}
