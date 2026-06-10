import { createClient } from "@supabase/supabase-js";

// La URL y la clave publishable son públicas por diseño (viajan al navegador).
// La seguridad real proviene de las políticas RLS en Supabase.
// Se usan como valores por defecto para que la app funcione sin depender
// del inlining de variables NEXT_PUBLIC_ en el build.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://zglxnderfwmlrtrqfwgi.supabase.co";

const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_CIXay3aPrkVXnDGbDCRAuw_t2CRjdtK";

export const supabase = createClient(url, anon);

// Cliente admin: solo en el servidor. La service_role nunca se hardcodea.
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = service ? createClient(url, service) : supabase;
