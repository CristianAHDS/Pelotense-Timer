export type SyncState = {
  totalSeconds: number
  remainingSeconds: number
  status: string
  config: Record<string, unknown>
  endAt: number | null
}

type Listener = (data: SyncState) => void

class SyncClient {
  private ws: WebSocket | null = null
  private listeners = new Set<Listener>()
  private reconnectTimer: number | null = null
  private enabled = false
  private lastSent: number | null = null

  init() {
    if (this.ws || this.enabled) return
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${proto}//${window.location.host}/ws`
    this.enabled = true
    try {
      this.ws = new WebSocket(url)
    } catch {
      return
    }

    this.ws.onopen = () => {
      this.send({ type: 'ping' })
    }

    this.ws.onmessage = (event) => {
      let msg
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }
      if (msg.type === 'state') {
        const data = msg.data as SyncState
        for (const l of this.listeners) l(data)
      }
    }

    this.ws.onclose = () => {
      this.ws = null
      if (this.reconnectTimer !== null) return
      this.reconnectTimer = window.setTimeout(() => {
        this.reconnectTimer = null
        this.enabled = false
        this.ws = null
        this.init()
      }, 2000)
    }
  }

  sendRaw(payload: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload)
    }
  }

  send(message: Record<string, unknown>) {
    this.sendRaw(JSON.stringify(message))
  }

  publish(state: SyncState) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    const now = Date.now()
    if (this.lastSent !== null && now - this.lastSent < 100) return
    this.lastSent = now
    this.send({ type: 'state', data: state })
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  isConnected() {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

export const syncClient = new SyncClient()
