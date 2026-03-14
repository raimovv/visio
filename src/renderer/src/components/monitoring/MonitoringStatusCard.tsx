import type { MonitoringSnapshot, BreakSettings } from '@shared/types'
import { formatMonitoringStatus } from '@renderer/utils/status'
import { formatDuration } from '@renderer/utils/time'

function getTone(progress: number, status: MonitoringSnapshot['status']) {
  if (status === 'drowsiness-warning' || status === 'camera-error' || progress >= 0.9) {
    return 'tone-danger'
  }

  if (status === 'blink-reminder' || status === 'break-due' || status === 'break-in-progress' || progress >= 0.7) {
    return 'tone-warning'
  }

  return 'tone-accent'
}

export function MonitoringStatusCard({
  snapshot,
  breakSettings
}: {
  snapshot: MonitoringSnapshot
  breakSettings: BreakSettings
}) {
  const workCycleProgress = Math.min(
    snapshot.metrics.workCycleElapsedSeconds / (breakSettings.intervalMinutes * 60),
    1
  )
  const activeProgress =
    snapshot.status === 'break-due' || snapshot.status === 'break-in-progress'
      ? snapshot.metrics.breakProgress
      : snapshot.metrics.eyeStrainProgress
  const activeLabel =
    snapshot.status === 'break-due' || snapshot.status === 'break-in-progress'
      ? 'Break Progress'
      : 'Eye-Strain Progress'

  return (
    <section className={`card status-card status-${snapshot.status}`}>
      <h2>Monitoring Status</h2>
      <div className="status-meter-group">
        <p className="meter-label">
          <strong>{activeLabel}:</strong>
        </p>
        <div className="meter-block">
          <div className="meter-track">
            <div
              className={`meter-fill ${getTone(activeProgress, snapshot.status)}`}
              style={{ width: `${activeProgress * 100}%` }}
            />
          </div>
        </div>
      </div>
      <div className="status-meter-group secondary-meter">
        <p className="meter-label">
          <strong>20-20-20 Timer:</strong> {formatDuration(Math.floor(snapshot.metrics.workCycleElapsedSeconds))} / {breakSettings.intervalMinutes}:00
        </p>
        <div className="meter-block">
          <div className="meter-track">
            <div className="meter-fill tone-accent" style={{ width: `${workCycleProgress * 100}%` }} />
          </div>
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
          <strong>Attention:</strong> {snapshot.metrics.screenFacing ? 'On screen' : 'Away from screen'}
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
        <p>
          <strong>Break Progress:</strong> {snapshot.metrics.breakProgressSeconds.toFixed(1)}s / {breakSettings.durationSeconds}s
        </p>
      </div>
    </section>
  )
}
