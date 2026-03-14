import { BrowserWindow, ipcMain, screen } from 'electron'
import { ipcChannels } from '@shared/ipc'
import type { OverlaySettings, OverlayState } from '@shared/types'
import { defaultOverlayState } from '@main/constants'
import { getOverlayBounds } from '@main/windows/createOverlayWindow'
import { isWindowAlive, windowState } from '@main/windows/windowState'

const overlayState: OverlayState = { ...defaultOverlayState }
let appliedSettings: OverlaySettings | null = null

function emitOverlayState() {
  const dashboard = windowState.getDashboard()
  const overlay = windowState.getOverlay()

  if (isWindowAlive(dashboard)) {
    dashboard.webContents.send(ipcChannels.overlayState, overlayState)
  }
  if (isWindowAlive(overlay)) {
    overlay.webContents.send(ipcChannels.overlayState, overlayState)
  }
}

function applyWindowSettings(settings: OverlaySettings) {
  const overlayWindow = windowState.getOverlay()
  if (!(overlayWindow instanceof BrowserWindow) || !isWindowAlive(overlayWindow)) {
    appliedSettings = settings
    return
  }

  const currentBounds = overlayWindow.getBounds()
  if (!appliedSettings || settings.corner !== appliedSettings.corner) {
    const display = screen.getDisplayMatching(currentBounds)
    overlayWindow.setBounds(
      getOverlayBounds(display.workArea, settings, {
        width: currentBounds.width,
        height: currentBounds.height
      })
    )
  }

  overlayWindow.setIgnoreMouseEvents(settings.clickThrough, { forward: settings.clickThrough })
  if (settings.visible) {
    overlayWindow.showInactive()
  } else {
    overlayWindow.hide()
  }

  appliedSettings = settings
}

export function getOverlayState() {
  return overlayState
}

export function updateOverlayState(next: Partial<OverlayState>) {
  Object.assign(overlayState, next)
  const overlayWindow = windowState.getOverlay()
  if (isWindowAlive(overlayWindow)) {
    if (overlayState.visible) {
      overlayWindow.showInactive()
    } else {
      overlayWindow.hide()
    }
  }
  emitOverlayState()
  return overlayState
}

export function applyOverlaySettings(settings: OverlaySettings) {
  applyWindowSettings(settings)
  return updateOverlayState({ visible: settings.visible })
}

export function registerOverlayIpc() {
  ipcMain.handle(ipcChannels.overlaySetVisibility, (_event, visible: boolean) =>
    updateOverlayState({ visible, sublabel: visible ? overlayState.sublabel : 'Overlay hidden' })
  )
  ipcMain.handle(ipcChannels.overlayApplySettings, (_event, settings: OverlaySettings) => applyOverlaySettings(settings))
}
