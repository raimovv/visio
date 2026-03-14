import { z } from 'zod'

export const breakSettingsSchema = z.object({
  enabled: z.boolean(),
  intervalMinutes: z.number().int().min(1).max(180),
  durationMinutes: z.number().int().min(1).max(60)
})

export const overlaySettingsSchema = z.object({
  visible: z.boolean(),
  corner: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  clickThrough: z.boolean()
})

export const thresholdSettingsSchema = z.object({
  earThreshold: z.number().min(0.05).max(0.6),
  blinkReminderSeconds: z.number().min(3).max(30),
  drowsinessHoldSeconds: z.number().min(1).max(10),
  lowLightThreshold: z.number().min(0).max(1)
})

export const appSettingsSchema = z.object({
  selectedCameraId: z.string().optional(),
  startMinimized: z.boolean(),
  launchOnStartup: z.boolean(),
  notificationsEnabled: z.boolean(),
  drowsinessWarningsEnabled: z.boolean(),
  breakSettings: breakSettingsSchema,
  overlay: overlaySettingsSchema,
  thresholds: thresholdSettingsSchema
})

export const sessionSummarySchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  blinkCount: z.number().int().min(0),
  averageEar: z.number().min(0),
  fatigueEvents: z.number().int().min(0),
  breakAlerts: z.number().int().min(0),
  durationSeconds: z.number().int().min(0)
})

export const notificationPayloadSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(240)
})
