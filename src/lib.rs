// ─── TerraWatch — Rust/WASM core ─────────────────────────────
// All application logic lives here.
// The JS surface is intentionally minimal:
//   • src/main.js  — imports WASM, calls init()
//   • src/leaflet_bridge.js — Leaflet map API bridge
//   • public/worker.js — data pipeline (pure JS, I/O bound)
//   • public/sw.js — service worker
mod app;
mod config;
mod dom;
mod geo;
mod icons;
mod leaflet;
mod pipeline;
mod render;
mod state;
mod types;

use wasm_bindgen::prelude::*;

/// Called automatically by `wasm-bindgen` after `await init()` in main.js.
#[wasm_bindgen(start)]
pub fn start() {
    app::init();
}
