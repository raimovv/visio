import type { SessionSummary } from '@shared/types'

export function SessionSummaryCards({ sessions }: { sessions: SessionSummary[] }) {
  const latest = sessions[0]

  return (
    <section className="card">
      <h2>Summary</h2>
      <div className="metric-list">
        <p>
          <strong>Total Sessions:</strong> {sessions.length}
        </p>
        <p>
          <strong>Latest Blinks:</strong> {latest?.blinkCount ?? 0}
        </p>
      </div>
    </section>
  )
}
