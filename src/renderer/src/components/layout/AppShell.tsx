import type { ReactNode } from 'react'
import type { MonitoringActions } from '@renderer/features/monitoring/monitoringTypes'
import { TopBar } from './TopBar'

interface AppShellProps {
  title: string
  subtitle: string
  actions: MonitoringActions
  children: ReactNode
}

export function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  return (
    <main className="app-shell">
      <div className="content-shell">
        <TopBar title={title} subtitle={subtitle} actions={actions} />
        <section>{children}</section>
      </div>
    </main>
  )
}
