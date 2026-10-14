import { afterEach, describe, expect, it, vi } from 'vitest'
import { FrameBatcher } from './batcher'

describe('FrameBatcher', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('coalesces pushes into a single flush', () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      frames.push(cb)
      return frames.length
    })
    vi.stubGlobal('cancelAnimationFrame', () => undefined)

    const flushed: number[][] = []
    const batcher = new FrameBatcher<number>((items) => flushed.push(items))

    batcher.push(1)
    batcher.push(2)
    batcher.push(3)
    expect(flushed).toHaveLength(0)

    frames[0]!(0)
    expect(flushed).toEqual([[1, 2, 3]])
  })

  it('drops oldest items when buffer overflows', () => {
    vi.stubGlobal('requestAnimationFrame', () => 1)
    vi.stubGlobal('cancelAnimationFrame', () => undefined)

    const batcher = new FrameBatcher<number>(() => undefined, 2)
    batcher.push(1)
    batcher.push(2)
    batcher.push(3)
    expect(batcher.getDropped()).toBe(1)
  })
})
