import type { BrowserWindow } from 'electron'

interface WindowRegistry {
  dashboard: BrowserWindow | null
  overlay: BrowserWindow | null
}

const registry: WindowRegistry = {
  dashboard: null,
  overlay: null
}

export function isWindowAlive(window: BrowserWindow | null | undefined): window is BrowserWindow {
  return Boolean(window && !window.isDestroyed() && !window.webContents.isDestroyed())
}

export const windowState = {
  setDashboard(window: BrowserWindow | null) {
    registry.dashboard = window
  },
  getDashboard() {
    return registry.dashboard
  },
  setOverlay(window: BrowserWindow | null) {
    registry.overlay = window
  },
  getOverlay() {
    return registry.overlay
  }
}
