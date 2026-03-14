import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { windowState } from './windowState'

interface CreateMainWindowOptions {
  isQuittingRef: { current: boolean }
}

export function createMainWindow({ isQuittingRef }: CreateMainWindowOptions): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 820,
    show: false,
    backgroundColor: '#0b1020',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  })

  window.on('ready-to-show', () => window.show())
  window.on('close', (event) => {
    if (!isQuittingRef.current) {
      event.preventDefault()
      window.hide()
    }
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  windowState.setDashboard(window)
  return window
}
