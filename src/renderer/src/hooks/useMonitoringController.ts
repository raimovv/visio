import { useEffect, useMemo, useRef, useState } from 'react'
import type { AppSettings, MonitoringSnapshot, SessionSummary } from '@shared/types'
import type {
  CalibrationControls,
  MonitoringActions,
  MonitoringRuntimeState
} from '@renderer/features/monitoring/monitoringTypes'
import { requestCameraStream } from '@renderer/features/camera/cameraService'
import { listVideoDevices } from '@renderer/features/camera/deviceService'
import {
  buildCalibrationSnapshot,
  createMonitoringRuntimeState,
  processMonitoringFrame,
  startCalibrationRun
} from '@renderer/features/monitoring/monitoringController'
import { useMonitoringStore } from '@renderer/features/monitoring/monitoringStore'
import { createFaceLandmarker } from '@renderer/features/mediapipe/faceLandmarkerService'
import type { FaceLandmarkerRunner } from '@renderer/features/mediapipe/landmarkTypes'
import { buildSessionSummary } from '@renderer/features/monitoring/sessionMetrics'
import { playAlertTone } from '@renderer/features/notifications/rendererNotificationBridge'
import { initialSnapshot } from '@renderer/utils/constants'
import { isAlertStatus } from '@renderer/utils/status'

function buildCameraErrorSnapshot(message: string, current: MonitoringSnapshot): MonitoringSnapshot {
  return {
    ...current,
    status: 'camera-error',
    overlay: {
      ...current.overlay,
      status: 'camera-error',
      label: 'Camera Error',
      sublabel: message,
      progress: 1
    }
  }
}

export function useMonitoringController() {
  const {
    snapshot,
    settings,
    sessions,
    stream,
    availableDevices,
    cameraError,
    setSnapshot,
    setSettings,
    setSessions,
    setStream,
    setAvailableDevices,
    setCameraError
  } = useMonitoringStore()
  const runtimeRef = useRef<MonitoringRuntimeState>(createMonitoringRuntimeState())
  const frameRequestRef = useRef<number | undefined>(undefined)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const detectorRef = useRef<FaceLandmarkerRunner | null>(null)
  const activeRef = useRef(false)
  const previousStatusRef = useRef(snapshot.status)
  const reminderEventsRef = useRef(0)
  const breakAlertsRef = useRef(0)
  const drowsinessEventsRef = useRef(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    void window.visio.settings.get().then((loadedSettings) => {
      setSettings(loadedSettings)
      void window.visio.overlay.applySettings(loadedSettings.overlay)
    })
    void window.visio.sessions.history().then(setSessions)
    void listVideoDevices().then(setAvailableDevices)

    const unsubscribeMonitoring = window.visio.monitoring.subscribe(setSnapshot)
    const unsubscribeOverlay = window.visio.overlay.subscribe((overlay) =>
      setSnapshot({ ...useMonitoringStore.getState().snapshot, overlay })
    )
    const unsubscribeCommands = window.visio.monitoring.subscribeCommands((command) => {
      if (command === 'start') {
        void beginMonitoring()
      }
      if (command === 'stop') {
        void endMonitoring(true)
      }
      if (command === 'pause') {
        setPaused(true)
      }
      if (command === 'resume') {
        setPaused(false)
      }
    })

    return () => {
      unsubscribeMonitoring()
      unsubscribeOverlay()
      unsubscribeCommands()
      void endMonitoring(false)
    }
    // Command subscriptions intentionally bind to the current closure for the local camera loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAvailableDevices, setSessions, setSettings, setSnapshot])

  useEffect(() => {
    if (previousStatusRef.current !== snapshot.status) {
      if (snapshot.status === 'blink-reminder') {
        reminderEventsRef.current += 1
      }
      if (snapshot.status === 'break-due') {
        breakAlertsRef.current += 1
      }
      if (snapshot.status === 'drowsiness-warning') {
        drowsinessEventsRef.current += 1
      }
      if (settings.notificationsEnabled && isAlertStatus(snapshot.status)) {
        playAlertTone(snapshot.status)
      }
    }

    previousStatusRef.current = snapshot.status
  }, [settings.notificationsEnabled, snapshot.status])

  const stopTracks = (mediaStream: MediaStream | null) => {
    mediaStream?.getTracks().forEach((track) => track.stop())
  }

  const publishCameraError = async (message: string) => {
    setCameraError(message)
    const next = buildCameraErrorSnapshot(message, useMonitoringStore.getState().snapshot)
    setSnapshot(next)
    await window.visio.monitoring.publish(next)
  }

  const startLoop = () => {
    const loop = async () => {
      if (!activeRef.current) {
        return
      }

      const localVideo = videoRef.current
      if (!localVideo || !detectorRef.current) {
        frameRequestRef.current = window.requestAnimationFrame(() => {
          void loop()
        })
        return
      }

      if (paused || useMonitoringStore.getState().snapshot.status === 'paused') {
        frameRequestRef.current = window.requestAnimationFrame(() => {
          void loop()
        })
        return
      }

      if (localVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        frameRequestRef.current = window.requestAnimationFrame(() => {
          void loop()
        })
        return
      }

      try {
        const result = await detectorRef.current.detect(localVideo, performance.now())
        const next = processMonitoringFrame(
          {
            ...result,
            timestamp: Date.now()
          },
          useMonitoringStore.getState().snapshot,
          useMonitoringStore.getState().settings,
          runtimeRef.current
        )
        runtimeRef.current = next.runtime
        setSnapshot(next.snapshot)
        await window.visio.monitoring.publish(next.snapshot)
      } catch (error) {
        await publishCameraError(error instanceof Error ? error.message : 'Unknown detection error')
      }

      frameRequestRef.current = window.requestAnimationFrame(() => {
        void loop()
      })
    }

    frameRequestRef.current = window.requestAnimationFrame(() => {
      void loop()
    })
  }

  const beginMonitoring = async () => {
    if (activeRef.current) {
      return
    }

    try {
      setCameraError(undefined)
      setPaused(false)
      const mediaStream = await requestCameraStream(settings.selectedCameraId)
      const devices = await listVideoDevices()
      setAvailableDevices(devices)
      setStream(mediaStream)

      const localVideo = document.createElement('video')
      localVideo.muted = true
      localVideo.autoplay = true
      localVideo.playsInline = true
      localVideo.srcObject = mediaStream
      await localVideo.play()
      videoRef.current = localVideo

      detectorRef.current = await createFaceLandmarker()
      activeRef.current = true
      runtimeRef.current = createMonitoringRuntimeState()
      reminderEventsRef.current = 0
      breakAlertsRef.current = 0
      drowsinessEventsRef.current = 0

      const nextSnapshot = {
        ...initialSnapshot,
        status: 'initializing',
        overlay: {
          ...initialSnapshot.overlay,
          visible: useMonitoringStore.getState().settings.overlay.visible,
          status: 'initializing',
          label: 'Initializing',
          sublabel: 'Starting camera and model',
          progress: 0
        },
        activeSession: {
          id: crypto.randomUUID(),
          startedAt: new Date().toISOString(),
          blinkCount: 0,
          averageEar: 0,
          fatigueEvents: 0,
          breakAlerts: 0,
          completedBreaks: 0,
          breakTakenAt: [],
          durationSeconds: 0
        }
      } satisfies MonitoringSnapshot

      setSnapshot(nextSnapshot)
      await window.visio.monitoring.publish(nextSnapshot)
      startLoop()
    } catch (error) {
      activeRef.current = false
      stopTracks(useMonitoringStore.getState().stream)
      setStream(null)
      await publishCameraError(error instanceof Error ? error.message : 'Unable to start camera stream')
    }
  }

  const endMonitoring = async (persistSession: boolean) => {
    activeRef.current = false
    if (frameRequestRef.current !== undefined) {
      window.cancelAnimationFrame(frameRequestRef.current)
      frameRequestRef.current = undefined
    }

    detectorRef.current?.close()
    detectorRef.current = null

    const currentStream = useMonitoringStore.getState().stream
    stopTracks(currentStream)
    setStream(null)

    if (persistSession) {
      const current = useMonitoringStore.getState().snapshot
      if (current.activeSession) {
        const summary = buildSessionSummary(
          current.activeSession,
          current.metrics,
          reminderEventsRef.current + drowsinessEventsRef.current,
          breakAlertsRef.current
        )
        setSessions([summary, ...useMonitoringStore.getState().sessions] as SessionSummary[])
        await window.visio.monitoring.publish({ ...current, activeSession: summary })
      }
    }

    runtimeRef.current = createMonitoringRuntimeState()
    reminderEventsRef.current = 0
    breakAlertsRef.current = 0
    drowsinessEventsRef.current = 0
    const currentOverlay = useMonitoringStore.getState().snapshot.overlay
    setSnapshot({
      ...initialSnapshot,
      overlay: {
        ...initialSnapshot.overlay,
        visible: currentOverlay.visible
      }
    })
    setPaused(false)
    videoRef.current = null
  }

  const startCalibration = async () => {
    if (!activeRef.current || paused) {
      return
    }

    runtimeRef.current = startCalibrationRun(runtimeRef.current, Date.now())
    const nextSnapshot = buildCalibrationSnapshot(useMonitoringStore.getState().snapshot)
    setSnapshot(nextSnapshot)
    await window.visio.monitoring.publish(nextSnapshot)
  }

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const currentSnapshot = useMonitoringStore.getState().snapshot
    const next = { ...useMonitoringStore.getState().settings, ...partial }
    let nextSnapshot = currentSnapshot

    if (partial.overlay) {
      nextSnapshot = {
        ...currentSnapshot,
        overlay: {
          ...currentSnapshot.overlay,
          visible: partial.overlay.visible,
          label: currentSnapshot.overlay.label,
          sublabel: currentSnapshot.overlay.sublabel,
          progress: currentSnapshot.overlay.progress
        }
      }
      setSnapshot(nextSnapshot)
    }

    const saved = await window.visio.settings.save(next)
    setSettings(saved)
    if (partial.overlay) {
      const syncedSnapshot = {
        ...nextSnapshot,
        overlay: {
          ...nextSnapshot.overlay,
          visible: saved.overlay.visible
        }
      }
      setSnapshot(syncedSnapshot)
      await window.visio.monitoring.publish(syncedSnapshot)
      await window.visio.overlay.applySettings(saved.overlay)
    }
  }

  const running =
    stream !== null ||
    Boolean(snapshot.activeSession) ||
    snapshot.status === 'initializing' ||
    snapshot.status === 'calibration-needed' ||
    snapshot.status === 'calibrating' ||
    snapshot.status === 'monitoring' ||
    snapshot.status === 'blink-reminder' ||
    snapshot.status === 'looking-away' ||
    snapshot.status === 'paused' ||
    snapshot.status === 'low-light' ||
    snapshot.status === 'no-face' ||
    snapshot.status === 'break-due' ||
    snapshot.status === 'break-in-progress' ||
    snapshot.status === 'drowsiness-warning'

  const actions: MonitoringActions = useMemo(
    () => ({
      paused,
      running,
      start: () => {
        void window.visio.monitoring.command('start')
      },
      stop: () => {
        void window.visio.monitoring.command('stop')
      },
      pauseResume: () => {
        void window.visio.monitoring.command(paused ? 'resume' : 'pause')
      },
      hideDashboard: () => {
        void window.visio.lifecycle.hideDashboard()
      }
    }),
    [paused, running]
  )

  const calibration: CalibrationControls = {
    running: snapshot.metrics.calibrationStatus === 'running',
    ready: snapshot.metrics.calibrationStatus === 'ready',
    canStart: running && !paused,
    start: () => {
      void startCalibration()
    }
  }

  return {
    snapshot,
    sessions,
    settings,
    stream,
    availableDevices,
    cameraError,
    updateSettings,
    actions,
    calibration
  }
}
