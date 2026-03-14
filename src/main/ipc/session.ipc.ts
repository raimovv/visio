import { ipcMain } from 'electron'
import { ipcChannels } from '@shared/ipc'
import { listSessions } from '@main/store/sessionStore'

export function registerSessionIpc() {
  ipcMain.handle(ipcChannels.sessionHistory, () => listSessions())
}
