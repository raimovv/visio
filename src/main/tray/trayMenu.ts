import { Menu } from 'electron'

interface TrayMenuOptions {
  paused: boolean
  overlayVisible: boolean
  onOpenDashboard(): void
  onPauseResume(): void
  onToggleOverlay(): void
  onStartMonitoring(): void
  onStopMonitoring(): void
  onQuit(): void
}

export function createTrayMenu(options: TrayMenuOptions) {
  return Menu.buildFromTemplate([
    { label: 'Open Dashboard', click: options.onOpenDashboard },
    { type: 'separator' },
    { label: options.paused ? 'Resume Monitoring' : 'Pause Monitoring', click: options.onPauseResume },
    { label: options.overlayVisible ? 'Hide Overlay' : 'Show Overlay', click: options.onToggleOverlay },
    { label: 'Start Monitoring', click: options.onStartMonitoring },
    { label: 'Stop Monitoring', click: options.onStopMonitoring },
    { type: 'separator' },
    { label: 'Quit', click: options.onQuit }
  ])
}
