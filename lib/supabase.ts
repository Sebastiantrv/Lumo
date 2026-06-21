import { createClient } from "@supabase/supabase-js";

// Fallbacks are required because NEXT_PUBLIC_ vars are not available during
// static pre-rendering in the build step. These are public/anon credentials
// by design — actual security comes from Supabase RLS policies.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://zglxnderfwmlrtrqfwgi.supabase.co";

const anon =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_CIXay3aPrkVXnDGbDCRAuw_t2CRjdtK";

export const supabase = createClient(url, anon);

const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = service ? createClient(url, service) : supabase;
