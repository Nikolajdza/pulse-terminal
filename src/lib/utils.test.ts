import { describe, expect, it } from 'vitest'
import { displayPair, formatPercent } from './utils'

describe('utils', () => {
  it('formats pairs and percents', () => {
    expect(displayPair('BTCUSDT')).toBe('BTC / USDT')
    expect(formatPercent(2.41)).toBe('+2.41%')
    expect(formatPercent(-1.2)).toBe('-1.20%')
  })
})
