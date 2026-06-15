import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  const restricciones = body.restricciones && body.restricciones !== "Ninguno" ? body.restricciones : null;
  const notasPartes = [
    body.area ? `Empresa: ${body.area}` : null,
    body.formula ? `Fórmula preferida: ${body.formula}` : null,
  ].filter(Boolean);

  // Guardar en Supabase como cliente
  const { error: sbError } = await supabase.from("clientes").insert({
    nombre: body.nombre ?? "",
    telefono: body.whatsapp ?? null,
    restricciones,
    notas: notasPartes.length > 0 ? notasPartes.join(" | ") : null,
    activo: true,
  });
  if (sbError) console.error("Supabase error:", sbError.message);

  // Guardar en Airtable (respaldo)
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

  return NextResponse.json({ ok: true });
}
