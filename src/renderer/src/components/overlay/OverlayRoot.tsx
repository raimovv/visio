import { OverlayBadge } from './OverlayBadge'
import { useOverlayStatus } from '@renderer/hooks/useOverlayStatus'

export function OverlayRoot() {
  const overlay = useOverlayStatus()

  return (
    <div className="overlay-root">
      <OverlayBadge
        label={overlay.label}
        sublabel={overlay.sublabel}
        status={overlay.status}
        progress={overlay.progress}
        onOpen={() => {
          void window.visio.lifecycle.showDashboard()
        }}
      />
    </div>
  )
}
