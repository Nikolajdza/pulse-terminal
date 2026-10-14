import { describe, expect, it } from 'vitest'
import { ExponentialBackoff } from './backoff'

describe('ExponentialBackoff', () => {
  it('increases delay until max and resets', () => {
    const backoff = new ExponentialBackoff({
      initialMs: 100,
      maxMs: 400,
      factor: 2,
      jitter: 0,
    })

    expect(backoff.next()).toBe(100)
    expect(backoff.next()).toBe(200)
    expect(backoff.next()).toBe(400)
    expect(backoff.next()).toBe(400)

    backoff.reset()
    expect(backoff.next()).toBe(100)
  })
})
