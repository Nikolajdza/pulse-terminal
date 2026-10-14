import { describe, expect, it } from 'vitest'
import {
  applyDepthUpdate,
  shouldApplyUpdate,
  snapshotToBook,
  sortedAsks,
  sortedBids,
} from './orderbook'
import type { DepthUpdate, OrderBookSnapshot } from './types'

const snapshot: OrderBookSnapshot = {
  lastUpdateId: 100,
  bids: [
    { price: 100, qty: 2 },
    { price: 99, qty: 1 },
  ],
  asks: [
    { price: 101, qty: 3 },
    { price: 102, qty: 4 },
  ],
}

function update(partial: Partial<DepthUpdate> & Pick<DepthUpdate, 'firstUpdateId' | 'finalUpdateId'>): DepthUpdate {
  return {
    eventTime: 1,
    symbol: 'BTCUSDT',
    bids: [],
    asks: [],
    ...partial,
  }
}

describe('order book sync', () => {
  it('loads snapshot and sorts sides', () => {
    const book = snapshotToBook(snapshot)
    expect(sortedBids(book, 10).map((l) => l.price)).toEqual([100, 99])
    expect(sortedAsks(book, 10).map((l) => l.price)).toEqual([101, 102])
  })

  it('skips stale updates and applies the bridging first update', () => {
    const book = snapshotToBook(snapshot)
    expect(shouldApplyUpdate(book, update({ firstUpdateId: 90, finalUpdateId: 95 }), true)).toBe(
      'skip',
    )
    expect(
      shouldApplyUpdate(book, update({ firstUpdateId: 95, finalUpdateId: 105 }), true),
    ).toBe('apply')
  })

  it('detects gaps that require resync', () => {
    const book = snapshotToBook(snapshot)
    applyDepthUpdate(
      book,
      update({
        firstUpdateId: 101,
        finalUpdateId: 105,
        bids: [{ price: 100, qty: 5 }],
      }),
    )
    expect(book.bids.get(100)).toBe(5)
    expect(shouldApplyUpdate(book, update({ firstUpdateId: 110, finalUpdateId: 111 }), false)).toBe(
      'resync',
    )
  })

  it('removes levels when qty is zero', () => {
    const book = snapshotToBook(snapshot)
    applyDepthUpdate(
      book,
      update({
        firstUpdateId: 101,
        finalUpdateId: 101,
        asks: [{ price: 101, qty: 0 }],
      }),
    )
    expect(book.asks.has(101)).toBe(false)
  })
})
