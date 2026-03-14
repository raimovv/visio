import type {
  AppSettings,
  MonitoringSnapshot,
  NotificationPayload,
  OverlaySettings,
  OverlayState,
  SessionSummary
} from './types'

export const ipcChannels = {
  settingsGet: 'settings:get',
  settingsSave: 'settings:save',
  monitoringState: 'monitoring:state',
  monitoringCommand: 'monitoring:command',
  monitoringCommanded: 'monitoring:commanded',
  overlaySetVisibility: 'overlay:setVisibility',
  overlayApplySettings: 'overlay:applySettings',
  overlayState: 'overlay:state',
  notificationsSend: 'notifications:send',
  sessionHistory: 'session:history',
  appHideDashboard: 'lifecycle:hideDashboard',
  appShowDashboard: 'lifecycle:showDashboard'
} as const

export type MonitoringCommand =
  | 'start'
  | 'stop'
  | 'pause'
  | 'resume'
  | 'overlay:show'
  | 'overlay:hide'

export interface RendererApi {
  settings: {
    get(): Promise<AppSettings>
    save(settings: AppSettings): Promise<AppSettings>
  }
  monitoring: {
    command(command: MonitoringCommand): Promise<void>
    publish(snapshot: MonitoringSnapshot): Promise<void>
    subscribe(listener: (snapshot: MonitoringSnapshot) => void): () => void
    subscribeCommands(listener: (command: MonitoringCommand) => void): () => void
  }
  overlay: {
    setVisibility(visible: boolean): Promise<OverlayState>
    applySettings(settings: OverlaySettings): Promise<OverlayState>
    subscribe(listener: (state: OverlayState) => void): () => void
  }
  notifications: {
    send(payload: NotificationPayload): Promise<void>
  }
  sessions: {
    history(): Promise<SessionSummary[]>
  }
  lifecycle: {
    hideDashboard(): Promise<void>
    showDashboard(): Promise<void>
  }
}
