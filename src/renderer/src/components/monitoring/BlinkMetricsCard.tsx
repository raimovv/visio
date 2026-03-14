import type { MonitoringMetrics } from '@shared/types'

export function BlinkMetricsCard({ metrics }: { metrics: MonitoringMetrics }) {
  return (
    <section className="card compact-card">
      <h2>Blink Metrics</h2>
      <div className="metric-list compact-metrics">
        <p>
          <strong>EAR:</strong> {metrics.ear.toFixed(3)}
        </p>
        <p>
          <strong>Smoothed EAR:</strong> {metrics.smoothedEar.toFixed(3)}
        </p>
        <p>
          <strong>Blinks:</strong> {metrics.blinkCount}
        </p>
        <p>
          <strong>Brightness:</strong> {metrics.brightnessScore.toFixed(2)}
        </p>
      </div>
    </section>
  )
}
