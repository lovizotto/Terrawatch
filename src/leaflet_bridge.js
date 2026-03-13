// ─── Leaflet bridge ──────────────────────────────────────────
// Exposed to Rust via #[wasm_bindgen(module = "/src/leaflet_bridge.js")].
// Keeps all Leaflet API calls in one place; Rust never imports Leaflet directly.

import L from 'leaflet'

/** Create a Leaflet map centred at (lat, lng) with the given zoom level. */
export function map_create(id, lat, lng, zoom) {
  return L.map(id, { zoomControl: false, attributionControl: false, minZoom: 2, maxZoom: 8 })
          .setView([lat, lng], zoom)
}

/** Add the default OSM tile layer to a map. */
export function map_add_tiles(map) {
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, subdomains: 'abc',
  }).addTo(map)
}

/**
 * Add a glowing circle marker.
 * Returns the Leaflet Marker object so Rust can store and later remove it.
 * @param {object}   map        - Leaflet Map
 * @param {number}   lat
 * @param {number}   lng
 * @param {string}   color      - CSS hex colour  e.g. "#FF4500"
 * @param {number}   size       - diameter in pixels
 * @param {string}   glow_alpha - 2-char hex opacity for box-shadow  e.g. "bb"
 * @param {Function} on_click   - JS callback (Rust Closure)
 */
export function marker_add(map, lat, lng, color, size, glow_alpha, z_offset, on_click) {
  const html = `<div style="
    width:${size}px; height:${size}px;
    background:${color};
    border-radius:50%;
    box-shadow: 0 0 ${size}px ${Math.round(size/2.5)}px ${color}${glow_alpha},
                0 0 0 1px rgba(0,0,0,.45);
    cursor:pointer;
  "></div>`

  const icon = L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size/2, size/2] })
  return L.marker([lat, lng], { icon, zIndexOffset: z_offset })
          .addTo(map)
          .on('click', on_click)
}

/** Remove a single marker from the map. */
export function marker_remove(map, marker) {
  map.removeLayer(marker)
}

/** Trigger a size recalculation after the container changes. */
export function map_invalidate(map) {
  setTimeout(() => map.invalidateSize(), 120)
}
