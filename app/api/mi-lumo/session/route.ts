import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifySessionToken } from "@/lib/session";
import { SESSION_MAX_AGE_MS } from "@/lib/constants";

export const dynamic = "force-dynamic";

/**
 * Verifies a Mi LUMO session token and returns fresh client data.
 * The frontend calls this on every load instead of trusting whatever is
 * sitting in localStorage — token identity is server-verified, and the
 * response is always a current read from Supabase, never cached PII.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.ip ?? "unknown";
  if (!checkRateLimit(ip, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  const verified = verifySessionToken(token, SESSION_MAX_AGE_MS);
  if (!verified) {
    return NextResponse.json({ error: "Sesión inválida o expirada" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: cliente, error } = await supabase
    .from("clientes")
    .select("id, nombre, codigo_miembro, telefono, email, empresa, restricciones, notas, activo, created_at")
    .eq("id", verified.clienteId)
    .single();

  if (error || !cliente) {
    return NextResponse.json({ error: "Sesión inválida o expirada" }, { status: 401 });
  }

  if (!cliente.activo) {
    return NextResponse.json({ error: "Cliente inactivo" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, miembro: cliente });
}
