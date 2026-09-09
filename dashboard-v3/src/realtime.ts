export interface RealtimeEnvelope {
  id?: string
  type?: string
  instanceId?: string
  timestamp?: string
  payload?: any
}

export class RealtimeClient {
  private socket?: WebSocket
  private readonly listeners = new Set<(event: RealtimeEnvelope) => void>()
  private readonly subscriptions = new Set<string>()
  private reconnectTimer?: number
  private closed = false

  connect(): void {
    const readyState = this.socket?.readyState
    if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) return
    this.closed = false
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    this.socket = new WebSocket(`${protocol}//${window.location.host}/api/v1/ws`)
    this.socket.onopen = () => {
      for (const instanceId of this.subscriptions) this.send('subscribe', instanceId)
    }
    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as RealtimeEnvelope
        for (const listener of this.listeners) listener(parsed)
      } catch {}
    }
    this.socket.onclose = () => {
      this.socket = undefined
      if (!this.closed) this.reconnectTimer = window.setTimeout(() => this.connect(), 2000)
    }
  }

  subscribe(instanceId: string): void {
    this.subscriptions.add(instanceId)
    if (this.socket?.readyState === WebSocket.OPEN) this.send('subscribe', instanceId)
  }

  unsubscribe(instanceId: string): void {
    this.subscriptions.delete(instanceId)
    if (this.socket?.readyState === WebSocket.OPEN) this.send('unsubscribe', instanceId)
  }

  onEvent(listener: (event: RealtimeEnvelope) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  close(): void {
    this.closed = true
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer)
    this.socket?.close(1000, 'dashboard closed')
  }

  private send(action: string, instanceId?: string): void {
    this.socket?.send(JSON.stringify({ id: crypto.randomUUID(), type: 'command', action, instanceId }))
  }
}
