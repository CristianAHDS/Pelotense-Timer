import { useEffect, useState } from 'react'
import type { TimerConfig, TimerStatus } from '../types/timer'
import { DEFAULT_CONFIG } from '../types/timer'
import { STORAGE_KEY, SYNC_CHANNEL, loadStorage, type TimerStorage } from './storage'

interface MirrorState {
  totalSeconds: number
  remainingSeconds: number
  status: TimerStatus
  config: TimerConfig
  endAt: number | null
}

function readStored(): MirrorState {
  const data = loadStorage()
  if (!data) {
    return {
      totalSeconds: 0,
      remainingSeconds: 0,
      status: 'idle',
      config: DEFAULT_CONFIG,
      endAt: null,
    }
  }

  if (data.status === 'running' && data.endAt !== null) {
    const remaining = Math.max(0, Math.ceil((data.endAt - Date.now()) / 1000))
    if (remaining <= 0) {
      return { ...data, status: 'finished', remainingSeconds: 0, endAt: null }
    }
    return { ...data, remainingSeconds: remaining }
  }
  return data
}

function parsePayload(raw: string): TimerStorage | null {
  try {
    return JSON.parse(raw) as TimerStorage
  } catch {
    return null
  }
}

/**
 * Read-only mirror of the timer state persisted/broadcast by the root page.
 * Reacts instantly to BroadcastChannel messages from the root and, as a
 * fallback, to `storage` events. Ticks down locally from `endAt`.
 */
export function useStoredTimer() {
  const [state, setState] = useState<MirrorState>(readStored)

  useEffect(() => {
    let channel: BroadcastChannel | null = null
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(SYNC_CHANNEL)
      channel.onmessage = (e: MessageEvent) => {
        const data = parsePayload(e.data as string)
        if (data) {
          const mirrored: MirrorState = {
            totalSeconds: data.totalSeconds,
            remainingSeconds: data.remainingSeconds,
            status: data.status,
            config: data.config,
            endAt: data.endAt,
          }
          setState(mirrored)
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          } catch {
            // ignore
          }
        }
      }
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setState(readStored())
      }
    }
    window.addEventListener('storage', onStorage)

    return () => {
      channel?.close()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    if (state.status !== 'running' || state.endAt === null) return

    const id = window.setInterval(() => {
      setState((prev) => {
        if (prev.status !== 'running' || prev.endAt === null) return prev
        const next = Math.max(0, Math.ceil((prev.endAt - Date.now()) / 1000))
        if (next <= 0) {
          return { ...prev, status: 'finished', remainingSeconds: 0, endAt: null }
        }
        return { ...prev, remainingSeconds: next }
      })
    }, 250)

    return () => clearInterval(id)
  }, [state.status, state.endAt])

  return {
    totalSeconds: state.totalSeconds,
    remainingSeconds: state.remainingSeconds,
    status: state.status,
    config: state.config,
  }
}
