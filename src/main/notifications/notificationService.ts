import { Notification } from 'electron'
import { notificationPayloadSchema } from '@shared/schemas'
import type { NotificationPayload } from '@shared/types'

export function sendNotification(payload: NotificationPayload): void {
  const validated = notificationPayloadSchema.parse(payload)
  if (!Notification.isSupported()) return

  new Notification({
    title: validated.title,
    body: validated.body
  }).show()
}
