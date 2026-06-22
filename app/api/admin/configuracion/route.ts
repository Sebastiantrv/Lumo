import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("configuracion")
    .select("clave, valor");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const config: Record<string, string> = {};
  for (const row of data ?? []) config[row.clave] = row.valor;
  return NextResponse.json(config);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { clave, valor } = body;

  if (!clave || valor === undefined) {
    return NextResponse.json({ error: "clave y valor requeridos" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("configuracion")
    .upsert({ clave, valor: String(valor) }, { onConflict: "clave" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
