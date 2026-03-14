import type { MonitoringStatus } from '@shared/types'

function getProgressTone(status: MonitoringStatus, progress: number) {
  if (status === 'drowsiness-warning' || status === 'camera-error' || progress >= 0.9) {
    return 'tone-danger'
  }

  if (status === 'blink-reminder' || status === 'break-due' || progress >= 0.7) {
    return 'tone-warning'
  }

  return 'tone-accent'
}

export function OverlayBadge({
  label,
  sublabel,
  status,
  progress,
  onOpen
}: {
  label: string
  sublabel: string
  status: MonitoringStatus
  progress: number
  onOpen(): void
}) {
  return (
    <div className={`overlay-badge status-${status}`}>
      <div className="overlay-drag" title="Drag overlay">
        ::
      </div>
      <div className="overlay-main">
        <button className="overlay-open" onClick={onOpen} title="Open dashboard">
          <span className="status-dot" />
          <span className="overlay-copy">
            <strong>{label}:</strong>
            <small>{sublabel}</small>
          </span>
        </button>
        <div className="overlay-meter-track">
          <div
            className={`overlay-meter-fill ${getProgressTone(status, progress)}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
