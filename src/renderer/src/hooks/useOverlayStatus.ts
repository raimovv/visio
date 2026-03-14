import { useEffect, useState } from 'react'
import type { OverlayState } from '@shared/types'
import { initialSnapshot } from '@renderer/utils/constants'

export function useOverlayStatus() {
  const [overlay, setOverlay] = useState<OverlayState>(initialSnapshot.overlay)

  useEffect(() => {
    return window.visio.overlay.subscribe(setOverlay)
  }, [])

  return overlay
}
