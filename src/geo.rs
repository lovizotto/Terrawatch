// ─── Geolocation & distance ──────────────────────────────────
use std::f64::consts::PI;
use wasm_bindgen::{closure::Closure, JsCast, JsValue};
use web_sys::{PositionError, PositionOptions};

use crate::state::with_state_mut;

/// Haversine great-circle distance in kilometres.
pub fn haversine_km(lat1: f64, lng1: f64, lat2: f64, lng2: f64) -> f64 {
    const R: f64 = 6_371.0;
    let d_lat = (lat2 - lat1) * PI / 180.0;
    let d_lng = (lng2 - lng1) * PI / 180.0;
    let a = (d_lat / 2.0).sin().powi(2)
        + (lat1 * PI / 180.0).cos() * (lat2 * PI / 180.0).cos() * (d_lng / 2.0).sin().powi(2);
    R * 2.0 * a.sqrt().atan2((1.0 - a).sqrt())
}

/// Ask the browser for the user's position.
/// On success, stores coords in AppState and runs proximity check.
pub fn request_geolocation() {
    let win = match web_sys::window() {
        Some(w) => w,
        None    => return,
    };
    let geo = match win.navigator().geolocation() {
        Ok(g)  => g,
        Err(_) => return,
    };

    let on_success = Closure::<dyn Fn(web_sys::Position)>::new(|pos: web_sys::Position| {
        let coords = pos.coords();
        with_state_mut(|s| {
            s.user_lat = Some(coords.latitude());
            s.user_lng = Some(coords.longitude());
        });
        crate::pipeline::check_proximity();
    });

    let on_error = Closure::<dyn Fn(PositionError)>::new(|_: PositionError| {
        // silently ignore — geolocation is optional
    });

    let mut opts = PositionOptions::new();
    opts.timeout(8_000);

    geo.get_current_position_with_error_callback_and_options(
        on_success.as_ref().unchecked_ref(),
        Some(on_error.as_ref().unchecked_ref()),
        &opts,
    )
    .ok();

    // Leak closures — they live for the page lifetime.
    on_success.forget();
    on_error.forget();
}
