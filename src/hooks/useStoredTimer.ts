import { useEffect, useRef, useState } from 'react'
import type { TimerConfig, TimerStatus } from '../types/timer'
import { DEFAULT_CONFIG } from '../types/timer'
import { STORAGE_KEY, SYNC_CHANNEL, loadStorage, type TimerStorage } from './storage'
import { syncClient, type SyncState } from './syncClient'

interface MirrorState {
  totalSeconds: number
  remainingSeconds: number
  status: TimerStatus
  config: TimerConfig
  endAt: number | null
}

interface SyncPayload extends TimerStorage {
  sentAt?: number
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
    const remaining = Math.max(0, Math.floor((data.endAt - Date.now()) / 1000))
    if (remaining <= 0) {
      return { ...data, status: 'finished', remainingSeconds: 0, endAt: null }
    }
    return { ...data, remainingSeconds: remaining }
  }
  return data
}

function parsePayload(raw: string): SyncPayload | null {
  try {
    return JSON.parse(raw) as SyncPayload
  } catch {
    return null
  }
}

/**
 * Computes the clock offset between this device and the master: `sentAt` was
 * stamped with the master's clock, `Date.now()` with ours. The difference is
 * the offset we must *subtract* from the master's `endAt` (converting it to
 * our clock) so both devices count down from the same instant regardless of
 * their clock skew.
 */
function computeOffset(data: SyncPayload): number {
  if (typeof data.sentAt !== 'number') return 0
  return data.sentAt - Date.now()
}

/**
 * Read-only mirror of the timer state persisted/broadcast by the root page.
 * Reacts instantly to BroadcastChannel messages from the root and, as a
 * fallback, to `storage` events. Ticks down locally from `endAt`.
 */
export function useStoredTimer() {
  const [state, setState] = useState<MirrorState>(readStored)
  const offsetRef = useRef(0)

  const applyPayload = (data: SyncPayload) => {
    offsetRef.current = computeOffset(data)

    const effectiveEndAt = data.endAt !== null ? data.endAt - offsetRef.current : null
    const remaining =
      effectiveEndAt !== null
        ? Math.max(0, Math.floor((effectiveEndAt - Date.now()) / 1000))
        : data.remainingSeconds

    const mirrored: MirrorState = {
      totalSeconds: data.totalSeconds,
      remainingSeconds: remaining,
      status: data.status,
      config: data.config,
      endAt: effectiveEndAt,
    }
    setState(mirrored)
    return mirrored
  }

  useEffect(() => {
    let channel: BroadcastChannel | null = null
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(SYNC_CHANNEL)
      channel.onmessage = (e: MessageEvent) => {
        const data = parsePayload(e.data as string)
        if (data) {
          const mirrored = applyPayload(data)
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mirrored))
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    syncClient.init()

    const applyServer = (data: SyncState) => {
      const mirrored = applyPayload(data as unknown as SyncPayload)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mirrored))
      } catch {
        // ignore
      }
    }

    const unsubscribe = syncClient.subscribe(applyServer)
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (state.status !== 'running' || state.endAt === null) return

    const id = window.setInterval(() => {
      setState((prev) => {
        if (prev.status !== 'running' || prev.endAt === null) return prev
        const next = Math.max(0, Math.floor((prev.endAt - Date.now()) / 1000))
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
