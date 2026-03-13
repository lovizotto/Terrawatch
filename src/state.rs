// ─── Global application state ────────────────────────────────
// Single mutable state cell for the WASM single-threaded runtime.
// Access via the `with_state` / `with_state_mut` helpers.
use std::cell::RefCell;
use wasm_bindgen::JsValue;

use crate::types::{Event, Filter, View};

// ─── Map sub-state (Leaflet objects + closures) ───────────────
pub struct MapState {
    /// The Leaflet Map JS object.
    pub map: Option<JsValue>,
    /// Active marker JS objects — removed on each re-render.
    pub markers: Vec<JsValue>,
    /// Click closures that must stay alive as long as their markers live.
    pub click_closures: Vec<wasm_bindgen::closure::Closure<dyn Fn()>>,
}

impl MapState {
    fn new() -> Self {
        Self { map: None, markers: Vec::new(), click_closures: Vec::new() }
    }

    /// Drop all markers and their closures.
    pub fn clear(&mut self, map: &JsValue) {
        for marker in self.markers.drain(..) {
            crate::leaflet::marker_remove(map, &marker);
        }
        self.click_closures.clear();
    }
}

// ─── Source tracking ─────────────────────────────────────────
#[derive(Debug, Clone, PartialEq)]
pub enum SourceStatus { Waiting, Loading, Ok, Error }

pub struct SourceEntry {
    pub id:     &'static str,
    pub name:   &'static str,
    pub cat:    &'static str,
    pub status: SourceStatus,
}

// ─── App state ───────────────────────────────────────────────
pub struct AppState {
    pub events:   Vec<Event>,
    pub filter:   Filter,
    pub view:     View,
    pub user_lat: Option<f64>,
    pub user_lng: Option<f64>,
    pub map:      MapState,
    pub sources:  Vec<SourceEntry>,
    /// JS Worker handle — kept so we can terminate on reload.
    pub worker:   Option<web_sys::Worker>,
}

impl AppState {
    fn new() -> Self {
        Self {
            events:   Vec::new(),
            filter:   Filter::default(),
            view:     View::default(),
            user_lat: None,
            user_lng: None,
            map:      MapState::new(),
            sources:  build_sources(),
            worker:   None,
        }
    }

    /// Return events that pass the current filter, sorted by severity.
    pub fn filtered_sorted(&self) -> Vec<&Event> {
        let mut v: Vec<&Event> = self.events.iter()
            .filter(|e| self.filter.matches(e))
            .collect();
        v.sort_unstable_by_key(|e| e.severity_ord());
        v
    }

    pub fn sources_online(&self) -> usize {
        self.sources.iter().filter(|s| s.status == SourceStatus::Ok).count()
    }
}

// ─── Thread-local cell ───────────────────────────────────────
thread_local! {
    static STATE: RefCell<AppState> = RefCell::new(AppState::new());
}

pub fn with_state<F, R>(f: F) -> R
where F: FnOnce(&AppState) -> R {
    STATE.with(|s| f(&s.borrow()))
}

pub fn with_state_mut<F, R>(f: F) -> R
where F: FnOnce(&mut AppState) -> R {
    STATE.with(|s| f(&mut s.borrow_mut()))
}

// ─── Source catalogue ─────────────────────────────────────────
fn build_sources() -> Vec<SourceEntry> {
    macro_rules! src {
        ($id:literal, $name:literal, $cat:literal) => {
            SourceEntry { id: $id, name: $name, cat: $cat, status: SourceStatus::Waiting }
        };
    }
    vec![
        // Seismic
        src!("usgs",        "USGS Earthquakes",      "Sismos"),
        src!("emsc",        "EMSC Europa",            "Sismos"),
        src!("ingv",        "INGV Itália",            "Sismos"),
        src!("iris",        "IRIS FDSN",              "Sismos"),
        src!("geonet",      "GeoNet NZ",              "Sismos"),
        src!("afad",        "AFAD Turquia",           "Sismos"),
        src!("sgc",         "SGC Colômbia",           "Sismos"),
        // Multi-hazard
        src!("eonet",       "NASA EONET",             "Multi"),
        src!("gdacs",       "GDACS / UN",             "Multi"),
        src!("relief",      "ReliefWeb OCHA",         "Multi"),
        // Tropical
        src!("nhc",         "NOAA NHC",               "Furacões"),
        // Volcanoes
        src!("avo",         "AVO Alaska",             "Vulcões"),
        src!("usgsvol",     "USGS Volcano Hazards",   "Vulcões"),
        // Brazil
        src!("inpe",        "INPE BDQueimadas",       "Brasil"),
        src!("cemaden",     "CEMADEN",                "Brasil"),
        // Weather
        src!("openmeteo",   "Open-Meteo 200 cidades", "Temperatura"),
        // AI-powered
        src!("ai_vol_pacific",    "IA — Vulcões Pacífico",    "IA"),
        src!("ai_vol_americas",   "IA — Vulcões Américas",    "IA"),
        src!("ai_vol_indonesia",  "IA — Vulcões Indonésia",   "IA"),
        src!("ai_eq_asia",        "IA — Sismos Ásia",         "IA"),
        src!("ai_eq_americas",    "IA — Sismos Américas",     "IA"),
        src!("ai_eq_europe",      "IA — Sismos Europa",       "IA"),
        src!("ai_tc_active",      "IA — Ciclones Ativos",     "IA"),
        src!("ai_tc_atlantic",    "IA — TC Atlântico",        "IA"),
        src!("ai_flood_asia",     "IA — Enchentes Ásia",      "IA"),
        src!("ai_flood_africa",   "IA — Enchentes África",    "IA"),
        src!("ai_flood_americas", "IA — Enchentes Américas",  "IA"),
        src!("ai_heat_global",    "IA — Calor Global",        "IA"),
        src!("ai_cold_global",    "IA — Frio Global",         "IA"),
        src!("ai_wildfire",       "IA — Incêndios",           "IA"),
        src!("ai_brazil",         "IA — Brasil",              "IA"),
        src!("ai_tsunami",        "IA — Tsunamis",            "IA"),
        src!("ai_storm_eu",       "IA — Tempestades Europa",  "IA"),
        src!("ai_storm_us",       "IA — Tempestades EUA",     "IA"),
        src!("ai_south_america",  "IA — América do Sul",      "IA"),
        src!("ai_oceania",        "IA — Oceania",             "IA"),
    ]
}
