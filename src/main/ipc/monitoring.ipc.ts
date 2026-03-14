import { ipcMain } from 'electron'
import { ipcChannels, type MonitoringCommand } from '@shared/ipc'
import type { MonitoringSnapshot, MonitoringStatus } from '@shared/types'
import { defaultSnapshot } from '@main/constants'
import { sendNotification } from '@main/notifications/notificationService'
import { getSettings } from '@main/store/settingsStore'
import { appendSession } from '@main/store/sessionStore'
import { isWindowAlive, windowState } from '@main/windows/windowState'
import { updateOverlayState } from './overlay.ipc'

let currentSnapshot: MonitoringSnapshot = { ...defaultSnapshot }
let lastAlertStatus: MonitoringStatus | null = null

const alertNotifications: Partial<Record<MonitoringStatus, { title: string; body: string }>> = {
  'blink-reminder': {
    title: 'Blink reminder',
    body: 'You have been staring for a while. Blink a few times to reset your eyes.'
  },
  'drowsiness-warning': {
    title: 'Drowsiness warning',
    body: 'Eyes have been closed for too long. Please refocus or take a short break.'
  },
  'break-due': {
    title: 'Break due',
    body: 'Time to rest your eyes for a moment.'
  },
  'camera-error': {
    title: 'Camera error',
    body: 'Visio could not read the webcam stream.'
  }
}

function broadcastSnapshot() {
  const dashboard = windowState.getDashboard()
  const overlay = windowState.getOverlay()

  if (isWindowAlive(dashboard)) {
    dashboard.webContents.send(ipcChannels.monitoringState, currentSnapshot)
  }
  if (isWindowAlive(overlay)) {
    overlay.webContents.send(ipcChannels.monitoringState, currentSnapshot)
  }
}

function broadcastCommand(command: MonitoringCommand) {
  const dashboard = windowState.getDashboard()
  if (isWindowAlive(dashboard)) {
    dashboard.webContents.send(ipcChannels.monitoringCommanded, command)
  }
}

function maybeNotify(status: MonitoringStatus) {
  const settings = getSettings()
  if (!settings.notificationsEnabled) {
    lastAlertStatus = null
    return
  }

  const alert = alertNotifications[status]
  if (!alert) {
    lastAlertStatus = null
    return
  }

  if (lastAlertStatus === status) {
    return
  }

  sendNotification(alert)
  lastAlertStatus = status
}

export function applyMonitoringCommand(command: MonitoringCommand) {
  broadcastCommand(command)

  if (command === 'pause') {
    currentSnapshot.status = 'paused'
    updateOverlayState({ status: 'paused', label: 'Paused', sublabel: 'Monitoring paused', progress: 0 })
  }
  if (command === 'resume') {
    currentSnapshot.status = 'monitoring'
    updateOverlayState({ status: 'monitoring', label: 'Monitoring', sublabel: 'Resuming live tracking', progress: 0 })
  }
  if (command === 'start') {
    currentSnapshot.status = 'initializing'
    updateOverlayState({ status: 'initializing', label: 'Initializing', sublabel: 'Starting camera and model', progress: 0 })
  }
  if (command === 'stop') {
    currentSnapshot = { ...defaultSnapshot }
    lastAlertStatus = null
    updateOverlayState({ status: 'idle', label: 'Idle', sublabel: 'Waiting to start', progress: 0 })
  }
  if (command === 'overlay:show') {
    updateOverlayState({ visible: true })
  }
  if (command === 'overlay:hide') {
    updateOverlayState({ visible: false })
  }
  broadcastSnapshot()
}

export function registerMonitoringIpc() {
  ipcMain.handle(ipcChannels.monitoringCommand, (_event, command: MonitoringCommand) => {
    applyMonitoringCommand(command)
  })

  ipcMain.handle(ipcChannels.monitoringState, (_event, snapshot: MonitoringSnapshot) => {
    currentSnapshot = snapshot
    updateOverlayState(snapshot.overlay)
    broadcastSnapshot()
    maybeNotify(snapshot.status)

    if (snapshot.activeSession?.endedAt) {
      appendSession(snapshot.activeSession)
    }
  })
}
