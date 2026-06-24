import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

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

  // Validation
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  if (!nombre) {
    return NextResponse.json({ error: "nombre is required" }, { status: 400 });
  }

  const saborRating = body.sabor_rating;
  if (!Number.isInteger(saborRating) || saborRating < 1 || saborRating > 5) {
    return NextResponse.json({ error: "sabor_rating must be an integer between 1 and 5" }, { status: 400 });
  }

  const frescuraRating = body.frescura_rating;
  if (!Number.isInteger(frescuraRating) || frescuraRating < 1 || frescuraRating > 5) {
    return NextResponse.json({ error: "frescura_rating must be an integer between 1 and 5" }, { status: 400 });
  }

  for (const field of ["sensacion_sabor", "experiencia_lumo", "precio_justo"] as const) {
    const val = body[field];
    if (typeof val !== "string" || !val.trim()) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  try {
    const { error } = await supabase.from("feedback").insert({
      nombre,
      sabor_rating: saborRating,
      sensacion_sabor: body.sensacion_sabor ?? "",
      frescura_rating: frescuraRating,
      experiencia_lumo: body.experiencia_lumo ?? "",
      recomendacion: body.recomendacion ?? "",
      precio_justo: body.precio_justo ?? "",
      razon_adopcion: body.razon_adopcion ?? "",
      mejora_abierta: body.mejora_abierta || null,
      pedido_token: body.pedido_token || null,
      numero_pedido: body.numero_pedido || null,
      submitted_at: body.submitted_at ?? new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase feedback error:", error.message);
      return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected feedback error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const ip = req.headers.get("x-forwarded-for") ?? req.ip ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json();
  const pedidoToken = body.pedido_token;
  const addendum = typeof body.addendum === "string" ? body.addendum.trim() : "";
  if (!pedidoToken || !addendum) {
    return NextResponse.json({ error: "pedido_token and addendum are required" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("feedback")
    .select("id, mejora_abierta")
    .eq("pedido_token", pedidoToken)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
  }

  const updated = existing.mejora_abierta
    ? `${existing.mejora_abierta}\n\n[Adicional] ${addendum}`
    : `[Adicional] ${addendum}`;

  const { error } = await supabase
    .from("feedback")
    .update({ mejora_abierta: updated })
    .eq("id", existing.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
