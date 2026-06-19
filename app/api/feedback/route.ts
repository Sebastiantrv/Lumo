import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { error } = await supabase.from("feedback").insert({
    nombre: body.nombre ?? "",
    sabor_rating: body.sabor_rating ?? 0,
    sensacion_sabor: body.sensacion_sabor ?? "",
    frescura_rating: body.frescura_rating ?? 0,
    experiencia_lumo: body.experiencia_lumo ?? "",
    recomendacion: body.recomendacion ?? "",
    precio_justo: body.precio_justo ?? "",
    razon_adopcion: body.razon_adopcion ?? "",
    mejora_abierta: body.mejora_abierta || null,
    submitted_at: body.submitted_at ?? new Date().toISOString(),
  });

  if (error) console.error("Supabase feedback error:", error.message);

  return NextResponse.json({ ok: true });
}
