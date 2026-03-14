import type { MonitoringMetrics } from '@shared/types'
import { formatDuration } from '@renderer/utils/time'

export function SessionTimerCard({ metrics }: { metrics: MonitoringMetrics }) {
  return (
    <section className="card compact-card">
      <h2>Session</h2>
      <div className="metric-list compact-metrics">
        <p>
          <strong>Elapsed:</strong> {formatDuration(metrics.elapsedSeconds)}
        </p>
        <p>
          <strong>Last Blink:</strong> {metrics.lastBlinkAt ?? 'n/a'}
        </p>
        <p>
          <strong>Time Since Blink:</strong> {metrics.timeSinceLastBlinkSeconds.toFixed(1)}s
        </p>
        <p>
          <strong>Calibration:</strong> {metrics.calibrationStatus}
        </p>
      </div>
    </section>
  )
}
