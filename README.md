# TerraWatch — Rust/WASM

> Natural disaster monitor. Core logic in **Rust compiled to WebAssembly**; only
> the Leaflet map bridge and the data-pipeline Worker remain in JS.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│                                                             │
│  index.html                                                 │
│    └─ src/main.js (6 lines)  ── await init(wasm)            │
│                                      │                      │
│         ┌────────────────────────────┘                      │
│         │  tw_wasm.wasm  (Rust → WASM)                      │
│         │    lib.rs → app.rs          event wiring          │
│         │    state.rs                 AppState (thread_local)│
│         │    render.rs                DOM mutations          │
│         │    pipeline.rs              Worker lifecycle       │
│         │    geo.rs                   haversine + geoloc     │
│         │    config.rs                colours/labels (static)│
│         │    icons.rs                 SVG (include_str!)     │
│         │    dom.rs                   web-sys helpers        │
│         │    leaflet.rs               extern JS imports      │
│         │    types.rs                 Event, Filter, View    │
│         │                                                    │
│         └─→ src/leaflet_bridge.js    Leaflet map API        │
│                                                             │
│  public/worker.js (JS, I/O bound)   50+ data sources        │
│  public/sw.js                        service worker         │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

```bash
# 1. Rust (stable)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. WASM target
rustup target add wasm32-unknown-unknown

# 3. wasm-pack
cargo install wasm-pack

# 4. Node deps
npm install
```

## Dev

```bash
npm run dev          # builds WASM then starts Vite dev server
```

## Production build

```bash
npm run build        # wasm-pack build + vite build → dist/
```

## Deploy to GitHub Pages

```bash
GIT_USERNAME=lovizotto GIT_PASSWORD=<token> npm run deploy
```

Or manually:
```bash
npm run build
cp -r dist/. ../terrawatch-pwa/
cd ../terrawatch-pwa
git add -A && git commit -m "deploy" && git push origin gh-pages
```

## Key crates

| Crate | Purpose |
|-------|---------|
| `wasm-bindgen` | Rust ↔ JS interop |
| `web-sys` | DOM, Worker, Geolocation APIs |
| `js-sys` | JS builtins (Date, Object, Reflect) |
| `serde` + `serde-wasm-bindgen` | JSON ↔ Rust structs |
| `serde_json` | Parse embedded `static_events.json` |
| `console_error_panic_hook` | Rust panics → browser console |

## Why keep worker.js in JS?

The data pipeline is pure network I/O: 50+ HTTP fetches + 35 Claude AI queries.
WASM has no native `fetch` — it must call back into JS anyway.
Keeping it in JS is simpler and adds zero overhead.
