// ─── Render layer ────────────────────────────────────────────
// Pure functions that turn AppState into DOM mutations.
// No state is written here — only read.
use wasm_bindgen::closure::Closure;
use wasm_bindgen::JsCast;

use crate::config::{sev_config, tip_config, type_config, ALL_KINDS};
use crate::dom::{
    add_click_el, by_id, query_all, scroll_top,
    set_attr, set_display, set_html, set_style, set_text, toggle_class,
};
use crate::geo::haversine_km;
use crate::icons::icon_for;
use crate::leaflet;
use crate::state::{with_state, with_state_mut, SourceStatus};
use crate::types::{Event, Filter, View};

// ─── Top-level render ────────────────────────────────────────

/// Called after any state mutation that should repaint the UI.
pub fn render_all() {
    render_counters();
    with_state(|s| match s.view {
        View::Cards => render_cards_inner(&s.filtered_sorted()),
        View::Map   => render_map_inner(),
    });
}

// ─── Counters ────────────────────────────────────────────────

pub fn render_counters() {
    with_state(|s| {
        set_text("hs-c", &s.events.iter().filter(|e| e.severity == "critical").count().to_string());
        set_text("hs-t", &s.events.len().to_string());
        set_text("hs-sr", &s.sources_online().to_string());

        for k in ALL_KINDS {
            let cnt = s.events.iter().filter(|e| e.kind.as_str() == *k).count();
            set_text(&format!("fc-{k}"), &cnt.to_string());
        }
        let total = if s.filter == Filter::All { s.events.len() }
                    else { s.filtered_sorted().len() };
        set_text("fc-all", &s.events.len().to_string());

        let shlbl = match &s.filter {
            Filter::All      => format!("TODOS OS ALERTAS — {}", s.events.len()),
            Filter::Kind(k)  => {
                let cfg = type_config(k);
                format!("{} — {}", cfg.label.to_uppercase(), total)
            }
        };
        set_text("shlbl", &shlbl);
    });
}

// ─── Cards ───────────────────────────────────────────────────

pub fn render_cards() {
    render_counters();
    with_state(|s| render_cards_inner(&s.filtered_sorted()));
}

fn render_cards_inner(events: &[&Event]) {
    let Some(grid) = by_id("cgrid") else { return };

    if events.is_empty() {
        grid.set_inner_html(
            r#"<div style="text-align:center;padding:50px;color:rgba(255,255,255,.16);font-size:12px">
                 Nenhum evento encontrado.
               </div>"#,
        );
        return;
    }

    let (user_lat, user_lng) = with_state(|s| (s.user_lat, s.user_lng));
    let mut html = String::with_capacity(events.len() * 512);

    for ev in events {
        let cfg = type_config(&ev.kind);
        let sev = sev_config(&ev.severity);
        let dist_html = match (user_lat, user_lng) {
            (Some(ulat), Some(ulng)) if ev.has_coords() => {
                let d = haversine_km(ulat, ulng, ev.lat, ev.lng).round() as u32;
                if d < 1_200 {
                    format!(r#"<div class="nbg">📍 {d}km</div>"#)
                } else {
                    String::new()
                }
            }
            _ => String::new(),
        };
        let link_html = if ev.source_url.is_empty() {
            String::new()
        } else {
            format!(
                r#"<a class="clnk" href="{}" target="_blank" rel="noopener"
                      onclick="event.stopPropagation()">↗ Fonte</a>"#,
                ev.source_url
            )
        };
        let is_crit = if ev.severity == "critical" { " is-critical" } else { "" };

        html.push_str(&format!(
            r#"<div class="ec{is_crit}" data-ev-id="{id}"
                    style="--ct:{ct};--ca:{ca};border-left-color:{ca}">
                 <div style="display:flex;flex:1">
                   <div class="ec-panel">
                     <div class="ec-icon">{icon}</div>
                     <div class="ec-ptype" style="color:{ca}">{label}</div>
                   </div>
                   <div class="ec-body">
                     <div class="ec-top">
                       <div class="ec-name">{name}</div>
                       <div class="ec-sev" style="background:{sb};color:{sc};border-color:{sbr}">
                         <div class="ec-sev-dot" style="background:{sc}"></div>{slbl}
                       </div>
                     </div>
                     <div class="ec-loc"><span class="ec-loc-pin">📍</span>
                       <span class="ec-loc-txt">{loc}</span></div>
                     <div class="ec-desc">{desc}</div>
                     <div class="ec-foot">
                       <div class="ec-src">{src}</div>
                       <div class="ec-fr">{dist_html}{link_html}
                         <div class="ec-tm">{time}</div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>"#,
            id   = ev.id,
            ct   = cfg.ct,
            ca   = cfg.color,
            icon = icon_for(&ev.kind),
            label = cfg.label,
            name = ev.name,
            sb   = sev.bg,
            sc   = sev.color,
            sbr  = sev.border,
            slbl = sev.label,
            loc  = ev.location,
            desc = ev.description,
            src  = ev.source,
            time = ev.time,
        ));
    }

    grid.set_inner_html(&html);

    // Attach click listeners for each card → open modal
    for el in query_all(".ec[data-ev-id]") {
        let html_el = el.clone().dyn_into::<web_sys::HtmlElement>().unwrap();
        let ev_id = el.get_attribute("data-ev-id").unwrap_or_default();
        add_click_el(&html_el, move || {
            if let Some(ev) = with_state(|s| s.events.iter().find(|e| e.id == ev_id).cloned()) {
                open_modal(&ev);
            }
        });
    }

    scroll_top("cv");
}

// ─── Map ─────────────────────────────────────────────────────

pub fn render_map() {
    render_map_inner();
}

fn render_map_inner() {
    let has_map = with_state(|s| s.map.map.is_some());

    if !has_map {
        let m = leaflet::map_create("leafmap", 20.0, 10.0, 2);
        leaflet::map_add_tiles(&m);
        with_state_mut(|s| s.map.map = Some(m));
    }

    // Collect what we need before borrowing state mutably
    let (map_val, events_snap) = with_state(|s| {
        let map = s.map.map.clone().unwrap();
        let evts: Vec<Event> = s.filtered_sorted()
            .iter()
            .map(|e| (*e).clone())
            .collect();
        (map, evts)
    });

    // Remove old markers
    with_state_mut(|s| s.map.clear(&map_val));

    for ev in &events_snap {
        if !ev.has_coords() { continue; }
        let cfg  = type_config(&ev.kind);
        let size = match ev.severity.as_str() {
            "critical" => 14.0,
            "high"     => 11.0,
            "medium"   =>  9.0,
            _          =>  7.0,
        };
        let glow_alpha = match ev.severity.as_str() {
            "critical" => "bb",
            "high"     => "88",
            _          => "55",
        };
        let z = match ev.severity.as_str() {
            "critical" => 1000,
            "high"     =>  500,
            _          =>    0,
        };
        let ev_clone = ev.clone();
        let cb = Closure::<dyn Fn()>::new(move || open_modal(&ev_clone));

        let marker = leaflet::marker_add(
            &map_val, ev.lat, ev.lng,
            cfg.color, size, glow_alpha, z, &cb,
        );

        with_state_mut(|s| {
            s.map.markers.push(marker);
            s.map.click_closures.push(cb);
        });
    }

    // Legend
    let kinds: Vec<String> = {
        let mut seen = std::collections::HashSet::new();
        events_snap.iter()
            .filter(|e| seen.insert(e.kind.clone()))
            .map(|e| e.kind.clone())
            .collect()
    };
    let legend_html: String = kinds.iter().map(|k| {
        let tc  = type_config(k);
        let cnt = events_snap.iter().filter(|e| &e.kind == k).count();
        format!(
            r#"<div class="lr3 on" data-filter="{k}">
                 <div class="lrd" style="background:{c};box-shadow:0 0 5px {c}88"></div>
                 <div class="lrl">{lbl} <span style="opacity:.4">{cnt}</span></div>
               </div>"#,
            c = tc.color, lbl = tc.label
        )
    }).collect();
    set_html("legi", &legend_html);

    // Legend click → filter
    for el in query_all(".lr3[data-filter]") {
        let html_el = el.clone().dyn_into::<web_sys::HtmlElement>().unwrap();
        let kind    = el.get_attribute("data-filter").unwrap_or_default();
        add_click_el(&html_el, move || {
            crate::app::set_filter(&kind);
        });
    }

    with_state(|s| {
        if let Some(m) = &s.map.map {
            leaflet::map_invalidate(m);
        }
    });
}

// ─── Modal ───────────────────────────────────────────────────

pub fn open_modal(ev: &Event) {
    let cfg = type_config(&ev.kind);
    let sev = sev_config(&ev.severity);

    set_html("miw", icon_for(&ev.kind));
    set_style("mglow", "background", cfg.glow);

    set_text("mtype", &cfg.label.to_uppercase());
    set_style("mtype", "color", cfg.color);
    set_text("mname", &ev.name);
    set_text("mfloc", &ev.location);
    set_text("mftm",  &ev.time);
    set_text(
        "mfmag",
        &ev.mag.map(|m| format!("M{:.1}", m))
            .unwrap_or_else(|| ev.severity.to_uppercase()),
    );
    set_text("mfdep", ev.depth.as_deref().unwrap_or("–"));
    set_text("mfdesc", &ev.description);

    if ev.source_url.is_empty() {
        set_display("mlink", "none");
    } else {
        set_attr("mlink", "href", &ev.source_url);
        set_display("mlink", "flex");
    }

    if let Some(mal) = by_id("malt") {
        mal.style().set_property("background",    sev.bg).ok();
        mal.style().set_property("border-color",  sev.border).ok();
        mal.style().set_property("padding",       "10px 14px").ok();
        mal.style().set_property("display",       "flex").ok();
        mal.style().set_property("align-items",   "center").ok();
        mal.style().set_property("gap",           "8px").ok();
        mal.style().set_property("border",        ".5px solid").ok();
        mal.style().set_property("border-radius", "0").ok();
    }
    set_style("mad", "background", sev.color);
    set_text("mal", &format!("Nível: {}", sev.label));
    set_style("mal", "color", sev.color);

    // Proximity note
    let prox = with_state(|s| -> Option<String> {
        let (ulat, ulng) = (s.user_lat?, s.user_lng?);
        if !ev.has_coords() { return None; }
        let d = haversine_km(ulat, ulng, ev.lat, ev.lng).round() as u32;
        if d >= 1_200 { return None; }
        let tip = tip_config(&ev.kind);
        Some(format!("Você está a ~{d}km. {}", tip.prep))
    });
    if let Some(txt) = prox {
        set_text("mntx", &txt);
        set_display("mnw", "block");
    } else {
        set_display("mnw", "none");
    }

    // Show
    if let Some(bg) = by_id("mbg") {
        bg.class_list().add_1("o").ok();
    }
}

pub fn close_modal() {
    if let Some(bg) = by_id("mbg") {
        bg.class_list().remove_1("o").ok();
    }
}

// ─── Sources panel ───────────────────────────────────────────

pub fn render_sources() {
    let html = with_state(|s| {
        s.sources.iter().map(|src| {
            let (cls, lbl, color) = match src.status {
                SourceStatus::Ok      => ("ok",  "✓ Online",     "#30D158"),
                SourceStatus::Error   => ("er",  "✗ Falhou",     "#FF453A"),
                SourceStatus::Loading => ("",    "⟳ Buscando",  "rgba(255,255,255,.4)"),
                SourceStatus::Waiting => ("",    "· Aguardando", "rgba(255,255,255,.22)"),
            };
            format!(
                r#"<div class="spsrc {cls}">
                     <div class="spn">{n}</div>
                     <div class="sps" style="color:{color}">{lbl} · {cat}</div>
                   </div>"#,
                n   = src.name,
                cat = src.cat,
            )
        }).collect::<String>()
    });
    set_html("srcgrid", &html);

    let online = with_state(|s| s.sources_online());
    let total  = with_state(|s| s.sources.len());
    set_text("hs-sr", &online.to_string());
    if let Some(btn) = by_id("srctgl") {
        btn.set_text_content(Some(&format!("⊙ {online}/{total} Fontes")));
    }
}

// ─── Loading / show-content ──────────────────────────────────

pub fn show_loading() {
    set_display("lw", "block");
    set_display("cc", "none");
}

pub fn show_content() {
    set_display("lw", "none");
    set_display("cc", "block");
}

// ─── Pipeline progress bar ───────────────────────────────────

const PIPES: &[(&str, &str)] = &[
    ("seismic",    "Sismos"),
    ("nasa",       "NASA"),
    ("noaa",       "NOAA"),
    ("meteo",      "Clima"),
    ("volcoes",    "Vulcões"),
    ("tempestades","Tempestades"),
    ("calorfrio",  "Calor/Frio"),
    ("enchentes",  "Enchentes"),
    ("extra",      "Regional"),
];

pub fn init_pipeline_bar() {
    let html: String = PIPES.iter().map(|(id, lbl)| {
        format!(r#"<div class="pbs w" id="pp-{id}"><div class="pbd"></div>{lbl}</div>"#)
    }).collect();
    set_html("pbst", &html);
    if let Some(bar) = by_id("pbar") {
        bar.class_list().add_1("open").ok();
    }
}

pub fn set_pipeline(id: &str, status: &str) {
    let el_id = format!("pp-{id}");
    if let Some(el) = by_id(&el_id) {
        el.set_attribute("class", &format!("pbs {status}")).ok();
    }
}

// ─── Clock ───────────────────────────────────────────────────

pub fn update_clock() {
    let time_str = {
        let date = js_sys::Date::new_0();
        let h = date.get_hours();
        let m = date.get_minutes();
        format!("{:02}:{:02}", h, m)
    };
    set_text("hs-clk", &time_str);
}
