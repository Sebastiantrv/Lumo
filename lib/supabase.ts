import { createClient } from "@supabase/supabase-js";

// NEXT_PUBLIC_ vars are unavailable during static pre-rendering at build time.
// These are public/anon credentials (safe to expose) — actual data protection
// comes from Supabase RLS policies and server-side service-role access.
// `||` en vez de `??`: una env var configurada como cadena vacía en Vercel
// también debe caer al fallback. Con `??` una URL vacía pasaba de largo y
// generaba peticiones a "" que fallan como "TypeError: fetch failed" sin
// mensaje útil.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://zglxnderfwmlrtrqfwgi.supabase.co";

const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_CIXay3aPrkVXnDGbDCRAuw_t2CRjdtK";

export const supabase = createClient(url, anon);

const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = service ? createClient(url, service) : supabase;
