import { create } from 'zustand'
import type { AppSettings } from '@shared/types'
import { defaultRendererSettings } from '@renderer/utils/constants'

export const useSettingsStore = create<{
  settings: AppSettings
  setSettings(settings: AppSettings): void
}>((set) => ({
  settings: defaultRendererSettings,
  setSettings: (settings) => set({ settings })
}))
