import type { MonitoringMetrics, SessionSummary } from '@shared/types'

export function buildSessionSummary(
  id: string,
  startedAt: string,
  metrics: MonitoringMetrics,
  fatigueEvents: number,
  breakAlerts: number
): SessionSummary {
  return {
    id,
    startedAt,
    endedAt: new Date().toISOString(),
    blinkCount: metrics.blinkCount,
    averageEar: metrics.ear,
    fatigueEvents,
    breakAlerts,
    durationSeconds: metrics.elapsedSeconds
  }
}
