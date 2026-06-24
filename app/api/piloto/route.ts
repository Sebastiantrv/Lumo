import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function generarCodigoMiembro(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `LM-${num}`;
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const ip = req.headers.get("x-forwarded-for") ?? req.ip ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  if (!nombre) {
    return NextResponse.json({ error: "nombre is required" }, { status: 400 });
  }

  const whatsapp = typeof body.whatsapp === "string" ? body.whatsapp : "";
  if (!/[0-9+\s()-]{7,}/.test(whatsapp)) {
    return NextResponse.json({ error: "whatsapp must be a valid phone number" }, { status: 400 });
  }

  try {
    const restricciones = body.restricciones && body.restricciones !== "Ninguno" ? body.restricciones : null;
    const notasPartes = [
      body.area ? `Empresa: ${body.area}` : null,
      body.formula ? `Fórmula preferida: ${body.formula}` : null,
    ].filter(Boolean);

    const { data: existingCodes } = await supabase
      .from("clientes")
      .select("codigo_miembro")
      .not("codigo_miembro", "is", null);

    const usedCodes = new Set((existingCodes ?? []).map((c: { codigo_miembro: string }) => c.codigo_miembro));
    let codigo = generarCodigoMiembro();
    let attempts = 0;
    while (usedCodes.has(codigo) && attempts < 50) { codigo = generarCodigoMiembro(); attempts++; }

    const { data: clienteRow, error: sbError } = await supabase.from("clientes").insert({
      nombre,
      telefono: body.whatsapp ?? null,
      restricciones,
      notas: notasPartes.length > 0 ? notasPartes.join(" | ") : null,
      empresa: body.area ?? null,
      activo: true,
      codigo_miembro: codigo,
      categoria: body.area ? "empresa" : "amigo",
    }).select("id").single();

    if (sbError || !clienteRow) {
      console.error("Supabase error:", sbError?.message);
      return NextResponse.json({ error: "Failed to save client" }, { status: 500 });
    }

    const { data: formulas } = await supabase.from("formulas").select("precio");
    const precios = (formulas ?? []).map((f: { precio: number }) => f.precio).filter((p: number) => p > 0);
    const avgPrecio = precios.length > 0 ? precios.reduce((a: number, b: number) => a + b, 0) / precios.length : 85;
    const welcomeBalance = Math.round(avgPrecio * 3);

    await supabase.from("movimientos_balance").insert({
      cliente_id: clienteRow.id,
      tipo: "recarga",
      monto: welcomeBalance,
      descripcion: "Balance LUMO de cortesía",
    });

    // Airtable backup
    const token  = process.env.AIRTABLE_TOKEN;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const table  = process.env.AIRTABLE_TABLE ?? "Piloto";

    if (token && baseId) {
      const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            nombre:        body.nombre        ?? "",
            whatsapp:      body.whatsapp      ?? "",
            empresa:       body.area          ?? "",
            formula:       body.formula       ?? "",
            preferencia:   body.preferencia   ?? "",
            restricciones: body.restricciones ?? "",
            timestamp:     body.timestamp     ?? new Date().toISOString(),
          },
        }),
      });
      if (!res.ok) console.error("Airtable error:", await res.text());
    }

    return NextResponse.json({ ok: true, codigo_miembro: codigo });
  } catch (err) {
    console.error("Unexpected piloto error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
