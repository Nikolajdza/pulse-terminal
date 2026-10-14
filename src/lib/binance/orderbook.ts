import type { DepthLevel, DepthUpdate, OrderBookSnapshot } from './types'

export interface LocalOrderBook {
  lastUpdateId: number
  bids: Map<number, number>
  asks: Map<number, number>
}

export function createEmptyBook(): LocalOrderBook {
  return {
    lastUpdateId: 0,
    bids: new Map(),
    asks: new Map(),
  }
}

export function snapshotToBook(snapshot: OrderBookSnapshot): LocalOrderBook {
  return {
    lastUpdateId: snapshot.lastUpdateId,
    bids: levelsToMap(snapshot.bids),
    asks: levelsToMap(snapshot.asks),
  }
}

function levelsToMap(levels: DepthLevel[]): Map<number, number> {
  const map = new Map<number, number>()
  for (const level of levels) {
    if (level.qty > 0) map.set(level.price, level.qty)
  }
  return map
}

function applySide(map: Map<number, number>, levels: DepthLevel[]) {
  for (const level of levels) {
    if (level.qty === 0) map.delete(level.price)
    else map.set(level.price, level.qty)
  }
}

export function applyDepthUpdate(book: LocalOrderBook, update: DepthUpdate): LocalOrderBook {
  applySide(book.bids, update.bids)
  applySide(book.asks, update.asks)
  book.lastUpdateId = update.finalUpdateId
  return book
}

/**
 * Binance local order book sync rules:
 * - Drop events with u <= snapshot.lastUpdateId
 * - First applied event must satisfy U <= lastUpdateId+1 && u >= lastUpdateId+1
 * - Subsequent events must be contiguous (U === lastUpdateId + 1)
 */
export function shouldApplyUpdate(
  book: LocalOrderBook,
  update: DepthUpdate,
  isFirstAfterSnapshot: boolean,
): 'apply' | 'skip' | 'resync' {
  if (update.finalUpdateId <= book.lastUpdateId) return 'skip'

  if (isFirstAfterSnapshot) {
    if (
      update.firstUpdateId <= book.lastUpdateId + 1 &&
      update.finalUpdateId >= book.lastUpdateId + 1
    ) {
      return 'apply'
    }
    return 'skip'
  }

  if (update.firstUpdateId !== book.lastUpdateId + 1) return 'resync'
  return 'apply'
}

export function sortedBids(book: LocalOrderBook, limit: number): DepthLevel[] {
  return [...book.bids.entries()]
    .sort((a, b) => b[0] - a[0])
    .slice(0, limit)
    .map(([price, qty]) => ({ price, qty }))
}

export function sortedAsks(book: LocalOrderBook, limit: number): DepthLevel[] {
  return [...book.asks.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, limit)
    .map(([price, qty]) => ({ price, qty }))
}

export function parseDepthUpdate(payload: {
  E: number
  s: string
  U: number
  u: number
  b: [string, string][]
  a: [string, string][]
}): DepthUpdate {
  return {
    eventTime: payload.E,
    symbol: payload.s,
    firstUpdateId: payload.U,
    finalUpdateId: payload.u,
    bids: payload.b.map(([price, qty]) => ({ price: Number(price), qty: Number(qty) })),
    asks: payload.a.map(([price, qty]) => ({ price: Number(price), qty: Number(qty) })),
  }
}
