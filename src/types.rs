// ─── Domain types ────────────────────────────────────────────
use serde::{Deserialize, Serialize};

/// A natural-disaster event as received from the JS worker or static data.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Event {
    pub id:          String,
    #[serde(rename = "type")]
    pub kind:        String,           // "earthquake" | "volcano" | …
    pub name:        String,
    pub location:    String,
    #[serde(default)]
    pub lat:         f64,
    #[serde(default)]
    pub lng:         f64,
    pub severity:    String,           // "critical" | "high" | "medium" | "low"
    pub source:      String,
    #[serde(default)]
    pub time:        String,
    pub description: String,
    #[serde(rename = "sourceUrl", default)]
    pub source_url:  String,
    #[serde(default)]
    pub mag:         Option<f64>,
    #[serde(default)]
    pub depth:       Option<String>,
}

impl Event {
    /// Severity as a sortable integer (lower = more severe).
    pub fn severity_ord(&self) -> u8 {
        match self.severity.as_str() {
            "critical" => 0,
            "high"     => 1,
            "medium"   => 2,
            _          => 3,
        }
    }

    pub fn has_coords(&self) -> bool {
        self.lat != 0.0 || self.lng != 0.0
    }
}

// ─── Type configuration ──────────────────────────────────────

pub struct TypeConfig {
    pub color:   &'static str,   // primary accent hex
    pub glow:    &'static str,   // rgba glow for modal header
    pub ct:      &'static str,   // card tint
    pub label:   &'static str,   // display label (PT)
}

/// Per-severity badge colours.
pub struct SevConfig {
    pub label:   &'static str,
    pub color:   &'static str,
    pub bg:      &'static str,
    pub border:  &'static str,
}

/// Proximity alert tips.
pub struct TipConfig {
    pub emoji:   &'static str,
    pub color:   &'static str,
    pub bg:      &'static str,
    pub accent:  &'static str,
    pub glow:    &'static str,
    pub tips:    &'static [&'static str],
    pub prep:    &'static str,
}

// ─── Current view / filter ───────────────────────────────────

#[derive(Debug, Clone, PartialEq, Default)]
pub enum View { #[default] Cards, Map }

#[derive(Debug, Clone, PartialEq, Default)]
pub enum Filter {
    #[default] All,
    Kind(String),   // e.g. "earthquake"
}

impl Filter {
    pub fn matches(&self, event: &Event) -> bool {
        match self {
            Filter::All         => true,
            Filter::Kind(k)     => &event.kind == k,
        }
    }
    pub fn as_str(&self) -> &str {
        match self {
            Filter::All      => "all",
            Filter::Kind(k)  => k.as_str(),
        }
    }
}
