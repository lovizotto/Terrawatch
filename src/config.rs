// ─── Static configuration ────────────────────────────────────
// Single source of truth for colours, labels, and tips.
// All &'static str so no heap allocation is needed at runtime.
use crate::types::{SevConfig, TipConfig, TypeConfig};

// ─── Disaster type config ────────────────────────────────────

pub fn type_config(kind: &str) -> TypeConfig {
    match kind {
        "volcano" => TypeConfig {
            color: "#FF4500",
            glow:  "rgba(255,69,0,.3)",
            ct:    "rgba(255,50,0,.05)",
            label: "Vulcão",
        },
        "hurricane" => TypeConfig {
            color: "#00A0FF",
            glow:  "rgba(0,160,255,.25)",
            ct:    "rgba(0,120,255,.04)",
            label: "Furacão",
        },
        "cyclone" => TypeConfig {
            color: "#00D2A0",
            glow:  "rgba(0,210,160,.25)",
            ct:    "rgba(0,200,150,.04)",
            label: "Ciclone",
        },
        "storm" => TypeConfig {
            color: "#8C64FF",
            glow:  "rgba(140,100,255,.25)",
            ct:    "rgba(120,80,255,.04)",
            label: "Tempestade",
        },
        "flood" => TypeConfig {
            color: "#0064FF",
            glow:  "rgba(0,100,255,.25)",
            ct:    "rgba(0,80,255,.04)",
            label: "Enchente",
        },
        "tsunami" => TypeConfig {
            color: "#00B4E6",
            glow:  "rgba(0,180,230,.25)",
            ct:    "rgba(0,160,220,.04)",
            label: "Tsunami",
        },
        "heat" => TypeConfig {
            color: "#FF6B35",
            glow:  "rgba(255,107,53,.25)",
            ct:    "rgba(255,90,20,.05)",
            label: "Calor Extremo",
        },
        "cold" => TypeConfig {
            color: "#A8D8EA",
            glow:  "rgba(168,216,234,.22)",
            ct:    "rgba(160,220,240,.04)",
            label: "Frio Extremo",
        },
        _ => TypeConfig { // earthquake (default)
            color: "#FFA032",
            glow:  "rgba(255,160,50,.25)",
            ct:    "rgba(255,120,0,.04)",
            label: "Sismo",
        },
    }
}

// ─── Severity config ─────────────────────────────────────────

pub fn sev_config(severity: &str) -> SevConfig {
    match severity {
        "critical" => SevConfig {
            label:  "CRÍTICO",
            color:  "#FF453A",
            bg:     "rgba(255,69,58,.12)",
            border: "rgba(255,69,58,.22)",
        },
        "high" => SevConfig {
            label:  "ALTO",
            color:  "#FF9F0A",
            bg:     "rgba(255,159,10,.10)",
            border: "rgba(255,159,10,.18)",
        },
        "medium" => SevConfig {
            label:  "MÉDIO",
            color:  "#FFD60A",
            bg:     "rgba(255,214,10,.08)",
            border: "rgba(255,214,10,.14)",
        },
        _ => SevConfig { // low
            label:  "BAIXO",
            color:  "#30D158",
            bg:     "rgba(48,209,88,.07)",
            border: "rgba(48,209,88,.14)",
        },
    }
}

// ─── Proximity tips ──────────────────────────────────────────

pub fn tip_config(kind: &str) -> TipConfig {
    match kind {
        "volcano" => TipConfig {
            emoji:  "🏃",
            color:  "#FF4500",
            bg:     "rgba(255,69,0,.35)",
            accent: "#FF4500",
            glow:   "rgba(255,69,0,.28)",
            tips:   &["Evacue agora", "Máscara N95", "Feche aberturas", "Sem lentes"],
            prep:   "Cinzas vulcânicas são tóxicas. Se houver ordem de evacuação, saia imediatamente.",
        },
        "hurricane" => TipConfig {
            emoji:  "🏡",
            color:  "#00A0FF",
            bg:     "rgba(0,160,255,.3)",
            accent: "#00A0FF",
            glow:   "rgba(0,160,255,.22)",
            tips:   &["Reforce janelas", "Estoque água 3d", "Abrigo próximo", "Carregue bateria"],
            prep:   "O olho do furacão parece calmo — não saia. A segunda banda pode ser mais forte.",
        },
        "cyclone" => TipConfig {
            emoji:  "🏠",
            color:  "#00D2A0",
            bg:     "rgba(0,210,160,.3)",
            accent: "#00D2A0",
            glow:   "rgba(0,210,160,.22)",
            tips:   &["Interior da casa", "Evite costa", "Estoque comida", "Desligue elétrica"],
            prep:   "O centro do ciclone pode parecer calmo. Aguarde comunicado oficial.",
        },
        "storm" => TipConfig {
            emoji:  "⛈️",
            color:  "#8C64FF",
            bg:     "rgba(140,100,255,.3)",
            accent: "#8C64FF",
            glow:   "rgba(140,100,255,.22)",
            tips:   &["Evite locais abertos", "Desconecte eletrônicos", "Garagem veículos", "Longe de árvores"],
            prep:   "Raios atingem até 16km. Se o cabelo arrepiar ao ar livre, agache-se.",
        },
        "flood" => TipConfig {
            emoji:  "🚗",
            color:  "#0064FF",
            bg:     "rgba(0,100,255,.3)",
            accent: "#0064FF",
            glow:   "rgba(0,100,255,.22)",
            tips:   &["Terrenos altos", "Não atravesse água", "Desligue elétrica", "Evite porões"],
            prep:   "30cm de água em movimento derruba um adulto. Nunca atravesse áreas alagadas.",
        },
        "tsunami" => TipConfig {
            emoji:  "🏃",
            color:  "#00B4E6",
            bg:     "rgba(0,180,230,.3)",
            accent: "#00B4E6",
            glow:   "rgba(0,180,230,.22)",
            tips:   &["Suba imediatamente", "3km da costa", "Ouça sirenes", "Aguarde all-clear"],
            prep:   "Se o mar recuar subitamente, suba. Tsunamis têm ondas múltiplas por horas.",
        },
        "heat" => TipConfig {
            emoji:  "🌡️",
            color:  "#FF6B35",
            bg:     "rgba(255,107,53,.3)",
            accent: "#FF6B35",
            glow:   "rgba(255,107,53,.22)",
            tips:   &["Local fresco", "Hidrate bastante", "Evite exercício", "Cheque idosos"],
            prep:   "Calor extremo mata silenciosamente. Alerta: confusão mental, pele seca sem suor.",
        },
        "cold" => TipConfig {
            emoji:  "🧥",
            color:  "#A8D8EA",
            bg:     "rgba(168,216,234,.28)",
            accent: "#A8D8EA",
            glow:   "rgba(168,216,234,.18)",
            tips:   &["Roupas em camadas", "Evite exposição", "Aquecedores seguros", "Cheque hipotermia"],
            prep:   "Hipotermia começa acima de 0°C com vento e umidade. Cubra extremidades.",
        },
        _ => TipConfig { // earthquake
            emoji:  "🏠",
            color:  "#FFA032",
            bg:     "rgba(255,130,0,.3)",
            accent: "#FFA032",
            glow:   "rgba(255,130,0,.22)",
            tips:   &["Longe de janelas", "Abrigue sob mesa", "Desligue gás", "Kit emergência"],
            prep:   "Fique sob mesas sólidas. Após o tremor, aguarde réplicas. Use escadas.",
        },
    }
}

/// All known disaster kinds (used for counter updates).
pub const ALL_KINDS: &[&str] = &[
    "earthquake", "volcano", "hurricane", "cyclone",
    "storm", "flood", "tsunami", "heat", "cold",
];
