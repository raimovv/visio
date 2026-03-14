import { ipcMain } from 'electron'
import { ipcChannels } from '@shared/ipc'
import { appSettingsSchema } from '@shared/schemas'
import { getSettings, saveSettings } from '@main/store/settingsStore'

export function registerSettingsIpc() {
  ipcMain.handle(ipcChannels.settingsGet, () => getSettings())
  ipcMain.handle(ipcChannels.settingsSave, (_event, input) => saveSettings(appSettingsSchema.parse(input)))
}
