import type { MonitoringMetrics, SessionSummary } from '@shared/types'

export function buildSessionSummary(
  activeSession: SessionSummary,
  metrics: MonitoringMetrics,
  fatigueEvents: number,
  breakAlerts: number
): SessionSummary {
  return {
    ...activeSession,
    endedAt: new Date().toISOString(),
    blinkCount: metrics.blinkCount,
    averageEar: metrics.ear,
    fatigueEvents,
    breakAlerts,
    durationSeconds: metrics.elapsedSeconds
  }
}
