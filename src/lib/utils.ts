import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits,
  }).format(value)
}

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, digits = 2): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function formatQty(value: number, asset: string): string {
  const digits = value >= 100 ? 1 : value >= 1 ? 2 : 4
  return `${formatNumber(value, digits)} ${asset}`
}

export function baseAsset(symbol: string): string {
  return symbol.replace(/USDT$/i, '').replace(/BUSD$/i, '')
}

export function displayPair(symbol: string): string {
  const base = baseAsset(symbol)
  if (symbol.toUpperCase().endsWith('USDT')) return `${base} / USDT`
  return symbol
}
