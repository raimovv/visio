import { create } from 'zustand'
import type { AppSettings, MonitoringSnapshot, SessionSummary } from '@shared/types'
import { defaultRendererSettings, initialSnapshot } from '@renderer/utils/constants'

interface MonitoringState {
  snapshot: MonitoringSnapshot
  settings: AppSettings
  sessions: SessionSummary[]
  stream: MediaStream | null
  availableDevices: MediaDeviceInfo[]
  cameraError?: string
  setSnapshot(snapshot: MonitoringSnapshot): void
  setSettings(settings: AppSettings): void
  setSessions(sessions: SessionSummary[]): void
  setStream(stream: MediaStream | null): void
  setAvailableDevices(devices: MediaDeviceInfo[]): void
  setCameraError(error?: string): void
}

export const useMonitoringStore = create<MonitoringState>((set) => ({
  snapshot: initialSnapshot,
  settings: defaultRendererSettings,
  sessions: [],
  stream: null,
  availableDevices: [],
  cameraError: undefined,
  setSnapshot: (snapshot) => set({ snapshot }),
  setSettings: (settings) => set({ settings }),
  setSessions: (sessions) => set({ sessions }),
  setStream: (stream) => set({ stream }),
  setAvailableDevices: (availableDevices) => set({ availableDevices }),
  setCameraError: (cameraError) => set({ cameraError })
}))
