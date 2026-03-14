import { ipcMain } from 'electron'
import { ipcChannels } from '@shared/ipc'
import { notificationPayloadSchema } from '@shared/schemas'
import { sendNotification } from '@main/notifications/notificationService'

export function registerNotificationsIpc() {
  ipcMain.handle(ipcChannels.notificationsSend, (_event, payload) => {
    sendNotification(notificationPayloadSchema.parse(payload))
  })
}
