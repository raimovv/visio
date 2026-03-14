import type { SessionSummary } from '@shared/types'
import { formatDuration } from '@renderer/utils/time'

export function SessionHistoryTable({ sessions }: { sessions: SessionSummary[] }) {
  return (
    <section className="card">
      <h2>Recent Sessions</h2>
      <table className="history-table">
        <thead>
          <tr>
            <th>Started</th>
            <th>Duration</th>
            <th>Blinks</th>
            <th>Breaks</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>{new Date(session.startedAt).toLocaleString()}</td>
              <td>{formatDuration(session.durationSeconds)}</td>
              <td>{session.blinkCount}</td>
              <td>{session.completedBreaks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
