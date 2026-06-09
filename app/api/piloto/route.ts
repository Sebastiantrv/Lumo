import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const token   = process.env.AIRTABLE_TOKEN;
  const baseId  = process.env.AIRTABLE_BASE_ID;
  const table   = process.env.AIRTABLE_TABLE ?? "Piloto";

  if (!token || !baseId) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 500 });
  }

  const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        nombre:       body.nombre       ?? "",
        whatsapp:     body.whatsapp     ?? "",
        empresa:      body.area         ?? "",
        formula:      body.formula      ?? "",
        preferencia:  body.preferencia  ?? "",
        restricciones: body.restricciones ?? "",
        timestamp:    body.timestamp    ?? new Date().toISOString(),
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Airtable error:", err);
    return NextResponse.json({ error: "Airtable error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
