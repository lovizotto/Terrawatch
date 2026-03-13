// ─── TerraWatch — JS bootstrap ───────────────────────────────
// This file is intentionally minimal.
// All application logic lives in the Rust/WASM core (src/lib.rs).

import 'leaflet/dist/leaflet.css'
import init from '../pkg/tw_wasm.js'

await init()
// #[wasm_bindgen(start)] in lib.rs runs automatically after init().
