# Pulse Terminal

Real-time crypto market intelligence dashboard built as a portfolio-grade React application.

It streams public Binance market data over **native WebSockets**, keeps the UI responsive under high event rates, and demonstrates order-book synchronization, virtualization, and a built-in performance lab.

![Pulse Terminal](docs/architecture.svg)

## Why this project

Most GitHub demos stop at “connect to a WebSocket.” Pulse Terminal focuses on the hard parts:

- **Event pressure** — messages are batched on `requestAnimationFrame` instead of re-rendering per trade
- **Connection reliability** — reconnect with exponential backoff and stale-data detection
- **Correctness** — local order book follows Binance snapshot + diff sequence rules
- **Heavy UI** — dense terminal layout, virtualized trade feed, live candlesticks, DOM-style depth
- **Proof under load** — Performance Lab injects 1k / 5k / 10k synthetic events per second
- **i18n** — English / Serbian locale toggle with persisted preference
- **CVD heatmap** — taker buy/sell pressure from the live trade stream
- **Themes** — Classic dark and true-black OLED

## Stack

| Area | Choice |
| --- | --- |
| App | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn-style primitives |
| REST | TanStack Query → Binance `data-api.binance.vision` |
| Streaming | Native WebSocket → `data-stream.binance.vision` |
| State | Zustand |
| Charts | Lightweight Charts |
| Tables | TanStack Virtual |
| Tests | Vitest |

No backend is required for market data. Everything runs in the browser against Binance public endpoints.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

```bash
npm run test      # unit tests
npm run build     # production build
npm run preview   # serve the build
```

## Architecture

```text
React UI ──► Zustand store ◄── rAF batcher ◄── WebSocketManager ◄── Binance WS
    │                                                             
    └── TanStack Query ──► Binance REST (tickers, klines, depth snapshot)
```

Key modules:

- [`src/lib/ws/manager.ts`](src/lib/ws/manager.ts) — connection lifecycle, combined streams, metrics
- [`src/lib/ws/batcher.ts`](src/lib/ws/batcher.ts) — coalesces bursts into one UI flush per frame
- [`src/lib/binance/orderbook.ts`](src/lib/binance/orderbook.ts) — local book sync helpers
- [`src/hooks/use-market-stream.ts`](src/hooks/use-market-stream.ts) — wires streams into the store

## Data sources

- REST base: `https://data-api.binance.vision`
- WebSocket base: `wss://data-stream.binance.vision`
- Streams used: `@ticker`, `@trade`, `@kline_*`, `@depth@100ms`

These market-data hosts do not require an API key.

## Performance lab

Use the lab panel to simulate load separately from live exchange traffic:

1. Click `1,000/s`, `5,000/s`, or `10,000/s`
2. Watch **events/sec**, **dropped events**, and **UI update Hz**
3. Click `Stop` to return to live-only mode

Synthetic rows are clearly labeled as lab traffic in the panel.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Typecheck + production bundle |
| `npm run test` | Vitest unit tests |
| `npm run lint` | Oxlint |
| `npm run preview` | Preview production build |

## Deploy

Static SPA — works on Vercel, Netlify, or Cloudflare Pages.

```bash
npm run build
```

Publish the `dist/` folder. A `vercel.json` SPA rewrite is included.

## Roadmap ideas

- Multi-exchange aggregation via a small Fastify fan-in service
- Persist watchlist / layout preferences
- Playwright end-to-end smoke tests
- Shared worker for WebSocket ownership across tabs

## License

MIT
