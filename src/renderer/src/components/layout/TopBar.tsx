import type { MonitoringActions } from '@renderer/features/monitoring/monitoringTypes'

interface TopBarProps {
  title: string
  subtitle: string
  actions: MonitoringActions
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Single-window desktop monitor</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="actions">
        {!actions.running && (
          <button className="action-button action-start" onClick={actions.start}>
            Start
          </button>
        )}
        {actions.running && (
          <button className="action-button action-pause" onClick={actions.pauseResume}>
            {actions.paused ? 'Resume' : 'Pause'}
          </button>
        )}
        {actions.running && (
          <button className="action-button action-stop" onClick={actions.stop}>
            Stop
          </button>
        )}
        <button className="action-button action-secondary" onClick={actions.hideDashboard}>
          Hide
        </button>
      </div>
    </header>
  )
}
