export interface BackoffOptions {
  initialMs?: number
  maxMs?: number
  factor?: number
  jitter?: number
}

export class ExponentialBackoff {
  private attempt = 0
  private readonly initialMs: number
  private readonly maxMs: number
  private readonly factor: number
  private readonly jitter: number

  constructor(options: BackoffOptions = {}) {
    this.initialMs = options.initialMs ?? 500
    this.maxMs = options.maxMs ?? 15_000
    this.factor = options.factor ?? 2
    this.jitter = options.jitter ?? 0.2
  }

  next(): number {
    const base = Math.min(this.initialMs * this.factor ** this.attempt, this.maxMs)
    this.attempt += 1
    const spread = base * this.jitter
    return Math.round(base - spread + Math.random() * spread * 2)
  }

  reset() {
    this.attempt = 0
  }
}
