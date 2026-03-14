import { app } from 'electron'
import { join } from 'node:path'
import { createMainWindow } from '@main/windows/createMainWindow'
import { createOverlayWindow } from '@main/windows/createOverlayWindow'
import { registerLifecycleIpc } from '@main/ipc/lifecycle.ipc'
import { applyMonitoringCommand, registerMonitoringIpc } from '@main/ipc/monitoring.ipc'
import { registerNotificationsIpc } from '@main/ipc/notifications.ipc'
import { updateOverlayState, registerOverlayIpc } from '@main/ipc/overlay.ipc'
import { registerSessionIpc } from '@main/ipc/session.ipc'
import { registerSettingsIpc } from '@main/ipc/settings.ipc'
import { getSettings } from '@main/store/settingsStore'
import { createTray } from '@main/tray/createTray'
import { windowState } from '@main/windows/windowState'

export async function bootstrapApp() {
  const hasLock = app.requestSingleInstanceLock()
  if (!hasLock) {
    app.quit()
    return
  }

  const isQuittingRef = { current: false }
  const settings = getSettings()
  let paused = false
  let overlayVisible = settings.overlay.visible

  app.on('before-quit', () => {
    isQuittingRef.current = true
  })

  app.on('second-instance', () => {
    const dashboard = windowState.getDashboard() ?? createMainWindow({ isQuittingRef })
    dashboard.show()
    dashboard.focus()
  })

  await app.whenReady()
  registerSettingsIpc()
  registerMonitoringIpc()
  registerOverlayIpc()
  registerLifecycleIpc()
  registerNotificationsIpc()
  registerSessionIpc()

  const dashboard = createMainWindow({ isQuittingRef })
  const overlay = createOverlayWindow(settings.overlay)
  const rendererEntry = join(__dirname, '../renderer/index.html')

  if (process.env.ELECTRON_RENDERER_URL) {
    await dashboard.loadURL(process.env.ELECTRON_RENDERER_URL)
    await overlay.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/overlay`)
  } else {
    await dashboard.loadFile(rendererEntry)
    await overlay.loadFile(rendererEntry, { hash: '/overlay' })
  }

  createTray({
    paused,
    overlayVisible,
    onOpenDashboard: () => {
      dashboard.show()
      dashboard.focus()
    },
    onPauseResume: () => {
      paused = !paused
      applyMonitoringCommand(paused ? 'pause' : 'resume')
    },
    onToggleOverlay: () => {
      overlayVisible = !overlayVisible
      updateOverlayState({ visible: overlayVisible })
      if (overlayVisible) {
        overlay.showInactive()
      } else {
        overlay.hide()
      }
    },
    onStartMonitoring: () => {
      paused = false
      applyMonitoringCommand('start')
    },
    onStopMonitoring: () => {
      paused = false
      applyMonitoringCommand('stop')
    },
    onQuit: () => app.quit()
  })

  if (settings.startMinimized) {
    dashboard.hide()
  }

  app.on('activate', () => {
    dashboard.show()
  })

  app.on('window-all-closed', (event) => {
    event.preventDefault()
  })
}
