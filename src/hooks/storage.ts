import type { TimerStatus, TimerConfig } from '../types/timer'

export const STORAGE_KEY = 'temporizador-pelotense'
export const SYNC_CHANNEL = 'temporizador-pelotense-sync'

export interface TimerStorage {
  totalSeconds: number
  remainingSeconds: number
  status: TimerStatus
  config: TimerConfig
  endAt: number | null
}

export function loadStorage(): TimerStorage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TimerStorage
  } catch {
    return null
  }
}

export function saveStorage(state: TimerStorage) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}
