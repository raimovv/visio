import { useEffect, useRef } from 'react'
import type { MonitoringStatus } from '@shared/types'
import { formatMonitoringStatus } from '@renderer/utils/status'

export function CameraPreview({
  status,
  stream,
  error
}: {
  status: MonitoringStatus
  stream: MediaStream | null
  error?: string
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <section className="card camera-preview status-card">
      <h2>Live Camera</h2>
      <div className="video-stage">
        <video ref={videoRef} autoPlay muted playsInline className="preview-video" />
        {!stream && <div className="video-placeholder">Camera preview will appear here when monitoring starts.</div>}
      </div>
      <p className="preview-footer">
        <strong>{formatMonitoringStatus(status)}:</strong> {error ?? (stream ? 'Local webcam stream active.' : 'Waiting to start')}
      </p>
    </section>
  )
}
