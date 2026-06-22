import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";

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

  if (!clienteTelClean || !telefonoClean.endsWith(clienteTelClean.slice(-10)) && !clienteTelClean.endsWith(telefonoClean.slice(-10))) {
    return NextResponse.json({ error: "No encontramos una membresía con esos datos." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, miembro: cliente });
}
