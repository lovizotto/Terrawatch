// ─── DOM helpers ─────────────────────────────────────────────
// Thin wrappers so the rest of the codebase never deals with
// Option/Result chaining from web-sys directly.
use wasm_bindgen::JsCast;
use web_sys::{Document, Element, HtmlElement};

fn doc() -> Document {
    web_sys::window().unwrap().document().unwrap()
}

/// Query a single element by id.  Returns None if not found.
pub fn by_id(id: &str) -> Option<HtmlElement> {
    doc().get_element_by_id(id)?.dyn_into::<HtmlElement>().ok()
}

/// Set `element.textContent`.
pub fn set_text(id: &str, text: &str) {
    if let Some(el) = by_id(id) {
        el.set_text_content(Some(text));
    }
}

/// Set `element.innerHTML`.
pub fn set_html(id: &str, html: &str) {
    if let Some(el) = by_id(id) {
        el.set_inner_html(html);
    }
}

/// Set a CSS inline property via `element.style.setProperty`.
pub fn set_style(id: &str, prop: &str, value: &str) {
    if let Some(el) = by_id(id) {
        el.style().set_property(prop, value).ok();
    }
}

/// Set `element.style.display`.
pub fn set_display(id: &str, display: &str) {
    set_style(id, "display", display);
}

/// Toggle a class on an element (add when `on`, remove otherwise).
pub fn toggle_class(id: &str, class: &str, on: bool) {
    if let Some(el) = by_id(id) {
        let list = el.class_list();
        if on { list.add_1(class).ok(); }
        else  { list.remove_1(class).ok(); }
    }
}

/// `querySelectorAll` on the document.
pub fn query_all(selector: &str) -> Vec<Element> {
    doc()
        .query_selector_all(selector)
        .map(|nl| {
            (0..nl.length())
                .filter_map(|i| nl.item(i))
                .collect()
        })
        .unwrap_or_default()
}

/// Scroll `id` element to the top.
pub fn scroll_top(id: &str) {
    if let Some(el) = by_id(id) {
        el.set_scroll_top(0);
    }
}

/// Set an attribute on an element.
pub fn set_attr(id: &str, attr: &str, value: &str) {
    if let Some(el) = by_id(id) {
        el.set_attribute(attr, value).ok();
    }
}

/// Add a one-shot click listener to an element by id.
/// The closure is leaked so it lives for the page lifetime.
pub fn add_click<F>(id: &str, f: F)
where
    F: Fn() + 'static,
{
    use wasm_bindgen::closure::Closure;
    if let Some(el) = by_id(id) {
        let cb = Closure::<dyn Fn()>::new(f);
        el.add_event_listener_with_callback("click", cb.as_ref().unchecked_ref())
            .ok();
        cb.forget();
    }
}

/// Add a click listener to an element (by reference).
/// The closure is leaked.
pub fn add_click_el<F>(el: &HtmlElement, f: F)
where
    F: Fn() + 'static,
{
    use wasm_bindgen::closure::Closure;
    let cb = Closure::<dyn Fn()>::new(f);
    el.add_event_listener_with_callback("click", cb.as_ref().unchecked_ref())
        .ok();
    cb.forget();
}
