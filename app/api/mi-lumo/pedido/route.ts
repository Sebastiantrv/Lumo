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

  const { cliente_id, formula_id, cantidad, dia_entrega } = await req.json();

  if (!cliente_id || !formula_id || !cantidad || !dia_entrega) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, activo")
    .eq("id", cliente_id)
    .eq("activo", true)
    .single();

  if (!cliente) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 });
  }

  const { data: formula } = await supabase
    .from("formulas")
    .select("id, nombre, precio")
    .eq("id", formula_id)
    .single();

  if (!formula) {
    return NextResponse.json({ error: "Fórmula no encontrada" }, { status: 404 });
  }

  const total = formula.precio * cantidad;

  const { data: movimientos } = await supabase
    .from("movimientos_balance")
    .select("monto")
    .eq("cliente_id", cliente_id);

  const balance = (movimientos ?? []).reduce((s: number, m: { monto: number }) => s + m.monto, 0);

  if (balance < total) {
    return NextResponse.json(
      { error: "Balance insuficiente", balance, total },
      { status: 400 }
    );
  }

  const dow = new Date(dia_entrega + "T12:00:00").getDay();
  const tipoPedido = dow === 0 ? "domingo" : "normal";
  const token = crypto.randomUUID();

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      cliente_id,
      formula_id,
      cantidad,
      dia_entrega,
      tipo_pedido: tipoPedido,
      token,
    })
    .select("id")
    .single();

  if (pedidoError || !pedido) {
    return NextResponse.json({ error: "Error al crear la entrega" }, { status: 500 });
  }

  await supabase.from("movimientos_balance").insert({
    cliente_id,
    tipo: "cargo",
    monto: -total,
    descripcion: `Entrega: ${cantidad}x ${formula.nombre}`,
    referencia_pedido: pedido.id,
  });

  return NextResponse.json({
    ok: true,
    pedido_id: pedido.id,
    balance_restante: balance - total,
  });
}
