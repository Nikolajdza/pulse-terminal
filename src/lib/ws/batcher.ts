export class FrameBatcher<T> {
  private buffer: T[] = []
  private rafId: number | null = null
  private readonly onFlush: (items: T[]) => void
  private readonly maxBuffer: number
  private dropped = 0

  constructor(onFlush: (items: T[]) => void, maxBuffer = 5_000) {
    this.onFlush = onFlush
    this.maxBuffer = maxBuffer
  }

  push(item: T) {
    if (this.buffer.length >= this.maxBuffer) {
      this.dropped += 1
      this.buffer.shift()
    }
    this.buffer.push(item)
    this.schedule()
  }

  pushMany(items: T[]) {
    for (const item of items) this.push(item)
  }

  getDropped(): number {
    return this.dropped
  }

  resetDropped() {
    this.dropped = 0
  }

  flushNow() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    if (this.buffer.length === 0) return
    const items = this.buffer
    this.buffer = []
    this.onFlush(items)
  }

  clear() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.buffer = []
  }

  private schedule() {
    if (this.rafId !== null) return
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null
      if (this.buffer.length === 0) return
      const items = this.buffer
      this.buffer = []
      this.onFlush(items)
    })
  }
}
