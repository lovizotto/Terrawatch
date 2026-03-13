// ─── SVG icons ───────────────────────────────────────────────
// Each SVG lives in assets/icons/<kind>.svg and is embedded at
// compile time via include_str!.  Zero runtime cost, no heap alloc.

pub fn icon_for(kind: &str) -> &'static str {
    match kind {
        "volcano"    => include_str!("../assets/icons/volcano.svg"),
        "hurricane"  => include_str!("../assets/icons/hurricane.svg"),
        "cyclone"    => include_str!("../assets/icons/cyclone.svg"),
        "storm"      => include_str!("../assets/icons/storm.svg"),
        "flood"      => include_str!("../assets/icons/flood.svg"),
        "tsunami"    => include_str!("../assets/icons/tsunami.svg"),
        "heat"       => include_str!("../assets/icons/heat.svg"),
        "cold"       => include_str!("../assets/icons/cold.svg"),
        _            => include_str!("../assets/icons/earthquake.svg"),
    }
}
