// ─── Leaflet bridge bindings ─────────────────────────────────
// These extern declarations map directly to the functions in
// src/leaflet_bridge.js — Rust calls them, Vite bundles the JS file.
use wasm_bindgen::prelude::*;

#[wasm_bindgen(module = "/src/leaflet_bridge.js")]
extern "C" {
    /// Create a Leaflet map inside `id`.
    pub fn map_create(id: &str, lat: f64, lng: f64, zoom: u8) -> JsValue;

    /// Add the default OpenStreetMap tile layer.
    pub fn map_add_tiles(map: &JsValue);

    /// Add a glowing circle marker and return the marker object.
    pub fn marker_add(
        map:        &JsValue,
        lat:        f64,
        lng:        f64,
        color:      &str,
        size:       f64,
        glow_alpha: &str,
        z_offset:   i32,
        on_click:   &Closure<dyn Fn()>,
    ) -> JsValue;

    /// Remove a marker from the map.
    pub fn marker_remove(map: &JsValue, marker: &JsValue);

    /// Invalidate the map size (call after container becomes visible).
    pub fn map_invalidate(map: &JsValue);
}
