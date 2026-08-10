import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.ip ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { codigo, telefono } = await req.json();

  if (!codigo || !telefono) {
    return NextResponse.json({ error: "Código y WhatsApp son requeridos" }, { status: 400 });
  }

  const codigoFull = codigo.startsWith("LM-") ? codigo : `LM-${codigo}`;

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, codigo_miembro, telefono, email, empresa, restricciones, notas, activo, created_at")
    .eq("codigo_miembro", codigoFull)
    .eq("activo", true)
    .limit(1);

  if (error || !data?.length) {
    return NextResponse.json({ error: "No encontramos una membresía con esos datos." }, { status: 404 });
  }

  const cliente = data[0];
  const telefonoClean = telefono.replace(/\D/g, "");
  const clienteTelClean = (cliente.telefono ?? "").replace(/\D/g, "");

  // Comparamos solo los últimos 10 dígitos para tolerar diferencias de
  // lada/país (+52 vs. nacional), pero exigimos que AMBOS números tengan al
  // menos 10 dígitos antes de comparar. Sin ese mínimo, un teléfono de 1-2
  // dígitos hacía `endsWith` trivialmente verdadero contra cualquier cliente
  // cuyo número terminara igual — bypass total de login con solo el código.
  const MIN_PHONE_DIGITS = 10;
  const telefonosCoinciden =
    clienteTelClean.length >= MIN_PHONE_DIGITS &&
    telefonoClean.length >= MIN_PHONE_DIGITS &&
    clienteTelClean.slice(-10) === telefonoClean.slice(-10);

  if (!telefonosCoinciden) {
    return NextResponse.json({ error: "No encontramos una membresía con esos datos." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    miembro: cliente,
    // Signed separately from `cliente` — the frontend stores only this,
    // never the raw client object, so localStorage can't be hand-edited
    // into a session for a different cliente_id.
    session_token: createSessionToken(cliente.id),
  });
}
