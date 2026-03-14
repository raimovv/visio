import type { MonitoringSnapshot } from '@shared/types'
import { formatMonitoringStatus } from '@renderer/utils/status'

function getTone(progress: number, status: MonitoringSnapshot['status']) {
  if (status === 'drowsiness-warning' || status === 'camera-error' || progress >= 0.9) {
    return 'tone-danger'
  }

  if (status === 'blink-reminder' || status === 'break-due' || progress >= 0.7) {
    return 'tone-warning'
  }

  return 'tone-accent'
}

export function MonitoringStatusCard({ snapshot }: { snapshot: MonitoringSnapshot }) {
  return (
    <section className={`card status-card status-${snapshot.status}`}>
      <h2>Monitoring Status</h2>
      <div className="meter-block">
        <div className="meter-track">
          <div
            className={`meter-fill ${getTone(snapshot.metrics.eyeStrainProgress, snapshot.status)}`}
            style={{ width: `${snapshot.metrics.eyeStrainProgress * 100}%` }}
          />
        </div>
      </div>
      <div className="metric-list compact-metrics">
        <p>
          <strong>Status:</strong> {formatMonitoringStatus(snapshot.status)}
        </p>
        <p>
          <strong>Face:</strong> {snapshot.metrics.faceDetected ? 'Detected' : 'Missing'}
        </p>
        <p>
          <strong>Eye Strain Score:</strong> {snapshot.metrics.eyeStrainScore.toFixed(2)}
        </p>
        <p>
          <strong>Open-Eye Streak:</strong> {snapshot.metrics.timeSinceLastBlinkSeconds.toFixed(1)}s
        </p>
        <p>
          <strong>Eye Closure:</strong> {snapshot.metrics.eyeClosureSeconds.toFixed(1)}s
        </p>
      </div>
    </section>
  )
}
