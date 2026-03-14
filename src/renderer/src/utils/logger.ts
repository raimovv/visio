export const logger = {
  info: (...args: unknown[]) => console.info('[Visio]', ...args),
  warn: (...args: unknown[]) => console.warn('[Visio]', ...args),
  error: (...args: unknown[]) => console.error('[Visio]', ...args)
}
