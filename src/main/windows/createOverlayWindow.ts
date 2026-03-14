import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import type { OverlaySettings } from '@shared/types'
import { windowState } from './windowState'

export function getOverlayBounds(
  bounds: Electron.Rectangle,
  settings: OverlaySettings,
  size: { width: number; height: number } = { width: 318, height: 104 }
) {
  const margin = 18
  const xByCorner =
    settings.corner === 'top-left' || settings.corner === 'bottom-left'
      ? bounds.x + margin
      : bounds.x + bounds.width - size.width - margin
  const yByCorner =
    settings.corner === 'top-left' || settings.corner === 'bottom-right'
      ? settings.corner === 'top-left'
        ? bounds.y + margin
        : bounds.y + bounds.height - size.height - margin
      : settings.corner === 'bottom-left'
        ? bounds.y + bounds.height - size.height - margin
        : bounds.y + margin

  return {
    x: xByCorner,
    y: yByCorner,
    width: size.width,
    height: size.height
  }
}

export function createOverlayWindow(settings: OverlaySettings): BrowserWindow {
  const display = screen.getPrimaryDisplay()
  const position = getOverlayBounds(display.workArea, settings)

  const window = new BrowserWindow({
    ...position,
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    show: settings.visible,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  })

  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  window.setAlwaysOnTop(true, 'screen-saver')
  window.setIgnoreMouseEvents(settings.clickThrough, { forward: settings.clickThrough })
  windowState.setOverlay(window)
  return window
}
