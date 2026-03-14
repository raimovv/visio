import { contextBridge, ipcRenderer } from 'electron'
import { ipcChannels, type RendererApi } from '@shared/ipc'
import type {
  AppSettings,
  MonitoringSnapshot,
  NotificationPayload,
  OverlaySettings,
  OverlayState,
  SessionSummary
} from '@shared/types'

function createSubscription<T>(channel: string, listener: (payload: T) => void) {
  const wrapped = (_event: Electron.IpcRendererEvent, payload: T) => listener(payload)
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.removeListener(channel, wrapped)
}

const api: RendererApi = {
  settings: {
    get: () => ipcRenderer.invoke(ipcChannels.settingsGet) as Promise<AppSettings>,
    save: (settings) => ipcRenderer.invoke(ipcChannels.settingsSave, settings) as Promise<AppSettings>
  },
  monitoring: {
    command: (command) => ipcRenderer.invoke(ipcChannels.monitoringCommand, command) as Promise<void>,
    publish: (snapshot) => ipcRenderer.invoke(ipcChannels.monitoringState, snapshot) as Promise<void>,
    subscribe: (listener) => createSubscription<MonitoringSnapshot>(ipcChannels.monitoringState, listener),
    subscribeCommands: (listener) => createSubscription(ipcChannels.monitoringCommanded, listener)
  },
  overlay: {
    setVisibility: (visible) =>
      ipcRenderer.invoke(ipcChannels.overlaySetVisibility, visible) as Promise<OverlayState>,
    applySettings: (settings) =>
      ipcRenderer.invoke(ipcChannels.overlayApplySettings, settings as OverlaySettings) as Promise<OverlayState>,
    subscribe: (listener) => createSubscription<OverlayState>(ipcChannels.overlayState, listener)
  },
  notifications: {
    send: (payload) => ipcRenderer.invoke(ipcChannels.notificationsSend, payload as NotificationPayload) as Promise<void>
  },
  sessions: {
    history: () => ipcRenderer.invoke(ipcChannels.sessionHistory) as Promise<SessionSummary[]>
  },
  lifecycle: {
    hideDashboard: () => ipcRenderer.invoke(ipcChannels.appHideDashboard) as Promise<void>,
    showDashboard: () => ipcRenderer.invoke(ipcChannels.appShowDashboard) as Promise<void>
  }
}

export function registerApi() {
  contextBridge.exposeInMainWorld('visio', api)
}
