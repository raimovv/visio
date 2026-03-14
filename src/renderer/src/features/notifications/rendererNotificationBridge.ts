import type { MonitoringStatus, NotificationPayload } from '@shared/types'
import type { AlertStatus } from '@renderer/features/monitoring/monitoringTypes'

let audioContext: AudioContext | null = null

function getAudioContext() {
  if (audioContext) {
    return audioContext
  }

  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
    return null
  }

  audioContext = new window.AudioContext()
  return audioContext
}

function getAlertPattern(status: AlertStatus) {
  if (status === 'camera-error') {
    return [220, 180, 220]
  }

  if (status === 'break-due') {
    return [660, 880]
  }

  if (status === 'blink-reminder') {
    return [740, 880]
  }

  return [540, 720, 540]
}

export async function notify(payload: NotificationPayload) {
  return window.visio.notifications.send(payload)
}

export function playAlertTone(status: MonitoringStatus) {
  if (
    status !== 'blink-reminder' &&
    status !== 'drowsiness-warning' &&
    status !== 'break-due' &&
    status !== 'camera-error'
  ) {
    return
  }

  const context = getAudioContext()
  if (!context) {
    return
  }

  if (context.state === 'suspended') {
    void context.resume()
  }

  const frequencies = getAlertPattern(status)
  const now = context.currentTime

  frequencies.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = status === 'camera-error' ? 'square' : 'sine'
    oscillator.frequency.value = frequency
    gain.gain.value = 0.0001
    oscillator.connect(gain)
    gain.connect(context.destination)

    const startAt = now + index * 0.18
    gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16)
    oscillator.start(startAt)
    oscillator.stop(startAt + 0.17)
  })
}
