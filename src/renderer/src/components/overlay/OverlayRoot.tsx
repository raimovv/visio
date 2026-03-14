import { useEffect } from 'react'
import { OverlayBadge } from './OverlayBadge'
import { useOverlayStatus } from '@renderer/hooks/useOverlayStatus'

export function OverlayRoot() {
  const overlay = useOverlayStatus()

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [])

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
