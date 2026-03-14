import { ipcMain } from 'electron'
import { ipcChannels } from '@shared/ipc'
import { windowState } from '@main/windows/windowState'

export function registerLifecycleIpc() {
  ipcMain.handle(ipcChannels.appHideDashboard, () => {
    windowState.getDashboard()?.hide()
  })
  ipcMain.handle(ipcChannels.appShowDashboard, () => {
    const window = windowState.getDashboard()
    window?.show()
    window?.focus()
  })
}
