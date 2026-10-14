export type KlineInterval = '1m' | '5m' | '1h' | '1d'

export interface Ticker24h {
  symbol: string
  lastPrice: number
  priceChangePercent: number
  volume: number
  quoteVolume: number
  highPrice: number
  lowPrice: number
}

export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Trade {
  id: number
  symbol: string
  price: number
  qty: number
  time: number
  isBuyerMaker: boolean
}

export interface DepthLevel {
  price: number
  qty: number
}

export interface OrderBookSnapshot {
  lastUpdateId: number
  bids: DepthLevel[]
  asks: DepthLevel[]
}

export interface DepthUpdate {
  eventTime: number
  symbol: string
  firstUpdateId: number
  finalUpdateId: number
  bids: DepthLevel[]
  asks: DepthLevel[]
}

export interface WsTickerPayload {
  e: '24hrTicker'
  E: number
  s: string
  c: string
  P: string
  v: string
  q: string
  h: string
  l: string
}

export interface WsTradePayload {
  e: 'trade'
  E: number
  s: string
  t: number
  p: string
  q: string
  T: number
  m: boolean
}

export interface WsKlinePayload {
  e: 'kline'
  E: number
  s: string
  k: {
    t: number
    T: number
    s: string
    i: string
    o: string
    c: string
    h: string
    l: string
    v: string
    x: boolean
  }
}

export interface WsDepthPayload {
  e: 'depthUpdate'
  E: number
  s: string
  U: number
  u: number
  b: [string, string][]
  a: [string, string][]
}

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'offline'

export interface FlowBucket {
  start: number
  buy: number
  sell: number
  close: number
}
