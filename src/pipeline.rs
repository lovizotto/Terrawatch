// ─── Data pipeline ───────────────────────────────────────────
// Spawns the JS worker, receives incremental event batches,
// debounces renders, and manages proximity alerts.
use wasm_bindgen::{closure::Closure, JsCast, JsValue};
use web_sys::MessageEvent;

use crate::config::tip_config;
use crate::dom::{add_click, by_id, set_display, set_html, set_text, toggle_class};
use crate::geo::haversine_km;
use crate::render::{
    init_pipeline_bar, render_all, render_counters, render_sources,
    set_pipeline, show_content, update_clock,
};
use crate::state::{with_state, with_state_mut, SourceStatus};
use crate::types::Event;

// ─── Worker startup ──────────────────────────────────────────

pub fn start_worker() {
    // Terminate any previous worker
    with_state_mut(|s| {
        if let Some(w) = s.worker.take() {
            w.terminate();
        }
    });

    let base = base_url();
    let url  = format!("{}worker.js?v={}", base, js_sys::Date::now() as u64);

    let worker = match web_sys::Worker::new(&url) {
        Ok(w)  => w,
        Err(_) => { show_content(); return; }
    };

    // Attach message handler
    let on_msg = Closure::<dyn Fn(MessageEvent)>::new(handle_worker_message);
    worker.set_onmessage(Some(on_msg.as_ref().unchecked_ref()));
    on_msg.forget();

    // Start the pipeline
    let start = js_sys::Object::new();
    js_sys::Reflect::set(&start, &"type".into(), &"start".into()).ok();
    worker.post_message(&start).ok();

    with_state_mut(|s| s.worker = Some(worker));
}

// ─── Message handler ─────────────────────────────────────────

fn handle_worker_message(msg: MessageEvent) {
    let data = msg.data();
    let msg_type = js_sys::Reflect::get(&data, &"type".into())
        .ok()
        .and_then(|v| v.as_string())
        .unwrap_or_default();
    let payload = js_sys::Reflect::get(&data, &"data".into()).unwrap_or(JsValue::NULL);

    match msg_type.as_str() {
        "events" => {
            let raw: Vec<Event> = serde_wasm_bindgen::from_value(payload).unwrap_or_default();
            with_state_mut(|s| merge_events(&mut s.events, raw));
            show_content();
            render_all();
        }
        "phase" => {
            let id     = js_sys::Reflect::get(&payload, &"id".into())
                .ok().and_then(|v| v.as_string()).unwrap_or_default();
            let status = js_sys::Reflect::get(&payload, &"status".into())
                .ok().and_then(|v| v.as_string()).unwrap_or_default();

            set_pipeline(&id, &status);
            let src_status = match status.as_str() {
                "ok"      => SourceStatus::Ok,
                "loading" => SourceStatus::Loading,
                _         => SourceStatus::Waiting,
            };
            with_state_mut(|s| {
                if let Some(src) = s.sources.iter_mut().find(|s| s.id == id.as_str()) {
                    src.status = src_status;
                }
            });
            render_sources();
        }
        "status" if payload.as_string().as_deref() == Some("done") => {
            // Final flush
            show_content();
            render_all();

            // Stop spinner
            if let Some(ico) = by_id("rico") {
                ico.style().set_property("animation", "none").ok();
            }
            set_text("llbl", "Ao vivo");

            let total = with_state(|s| s.events.len());
            set_text("pbtot", &format!("{total} alertas"));

            check_proximity();

            // Auto-hide progress bar after 4s
            let win = web_sys::window().unwrap();
            let cb = Closure::once_into_js(|| {
                if let Some(bar) = by_id("pbar") {
                    bar.class_list().remove_1("open").ok();
                }
            });
            win.set_timeout_with_callback_and_timeout_and_arguments_0(
                cb.unchecked_ref(), 4_000,
            ).ok();
        }
        _ => {}
    }
}

// ─── Event merging (dedup by id) ─────────────────────────────

fn merge_events(existing: &mut Vec<Event>, incoming: Vec<Event>) {
    for ev in incoming {
        if ev.id.is_empty() { continue; }
        if !existing.iter().any(|e| e.id == ev.id) {
            existing.push(ev);
        }
    }
}

// ─── Proximity alert ─────────────────────────────────────────

pub fn check_proximity() {
    let closest = with_state(|s| -> Option<(Event, u32)> {
        let (ulat, ulng) = (s.user_lat?, s.user_lng?);
        s.events.iter()
            .filter(|e| e.has_coords())
            .map(|e| {
                let d = haversine_km(ulat, ulng, e.lat, e.lng).round() as u32;
                (e.clone(), d)
            })
            .filter(|(_, d)| *d < 1_200)
            .min_by_key(|(_, d)| *d)
    });

    let Some((ev, dist)) = closest else {
        hide_proximity();
        return;
    };

    let tip = tip_config(&ev.kind);
    let zone = if dist < 250 { "RISCO IMEDIATO" }
               else if dist < 600 { "ZONA DE ATENÇÃO" }
               else { "EM MONITORAMENTO" };

    let tips_html: String = tip.tips.iter()
        .map(|t| format!(r#"<span class="pi-tip">✓ {t}</span>"#))
        .collect();

    let ev_id_for_detail = ev.id.clone();
    let html = format!(
        r#"<div class="pi" style="--pc:{bg}">
             <div class="pi-top">
               <div class="pi-ico">{emoji}</div>
               <div style="flex:1">
                 <div class="pi-h" style="color:{c}">⚠ {zone} — {dist}km</div>
                 <div class="pi-s">{lbl} · {name}</div>
               </div>
               <div class="pi-x" id="pa-close">✕</div>
             </div>
             <div class="pi-tips">{tips_html}</div>
             <div class="pi-acts">
               <button class="pibp p" id="pa-detail" style="--pa:{accent};--pg:{glow}">Ver detalhes</button>
               <button class="pibp s" id="pa-dismiss">Dispensar</button>
             </div>
           </div>"#,
        bg     = tip.bg,
        emoji  = tip.emoji,
        c      = tip.color,
        lbl    = crate::config::type_config(&ev.kind).label,
        name   = ev.name,
        accent = tip.accent,
        glow   = tip.glow,
    );

    set_html("palert", &html);
    if let Some(el) = by_id("palert") {
        el.class_list().add_1("open").ok();
    }

    // Wire buttons
    add_click("pa-close",   hide_proximity);
    add_click("pa-dismiss", hide_proximity);
    add_click("pa-detail",  move || {
        if let Some(ev) = with_state(|s| s.events.iter().find(|e| e.id == ev_id_for_detail).cloned()) {
            crate::render::open_modal(&ev);
        }
    });
}

pub fn hide_proximity() {
    if let Some(el) = by_id("palert") {
        el.class_list().remove_1("open").ok();
    }
}

// ─── Load all ────────────────────────────────────────────────

pub fn load_all() {
    // Reset events + source statuses
    with_state_mut(|s| {
        s.events.clear();
        for src in s.sources.iter_mut() {
            src.status = SourceStatus::Waiting;
        }
    });

    // Inject static events as baseline
    let static_json = include_str!("../assets/static_events.json");
    if let Ok(static_evs) = serde_json::from_str::<Vec<Event>>(static_json) {
        with_state_mut(|s| merge_events(&mut s.events, static_evs));
    }

    show_content();
    render_all();
    render_sources();
    init_pipeline_bar();

    // Spinner
    if let Some(ico) = by_id("rico") {
        ico.style().set_property("animation", "spin .7s linear infinite").ok();
    }
    set_text("llbl", "Carregando");

    start_worker();
}

// ─── Helpers ─────────────────────────────────────────────────

fn base_url() -> String {
    web_sys::window()
        .and_then(|w| w.location().pathname().ok())
        .map(|p| {
            // pathname ends with "/Terrawatch/" or "/Terrawatch/index.html"
            // strip the filename if any
            if let Some(pos) = p.rfind('/') {
                p[..=pos].to_string()
            } else {
                "/".to_string()
            }
        })
        .unwrap_or_else(|| "/".to_string())
}
