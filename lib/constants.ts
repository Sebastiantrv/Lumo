export const COLORS = {
  verde: "#4A5E3A",
  rojo: "#7A2030",
  tropical: "#B8860B",
  text: "#F5F0E8",
  textSecondary: "#8A8A8A",
  bg: "#0D0D0D",
  accent: "#E6A800",
  error: "#E05070",
  success: "#6DBF67",
  whatsapp: "#25D366",
} as const;

export const ESTADOS = ["pendiente", "confirmado", "preparado", "entregado", "cancelado"] as const;
export type Estado = (typeof ESTADOS)[number];

export const DELIVERY_RANGES = ["6:30 - 7:00", "7:00 - 7:30", "7:30 - 8:00"] as const;

export const SORPRESA_ID = "__sorpresa__";

export const LUMO_WHATSAPP = "5215542779362";
export const LUMO_DOMAIN = "https://lumo-three-beta.vercel.app";

export const POLL_INTERVAL_MS = 15_000;
export const WHATSAPP_BATCH_DELAY_MS = 500;

// Shared between the client session check (app/mi-lumo/page.tsx) and the
// server-side token verification (/api/mi-lumo/session) — one source of
// truth for how long a Mi LUMO session stays valid.
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
