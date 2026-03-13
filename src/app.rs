// ─── App bootstrap & event wiring ────────────────────────────
use wasm_bindgen::{closure::Closure, JsCast};
use web_sys::MouseEvent;

use crate::dom::{add_click, by_id, query_all, set_display, toggle_class};
use crate::pipeline::{load_all, hide_proximity};
use crate::render::{close_modal, render_cards, render_map, render_sources, update_clock};
use crate::state::{with_state, with_state_mut};
use crate::types::{Filter, View};

// ─── Filter ──────────────────────────────────────────────────

pub fn set_filter(kind: &str) {
    let new_filter = if kind == "all" {
        Filter::All
    } else {
        Filter::Kind(kind.to_string())
    };

    with_state_mut(|s| s.filter = new_filter);

    // Update chip active state
    for chip in query_all(".fc[data-t]") {
        let t = chip.get_attribute("data-t").unwrap_or_default();
        let html_el = chip.dyn_into::<web_sys::HtmlElement>().unwrap();
        let is_active = t == kind;
        if is_active {
            html_el.class_list().add_1("on").ok();
        } else {
            html_el.class_list().remove_1("on").ok();
        }
    }

    // Re-render the active view
    with_state(|s| match s.view {
        View::Cards => render_cards(),
        View::Map   => render_map(),
    });
}

// ─── View switch ─────────────────────────────────────────────

pub fn switch_view(view: &str) {
    let new_view = if view == "map" { View::Map } else { View::Cards };
    with_state_mut(|s| s.view = new_view);

    let is_map = view == "map";

    toggle_class("vs-c",  "on", !is_map);
    toggle_class("vs-m",  "on",  is_map);
    toggle_class("mn-c",  "on", !is_map);
    toggle_class("mn-m",  "on",  is_map);

    set_display("cv", if is_map { "none" } else { "block" });
    set_display("mv", if is_map { "block" } else { "none" });

    if is_map { render_map(); } else { render_cards(); }
}

// ─── Sources panel ───────────────────────────────────────────

fn toggle_sources() {
    if let Some(panel) = by_id("srcpanel") {
        let is_open = panel.class_list().contains("open");
        if is_open {
            panel.class_list().remove_1("open").ok();
        } else {
            panel.class_list().add_1("open").ok();
            render_sources();
        }
    }
}

// ─── Clock ───────────────────────────────────────────────────

fn start_clock() {
    let win = web_sys::window().unwrap();
    let cb = Closure::<dyn Fn()>::new(|| update_clock());
    win.set_interval_with_callback_and_timeout_and_arguments_0(
        cb.as_ref().unchecked_ref(), 1_000,
    ).ok();
    cb.forget();
    update_clock(); // run immediately
}

// ─── Auto-refresh (10 min) ───────────────────────────────────

fn schedule_refresh() {
    let win = web_sys::window().unwrap();
    let cb = Closure::<dyn Fn()>::new(|| {
        load_all();
        schedule_refresh();
    });
    win.set_timeout_with_callback_and_timeout_and_arguments_0(
        cb.as_ref().unchecked_ref(), 600_000,
    ).ok();
    cb.forget();
}

// ─── Service Worker ──────────────────────────────────────────

fn register_sw() {
    let win = web_sys::window().unwrap();
    let nav = win.navigator();
    if let Ok(sw) = nav.service_worker() {
        let base = win.location().pathname().unwrap_or_default();
        let scope = if let Some(pos) = base.rfind('/') { &base[..=pos] } else { "/" };
        let sw_url = format!("{scope}sw.js");
        sw.register(&sw_url);
    }
}

// ─── Main entry ──────────────────────────────────────────────

pub fn init() {
    console_error_panic_hook::set_once();

    // ── Filter chips ──────────────────────────────────────────
    for chip in query_all(".fc[data-t]") {
        let html_el = chip.clone().dyn_into::<web_sys::HtmlElement>().unwrap();
        let kind    = chip.get_attribute("data-t").unwrap_or_default();
        crate::dom::add_click_el(&html_el, move || set_filter(&kind));
    }

    // ── View switchers (toolbar + bottom nav) ─────────────────
    for btn in query_all("[data-v]") {
        let html_el = btn.clone().dyn_into::<web_sys::HtmlElement>().unwrap();
        let v       = btn.get_attribute("data-v").unwrap_or_default();
        crate::dom::add_click_el(&html_el, move || switch_view(&v));
    }

    // ── Refresh button ────────────────────────────────────────
    add_click("rbtn", || load_all());

    // ── Sources panel ─────────────────────────────────────────
    add_click("srctgl",    toggle_sources);
    add_click("srcclose",  toggle_sources);

    // ── Modal close ───────────────────────────────────────────
    add_click("mcl", close_modal);

    // Modal backdrop click
    if let Some(bg) = by_id("mbg") {
        let cb = Closure::<dyn Fn(MouseEvent)>::new(|e: MouseEvent| {
            // Close only if the click was directly on the backdrop
            let target = e.target().and_then(|t| t.dyn_into::<web_sys::Element>().ok());
            if let Some(t) = target {
                if t.id() == "mbg" { close_modal(); }
            }
        });
        bg.add_event_listener_with_callback("click", cb.as_ref().unchecked_ref()).ok();
        cb.forget();
    }

    // ── Geolocation ───────────────────────────────────────────
    crate::geo::request_geolocation();

    // ── Clock ─────────────────────────────────────────────────
    start_clock();

    // ── Service worker ────────────────────────────────────────
    register_sw();

    // ── Initial data load ─────────────────────────────────────
    load_all();
    schedule_refresh();
}
