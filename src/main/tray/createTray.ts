import { app, nativeImage, Tray } from 'electron'
import { join } from 'node:path'
import { APP_NAME } from '@main/constants'
import { createTrayMenu } from './trayMenu'

interface CreateTrayOptions {
  paused: boolean
  overlayVisible: boolean
  onOpenDashboard(): void
  onPauseResume(): void
  onToggleOverlay(): void
  onStartMonitoring(): void
  onStopMonitoring(): void
  onQuit(): void
}

export function createTray(options: CreateTrayOptions): Tray {
  const publicRoot = process.env.VITE_PUBLIC || join(app.getAppPath(), 'out', 'renderer')
  const iconPath = join(publicRoot, 'assets/icons/tray.png')
  const fallback = nativeImage.createEmpty()
  const tray = new Tray(nativeImage.createFromPath(iconPath).isEmpty() ? fallback : iconPath)
  tray.setToolTip(`${APP_NAME} - ${options.paused ? 'Paused' : 'Monitoring active'}`)
  tray.setContextMenu(createTrayMenu(options))
  tray.on('double-click', options.onOpenDashboard)
  return tray
}
