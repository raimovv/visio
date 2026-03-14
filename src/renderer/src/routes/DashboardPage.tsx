import { AppShell } from '@renderer/components/layout/AppShell'
import { CameraPreview } from '@renderer/components/monitoring/CameraPreview'
import { MonitoringStatusCard } from '@renderer/components/monitoring/MonitoringStatusCard'
import { BlinkMetricsCard } from '@renderer/components/monitoring/BlinkMetricsCard'
import { CalibrationPanel } from '@renderer/components/monitoring/CalibrationPanel'
import { SessionTimerCard } from '@renderer/components/monitoring/SessionTimerCard'
import { AlertsPanel } from '@renderer/components/monitoring/AlertsPanel'
import { SettingsPanel } from '@renderer/components/settings/SettingsPanel'
import { SessionSummaryCards } from '@renderer/components/history/SessionSummaryCards'
import { SessionHistoryTable } from '@renderer/components/history/SessionHistoryTable'
import { useMonitoringController } from '@renderer/hooks/useMonitoringController'

export function DashboardPage() {
  const {
    snapshot,
    sessions,
    settings,
    stream,
    availableDevices,
    cameraError,
    updateSettings,
    actions,
    calibration
  } = useMonitoringController()

  return (
    <AppShell
      title="Visio Dashboard"
      subtitle="Local blink-reminder monitoring with manual calibration, screen-attention gating, and 20-20-20 breaks."
      actions={actions}
    >
      <div className="dashboard-grid">
        <div className="column column-wide">
          <CameraPreview status={snapshot.status} stream={stream} error={cameraError} />
          <MonitoringStatusCard snapshot={snapshot} breakSettings={settings.breakSettings} />
          <div className="two-up">
            <BlinkMetricsCard metrics={snapshot.metrics} />
            <SessionTimerCard metrics={snapshot.metrics} breakSettings={settings.breakSettings} />
          </div>
          <CalibrationPanel thresholds={settings.thresholds} metrics={snapshot.metrics} calibration={calibration} />
          <AlertsPanel snapshot={snapshot} />
        </div>
        <div className="column">
          <SettingsPanel settings={settings} devices={availableDevices} onSave={updateSettings} />
          <SessionSummaryCards sessions={sessions} />
          <SessionHistoryTable sessions={sessions} />
        </div>
      </div>
    </AppShell>
  )
}
