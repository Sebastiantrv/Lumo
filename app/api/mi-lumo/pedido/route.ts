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

  const body = await req.json();

  // Support both single-formula (legacy) and multi-formula (new)
  const cliente_id = body.cliente_id;
  const dia_entrega = body.dia_entrega;
  const lineas: { formula_id: string; cantidad: number }[] = body.lineas
    ?? [{ formula_id: body.formula_id, cantidad: body.cantidad }];

  if (!cliente_id || !dia_entrega || lineas.length === 0) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  for (const l of lineas) {
    if (!l.formula_id || !l.cantidad || l.cantidad < 1) {
      return NextResponse.json({ error: "Fórmula o cantidad inválida" }, { status: 400 });
    }
  }

  // Try atomic Postgres function first
  const { data, error } = await supabase.rpc("crear_pedido_atomico", {
    p_cliente_id: cliente_id,
    p_lineas: JSON.stringify(lineas.map((l) => ({ formula_id: l.formula_id, cantidad: l.cantidad }))),
    p_dia_entrega: dia_entrega,
    p_capacidad_check: true,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("Balance insuficiente")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (msg.includes("llenarse") || msg.includes("quedan")) {
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (msg.includes("no encontrad") || msg.includes("inactivo")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    // If the function doesn't exist yet, fall back to non-atomic flow
    if (msg.includes("could not find") || msg.includes("does not exist") || msg.includes("42883")) {
      return fallbackCreatePedido(supabase, cliente_id, lineas, dia_entrega);
    }
    return NextResponse.json({ error: msg || "Error al crear la entrega" }, { status: 500 });
  }

  return NextResponse.json(data);
}

// Fallback for when the Postgres function hasn't been created yet
async function fallbackCreatePedido(
  supabase: any,
  cliente_id: string,
  lineas: { formula_id: string; cantidad: number }[],
  dia_entrega: string
) {
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, activo")
    .eq("id", cliente_id)
    .eq("activo", true)
    .single();

  if (!cliente) {
    return NextResponse.json({ error: "Miembro no encontrado o inactivo" }, { status: 404 });
  }

  let total = 0;
  const formulaData: { id: string; nombre: string; precio: number }[] = [];
  for (const l of lineas) {
    const { data: formula } = await supabase
      .from("formulas")
      .select("id, nombre, precio")
      .eq("id", l.formula_id)
      .single();
    if (!formula) {
      return NextResponse.json({ error: "Fórmula no encontrada" }, { status: 404 });
    }
    formulaData.push(formula);
    total += formula.precio * l.cantidad;
  }

  const { data: movimientos } = await supabase
    .from("movimientos_balance")
    .select("monto")
    .eq("cliente_id", cliente_id);

  const balance = (movimientos ?? []).reduce((s: number, m: { monto: number }) => s + m.monto, 0);

  if (balance < total) {
    return NextResponse.json(
      { error: `Balance insuficiente. Tienes $${balance} pero necesitas $${total}.` },
      { status: 400 }
    );
  }

  const { data: confRow } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "capacidad_diaria")
    .single();

  if (confRow?.valor) {
    const capacidad = parseInt(confRow.valor);
    if (capacidad > 0) {
      const { data: pedidosDia } = await supabase
        .from("pedidos")
        .select("cantidad")
        .eq("dia_entrega", dia_entrega)
        .neq("estado", "cancelado");
      const botellasUsadas = (pedidosDia ?? []).reduce((s: number, p: { cantidad: number }) => s + p.cantidad, 0);
      const nuevasBotellas = lineas.reduce((s, l) => s + l.cantidad, 0);
      if (botellasUsadas + nuevasBotellas > capacidad) {
        return NextResponse.json(
          { error: `Esta mañana acaba de llenarse. Solo quedan ${Math.max(0, capacidad - botellasUsadas)} lugares.` },
          { status: 400 }
        );
      }
    }
  }

  const dow = new Date(dia_entrega + "T12:00:00").getDay();
  const tipoPedido = dow === 0 ? "domingo" : "normal";
  const token = crypto.randomUUID();
  const pedidoIds: string[] = [];

  for (let i = 0; i < lineas.length; i++) {
    const l = lineas[i];
    const f = formulaData[i];

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({ cliente_id, formula_id: l.formula_id, cantidad: l.cantidad, dia_entrega, tipo_pedido: tipoPedido, token })
      .select("id")
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json({ error: "Error al crear la entrega" }, { status: 500 });
    }

    pedidoIds.push(pedido.id);

    await supabase.from("movimientos_balance").insert({
      cliente_id,
      tipo: "cargo",
      monto: -(f.precio * l.cantidad),
      descripcion: `Entrega: ${l.cantidad}x ${f.nombre}`,
      referencia_pedido: pedido.id,
    });
  }

  return NextResponse.json({
    ok: true,
    token,
    balance_restante: balance - total,
    pedidos: pedidoIds.map((id) => ({ pedido_id: id })),
  });
}
