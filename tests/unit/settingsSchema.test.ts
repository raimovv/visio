import { describe, expect, it } from 'vitest'
import { appSettingsSchema } from '../../src/shared/schemas'

describe('appSettingsSchema', () => {
  it('accepts the default shape', () => {
    const parsed = appSettingsSchema.parse({
      startMinimized: false,
      launchOnStartup: false,
      notificationsEnabled: true,
      drowsinessWarningsEnabled: true,
      breakSettings: {
        enabled: true,
        intervalMinutes: 20,
        durationSeconds: 20
      },
      overlay: {
        visible: true,
        corner: 'top-right',
        clickThrough: false
      },
      thresholds: {
        earThreshold: 0.12,
        blinkReminderSeconds: 8,
        drowsinessHoldSeconds: 3.5,
        lowLightThreshold: 0.22
      }
    })

    expect(parsed.thresholds.blinkReminderSeconds).toBe(8)
    expect(parsed.breakSettings.durationSeconds).toBe(20)
  })

  it('rejects invalid threshold ranges', () => {
    expect(() =>
      appSettingsSchema.parse({
        startMinimized: false,
        launchOnStartup: false,
        notificationsEnabled: true,
        drowsinessWarningsEnabled: true,
        breakSettings: {
          enabled: true,
          intervalMinutes: 20,
          durationSeconds: 20
        },
        overlay: {
          visible: true,
          corner: 'top-right',
          clickThrough: false
        },
        thresholds: {
          earThreshold: 0.9,
          blinkReminderSeconds: 8,
          drowsinessHoldSeconds: 3.5,
          lowLightThreshold: 0.22
        }
      })
    ).toThrow()
  })
})
