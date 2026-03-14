import { sessionSummarySchema } from '@shared/schemas'
import type { SessionSummary } from '@shared/types'

// electron-store is ESM-only; the Electron main bundle must load its default export at runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Store = require('electron-store').default as typeof import('electron-store').default

const store = new Store<{ sessions: SessionSummary[] }>({
  name: 'sessions',
  defaults: {
    sessions: []
  }
})

export function listSessions(): SessionSummary[] {
  return store.get('sessions').map((session) => sessionSummarySchema.parse(session))
}

export function appendSession(session: SessionSummary): void {
  const next = [...listSessions(), sessionSummarySchema.parse(session)].slice(-100)
  store.set('sessions', next)
}
