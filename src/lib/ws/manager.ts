import { buildCombinedStreamUrl } from '@/lib/binance/ws-url'
import type { ConnectionStatus } from '@/lib/binance/types'
import { ExponentialBackoff } from './backoff'
import { FrameBatcher } from './batcher'

export type RawStreamMessage = {
  stream: string
  data: unknown
  receivedAt: number
}

export interface StreamMetrics {
  eventsReceived: number
  eventsDropped: number
  uiUpdates: number
  lastMessageAt: number | null
  latencyMs: number | null
  uiUpdateHz: number
  eventsPerSecond: number
}

type StatusListener = (status: ConnectionStatus) => void
type MessageListener = (messages: RawStreamMessage[]) => void
type MetricsListener = (metrics: StreamMetrics) => void

export class WebSocketManager {
  private socket: WebSocket | null = null
  private streams = new Set<string>()
  private desiredStreams = new Set<string>()
  private status: ConnectionStatus = 'offline'
  private backoff = new ExponentialBackoff()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private disposed = false
  private intentionalClose = false

  private statusListeners = new Set<StatusListener>()
  private messageListeners = new Set<MessageListener>()
  private metricsListeners = new Set<MetricsListener>()

  private metrics: StreamMetrics = {
    eventsReceived: 0,
    eventsDropped: 0,
    uiUpdates: 0,
    lastMessageAt: null,
    latencyMs: null,
    uiUpdateHz: 0,
    eventsPerSecond: 0,
  }

  private hzWindow: number[] = []
  private eventWindow: number[] = []
  private batcher: FrameBatcher<RawStreamMessage>

  constructor() {
    this.batcher = new FrameBatcher((items) => {
      this.metrics.uiUpdates += 1
      this.metrics.eventsDropped = this.batcher.getDropped()
      this.hzWindow.push(performance.now())
      this.trimHzWindow()
      this.metrics.uiUpdateHz = this.hzWindow.length
      this.emitMetrics()
      for (const listener of this.messageListeners) listener(items)
    })
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  getMetrics(): StreamMetrics {
    return { ...this.metrics }
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    listener(this.status)
    return () => this.statusListeners.delete(listener)
  }

  onMessages(listener: MessageListener): () => void {
    this.messageListeners.add(listener)
    return () => this.messageListeners.delete(listener)
  }

  onMetrics(listener: MetricsListener): () => void {
    this.metricsListeners.add(listener)
    listener(this.metrics)
    return () => this.metricsListeners.delete(listener)
  }

  setStreams(streams: string[]) {
    this.desiredStreams = new Set(streams.map((s) => s.toLowerCase()))
    this.syncConnection()
  }

  subscribe(stream: string) {
    this.desiredStreams.add(stream.toLowerCase())
    this.syncConnection()
  }

  unsubscribe(stream: string) {
    this.desiredStreams.delete(stream.toLowerCase())
    this.syncConnection()
  }

  disconnect() {
    this.intentionalClose = true
    this.clearReconnect()
    this.closeSocket()
    this.setStatus('offline')
  }

  dispose() {
    this.disposed = true
    this.disconnect()
    this.batcher.clear()
    this.statusListeners.clear()
    this.messageListeners.clear()
    this.metricsListeners.clear()
  }

  /** Inject synthetic events (performance lab). */
  injectSynthetic(count: number, factory: (index: number) => RawStreamMessage) {
    const items: RawStreamMessage[] = []
    const now = performance.now()
    for (let i = 0; i < count; i += 1) {
      this.metrics.eventsReceived += 1
      this.eventWindow.push(now)
      items.push(factory(i))
    }
    this.trimEventWindow()
    this.metrics.eventsPerSecond = this.eventWindow.length
    this.batcher.pushMany(items)
  }

  private syncConnection() {
    if (this.disposed) return

    const next = [...this.desiredStreams].sort()
    const current = [...this.streams].sort()
    const same =
      next.length === current.length && next.every((value, index) => value === current[index])

    if (next.length === 0) {
      this.intentionalClose = true
      this.clearReconnect()
      this.closeSocket()
      this.streams.clear()
      this.setStatus('offline')
      return
    }

    if (same && this.socket && this.socket.readyState <= WebSocket.OPEN) {
      return
    }

    this.streams = new Set(next)
    this.connect()
  }

  private connect() {
    this.clearReconnect()
    this.closeSocket()
    this.intentionalClose = false

    if (this.streams.size === 0) return

    this.setStatus(this.status === 'offline' ? 'connecting' : 'reconnecting')
    const url = buildCombinedStreamUrl([...this.streams])

    try {
      this.socket = new WebSocket(url)
    } catch {
      this.scheduleReconnect()
      return
    }

    this.socket.addEventListener('open', () => {
      this.backoff.reset()
      this.setStatus('live')
    })

    this.socket.addEventListener('message', (event) => {
      this.handleMessage(event.data)
    })

    this.socket.addEventListener('close', () => {
      this.socket = null
      if (this.intentionalClose || this.disposed) {
        this.setStatus('offline')
        return
      }
      this.scheduleReconnect()
    })

    this.socket.addEventListener('error', () => {
      // close handler drives reconnect
    })
  }

  private handleMessage(raw: unknown) {
    const receivedAt = performance.now()
    this.metrics.eventsReceived += 1
    this.metrics.lastMessageAt = Date.now()
    this.eventWindow.push(performance.now())
    this.trimEventWindow()
    this.metrics.eventsPerSecond = this.eventWindow.length

    let parsed: unknown
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch {
      return
    }

    const envelope = parsed as { stream?: string; data?: unknown }
    if (!envelope.stream || envelope.data === undefined) return

    const eventTime = (envelope.data as { E?: number }).E
    if (typeof eventTime === 'number') {
      this.metrics.latencyMs = Math.max(0, Date.now() - eventTime)
    }

    this.batcher.push({
      stream: envelope.stream,
      data: envelope.data,
      receivedAt,
    })
  }

  private scheduleReconnect() {
    this.setStatus('reconnecting')
    this.clearReconnect()
    const delay = this.backoff.next()
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private clearReconnect() {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private closeSocket() {
    if (!this.socket) return
    const socket = this.socket
    this.socket = null
    socket.onopen = null
    socket.onmessage = null
    socket.onerror = null
    socket.onclose = null
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close()
    }
  }

  private setStatus(status: ConnectionStatus) {
    if (this.status === status) return
    this.status = status
    for (const listener of this.statusListeners) listener(status)
  }

  private emitMetrics() {
    for (const listener of this.metricsListeners) listener({ ...this.metrics })
  }

  private trimHzWindow() {
    const cutoff = performance.now() - 1000
    while (this.hzWindow.length > 0 && this.hzWindow[0]! < cutoff) {
      this.hzWindow.shift()
    }
  }

  private trimEventWindow() {
    const cutoff = performance.now() - 1000
    while (this.eventWindow.length > 0 && this.eventWindow[0]! < cutoff) {
      this.eventWindow.shift()
    }
  }
}

let singleton: WebSocketManager | null = null

export function getWebSocketManager(): WebSocketManager {
  if (!singleton) singleton = new WebSocketManager()
  return singleton
}
