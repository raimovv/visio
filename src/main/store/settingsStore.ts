import { appSettingsSchema } from '@shared/schemas'
import type { AppSettings } from '@shared/types'
import { defaultSettings } from '@main/constants'
import {
  normalizePersistedBreakDurationSeconds,
  normalizePersistedEarThreshold
} from './settingsMigration'

// electron-store is ESM-only; the Electron main bundle must load its default export at runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Store = require('electron-store').default as typeof import('electron-store').default

const store = new Store<{ settings: AppSettings }>({
  name: 'settings',
  defaults: {
    settings: defaultSettings
  }
})

function mergeSettings(rawSettings?: Partial<AppSettings>): AppSettings {
  const legacyThresholds =
    (rawSettings?.thresholds as { consecutiveFrameThreshold?: number; drowsyFatigueScore?: number } | undefined) ??
    {}
  const rawBreakSettings =
    (rawSettings?.breakSettings as { enabled?: boolean; intervalMinutes?: number; durationSeconds?: number; durationMinutes?: number } | undefined) ??
    {}
  const isLegacySettings = typeof legacyThresholds.consecutiveFrameThreshold === 'number'
  const migratedEarThreshold = normalizePersistedEarThreshold(
    rawSettings?.thresholds?.earThreshold,
    defaultSettings.thresholds.earThreshold
  )
  const migratedBreakDurationSeconds = normalizePersistedBreakDurationSeconds(
    rawBreakSettings,
    defaultSettings.breakSettings.durationSeconds
  )

  return {
    ...defaultSettings,
    ...rawSettings,
    drowsinessWarningsEnabled:
      rawSettings?.drowsinessWarningsEnabled ?? defaultSettings.drowsinessWarningsEnabled,
    breakSettings: {
      ...defaultSettings.breakSettings,
      ...(rawSettings?.breakSettings ?? {}),
      durationSeconds: migratedBreakDurationSeconds
    },
    overlay: {
      ...defaultSettings.overlay,
      ...(rawSettings?.overlay ?? {}),
      clickThrough: isLegacySettings ? false : (rawSettings?.overlay?.clickThrough ?? defaultSettings.overlay.clickThrough)
    },
    thresholds: {
      ...defaultSettings.thresholds,
      ...(rawSettings?.thresholds ?? {}),
      earThreshold: migratedEarThreshold,
      blinkReminderSeconds:
        rawSettings?.thresholds?.blinkReminderSeconds ?? defaultSettings.thresholds.blinkReminderSeconds,
      drowsinessHoldSeconds:
        rawSettings?.thresholds?.drowsinessHoldSeconds ?? defaultSettings.thresholds.drowsinessHoldSeconds
    }
  }
}

export function getSettings(): AppSettings {
  const validated = appSettingsSchema.parse(mergeSettings(store.get('settings') as Partial<AppSettings> | undefined))
  store.set('settings', validated)
  return validated
}

export function saveSettings(settings: AppSettings): AppSettings {
  const validated = appSettingsSchema.parse(mergeSettings(settings))
  store.set('settings', validated)
  return validated
}
