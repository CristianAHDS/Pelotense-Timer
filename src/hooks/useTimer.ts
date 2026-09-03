import { useState, useRef, useCallback, useEffect } from 'react'
import type { TimerStatus, TimerConfig, FinishAction } from '../types/timer'
import { DEFAULT_CONFIG } from '../types/timer'
import { loadStorage, saveStorage, type TimerStorage } from './storage'
import { syncClient, type SyncState } from './syncClient'

export interface UseTimerReturn {
  totalSeconds: number
  remainingSeconds: number
  status: TimerStatus
  config: TimerConfig
  setTime: (seconds: number) => void
  addTime: (seconds: number) => void
  start: () => void
  pause: () => void
  resume: () => void
  reset: (newSeconds?: number) => void
  setConfig: (config: Partial<TimerConfig>) => void
  formattedTime: string
}

function formatTime(totalSec: number): string {
  const clamped = Math.max(0, totalSec)
  const h = Math.floor(clamped / 3600)
  const m = Math.floor((clamped % 3600) / 60)
  const s = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function useTimer(): UseTimerReturn {
  const [stored] = useState<TimerStorage | null>(() => {
    const data = loadStorage()
    if (!data) return null
    return data
  })

  const initialState = useRef(
    stored && stored.status === 'running' && stored.endAt !== null
      ? Math.max(0, Math.floor((stored.endAt - Date.now()) / 1000))
      : (stored?.remainingSeconds ?? 0)
  )

  const [totalSeconds, setTotalSeconds] = useState(stored?.totalSeconds ?? 0)
  const [remainingSeconds, setRemainingSeconds] = useState(initialState.current)
  const [status, setStatus] = useState<TimerStatus>(
    stored?.status === 'running' && initialState.current === 0 ? 'finished' : (stored?.status ?? 'idle')
  )
  const [config, setConfigState] = useState<TimerConfig>(stored?.config ?? DEFAULT_CONFIG)

  const endAtRef = useRef<number | null>(
    stored && stored.status === 'running' && initialState.current > 0 ? stored.endAt : null
  )

  const intervalRef = useRef<number | null>(null)
  const configRef = useRef(config)
  configRef.current = config
  const totalRef = useRef(totalSeconds)
  totalRef.current = totalSeconds
  const remainingRef = useRef(remainingSeconds)
  remainingRef.current = remainingSeconds
  const statusRef = useRef(status)
  statusRef.current = status
  const channelRef = useRef<BroadcastChannel | null>(null)

  const snapshot = useCallback((): TimerStorage => {
    const rem =
      statusRef.current === 'running' && endAtRef.current !== null
        ? Math.max(0, Math.floor((endAtRef.current - Date.now()) / 1000))
        : remainingRef.current
    return {
      totalSeconds: totalRef.current,
      remainingSeconds: rem,
      status: statusRef.current,
      config: configRef.current,
      endAt: endAtRef.current,
    }
  }, [])

  const withClock = useCallback((state: TimerStorage) => {
    return { ...state, sentAt: Date.now() }
  }, [])

  const broadcastNow = useCallback(() => {
    try {
      channelRef.current?.postMessage(JSON.stringify(withClock(snapshot())))
    } catch {
      // channel may not be available
    }
  }, [snapshot, withClock])

  const persistNow = useCallback(() => {
    saveStorage(snapshot())
  }, [snapshot])

  const applyRemaining = useCallback((value: number) => {
    remainingRef.current = value
    setRemainingSeconds(value)
  }, [])

  const finishRun = useCallback(() => {
    const action: FinishAction = configRef.current.finishAction
    if (action === 'stop') {
      endAtRef.current = null
      setStatus('finished')
      applyRemaining(0)
    } else {
      const total = totalRef.current
      const now = Date.now()
      endAtRef.current = now + total * 1000
      setStatus('running')
      applyRemaining(total)
    }
  }, [applyRemaining])

  const start = useCallback(() => {
    if (remainingSeconds > 0 && status !== 'running') {
      endAtRef.current = Date.now() + remainingSeconds * 1000
      setStatus('running')
    }
  }, [remainingSeconds, status])

  const pause = useCallback(() => {
    if (status === 'running') {
      endAtRef.current = null
      setStatus('paused')
    }
  }, [status])

  const resume = useCallback(() => {
    if (status === 'paused') {
      if (remainingSeconds > 0) {
        endAtRef.current = Date.now() + remainingSeconds * 1000
        setStatus('running')
      }
    }
  }, [status, remainingSeconds])

  const reset = useCallback(
    (newSeconds?: number) => {
      endAtRef.current = null
      if (newSeconds !== undefined) {
        const s = Math.max(0, newSeconds)
        setTotalSeconds(s)
        applyRemaining(s)
      }
      setStatus('idle')
    },
    [applyRemaining]
  )

  const setTime = useCallback(
    (seconds: number) => {
      const s = Math.max(0, seconds)
      endAtRef.current = null
      setTotalSeconds(s)
      applyRemaining(s)
      setStatus('idle')
    },
    [applyRemaining]
  )

  const addTime = useCallback(
    (seconds: number) => {
      const sec = Math.max(0, seconds)
      if (endAtRef.current !== null && statusRef.current === 'running') {
        endAtRef.current = endAtRef.current + sec * 1000
      }
      const next = remainingSeconds + sec
      applyRemaining(next)
      setTotalSeconds((prev) => prev + sec)
    },
    [applyRemaining, remainingSeconds]
  )

  const setConfig = useCallback((partial: Partial<TimerConfig>) => {
    setConfigState((prev) => ({ ...prev, ...partial }))
  }, [])

  useEffect(() => {
    return () => clearInterval(intervalRef.current ?? undefined)
  }, [])

  useEffect(() => {
    if (status === 'running' && endAtRef.current !== null) {
      intervalRef.current = window.setInterval(() => {
        if (endAtRef.current === null) return
        const remaining = Math.max(0, Math.floor((endAtRef.current - Date.now()) / 1000))
        if (remaining <= 0) {
          clearInterval(intervalRef.current ?? undefined)
          intervalRef.current = null
          finishRun()
          return
        }
        applyRemaining(remaining)
      }, 250)
    } else {
      clearInterval(intervalRef.current ?? undefined)
      intervalRef.current = null
    }
    return () => {
      clearInterval(intervalRef.current ?? undefined)
      intervalRef.current = null
    }
  }, [status, applyRemaining, finishRun])

  useEffect(() => {
    syncClient.init()

    const publish = () => {
      const snap = snapshot()
      syncClient.publish(withClock(snap) as unknown as SyncState)
    }

    const id = window.setInterval(() => {
      persistNow()
      broadcastNow()
      publish()
    }, 100)
    return () => clearInterval(id)
  }, [persistNow, broadcastNow, snapshot])

  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') {
      channelRef.current = new BroadcastChannel('temporizador-pelotense-sync')
    }
    return () => {
      channelRef.current?.close()
      channelRef.current = null
    }
  }, [])

  useEffect(() => {
    broadcastNow()
    persistNow()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, config])

  return {
    totalSeconds,
    remainingSeconds,
    status,
    config,
    setTime,
    addTime,
    start,
    pause,
    resume,
    reset,
    setConfig,
    formattedTime: formatTime(remainingSeconds),
  }
}
