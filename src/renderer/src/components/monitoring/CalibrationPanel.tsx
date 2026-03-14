import type { MonitoringMetrics, ThresholdSettings } from '@shared/types'
import type { CalibrationControls } from '@renderer/features/monitoring/monitoringTypes'

interface CalibrationPanelProps {
  thresholds: ThresholdSettings
  metrics: MonitoringMetrics
  calibration: CalibrationControls
}

function formatCalibrationStatus(status: MonitoringMetrics['calibrationStatus']) {
  if (status === 'running') {
    return 'Running'
  }

  if (status === 'ready') {
    return 'Ready'
  }

  return 'Not Started'
}

export function CalibrationPanel({ thresholds, metrics, calibration }: CalibrationPanelProps) {
  const buttonLabel = calibration.ready ? 'Recalibrate (6s)' : 'Start Calibration (6s)'

  return (
    <section className="card">
      <div className="card-header-row">
        <div>
          <h2>Calibration</h2>
          <p>Run a short 6-second relaxed-gaze capture whenever your camera angle or lighting changes. Look normally at the screen while it calibrates.</p>
        </div>
        <button
          className="inline-action-button"
          disabled={!calibration.canStart || calibration.running}
          onClick={calibration.start}
        >
          {calibration.running ? 'Calibrating...' : buttonLabel}
        </button>
      </div>
      <div className="meter-block">
        <div className="meter-track">
          <div className="meter-fill tone-accent" style={{ width: `${metrics.calibrationProgress * 100}%` }} />
        </div>
      </div>
      <div className="metric-list compact-metrics">
        <p>
          <strong>Calibration Status:</strong> {formatCalibrationStatus(metrics.calibrationStatus)}
        </p>
        <p>
          <strong>Baseline EAR:</strong> {metrics.baselineEar ? metrics.baselineEar.toFixed(3) : 'Not captured yet'}
        </p>
        <p>
          <strong>Active Blink Threshold:</strong> {metrics.activeEarThreshold.toFixed(3)}
        </p>
        <p>
          <strong>Blink Reminder Delay:</strong> {thresholds.blinkReminderSeconds.toFixed(1)}s
        </p>
        <p>
          <strong>Drowsiness Delay:</strong> {thresholds.drowsinessHoldSeconds.toFixed(1)}s
        </p>
      </div>
      {!calibration.canStart && (
        <p className="helper-text">Start monitoring first. Calibration runs while the camera feed is live.</p>
      )}
    </section>
  )
}

