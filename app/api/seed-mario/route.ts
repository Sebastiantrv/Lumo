import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  try {
    // 1. Get formulas
    const { data: formulas } = await supabaseAdmin.from("formulas").select("id, nombre, slug, precio");
    if (!formulas || formulas.length === 0) {
      return NextResponse.json({ error: "No formulas found" }, { status: 500 });
    }

    const verde = formulas.find((f: { slug: string }) => f.slug?.includes("verde"));
    const rojo = formulas.find((f: { slug: string }) => f.slug?.includes("rojo"));
    const tropical = formulas.find((f: { slug: string }) => f.slug?.includes("tropical"));

    if (!verde || !rojo || !tropical) {
      return NextResponse.json({ error: "Missing formula slugs", formulas }, { status: 500 });
    }

    // 2. Create or find Mario Perez
    const { data: existing } = await supabaseAdmin
      .from("clientes")
      .select("id")
      .eq("codigo_miembro", "LM-777")
      .single();

    let clienteId: string;

    if (existing) {
      clienteId = existing.id;
      await supabaseAdmin.from("pedidos").delete().eq("cliente_id", clienteId);
      await supabaseAdmin.from("movimientos_balance").delete().eq("cliente_id", clienteId);
    } else {
      const { data: newClient, error: insertErr } = await supabaseAdmin
        .from("clientes")
        .insert({
          nombre: "Mario Perez",
          telefono: "5512345678",
          email: "mario@test.com",
          empresa: "WeWork Reforma",
          codigo_miembro: "LM-777",
          restricciones: "Apio, Jengibre",
          notas: "Fórmula preferida: Verde Fresco",
          activo: true,
        })
        .select("id")
        .single();

      if (insertErr || !newClient) {
        return NextResponse.json({ error: insertErr?.message ?? "Failed to create client" }, { status: 500 });
      }
      clienteId = newClient.id;
    }

    // 3. Generate ~1 month of orders: 3x/week (Mon, Wed, Fri)
    const pedidos: Record<string, unknown>[] = [];
    const now = new Date();
    let orderNum = 9000;

    // Past 4 weeks (all entregado)
    for (let week = 4; week >= 1; week--) {
      for (const targetDow of [1, 3, 5]) {
        const d = new Date(now);
        const currentDow = d.getDay();
        const daysBack = (week * 7) - (targetDow - currentDow);
        d.setDate(d.getDate() - daysBack);
        if (d >= now) continue;

        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        // Distribution: ~8 verde, ~3 rojo, ~1 tropical out of 12
        const idx = orderNum - 9000;
        const formulaId =
          idx % 4 === 3 ? rojo.id :
          idx === 5 ? tropical.id :
          verde.id;

        pedidos.push({
          cliente_id: clienteId,
          formula_id: formulaId,
          cantidad: 1,
          dia_entrega: dateStr,
          estado: "entregado",
          token: `mario-test-${orderNum}`,
          numero_pedido: orderNum,
          hora_preparado: new Date(d.getTime() + 7 * 3600000).toISOString(),
          hora_entrega_estimada: "10:00 – 12:00",
        });
        orderNum++;
      }
    }

    // 2 upcoming orders (tomorrow and +3 days)
    for (const daysAhead of [1, 3]) {
      const d = new Date(now);
      d.setDate(d.getDate() + daysAhead);
      if (d.getDay() === 0) d.setDate(d.getDate() + 1);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      pedidos.push({
        cliente_id: clienteId,
        formula_id: verde.id,
        cantidad: 1,
        dia_entrega: dateStr,
        estado: daysAhead === 1 ? "confirmado" : "pendiente",
        token: `mario-test-${orderNum}`,
        numero_pedido: orderNum,
        hora_preparado: null,
        hora_entrega_estimada: null,
      });
      orderNum++;
    }

    // 4. Insert pedidos
    const { error: pedidosErr } = await supabaseAdmin.from("pedidos").insert(pedidos);
    if (pedidosErr) {
      return NextResponse.json({ error: "Pedidos: " + pedidosErr.message }, { status: 500 });
    }

    // 5. Balance: initial deposit + deductions
    const precio = verde.precio ?? 120;
    const entregados = pedidos.filter((p) => p.estado === "entregado");
    const movimientos = [
      {
        cliente_id: clienteId,
        tipo: "recarga",
        monto: 3000,
        descripcion: "Recarga inicial",
      },
      ...entregados.map((p) => ({
        cliente_id: clienteId,
        tipo: "pedido",
        monto: -precio,
        descripcion: `Pedido #${p.numero_pedido}`,
        referencia_pedido: p.token,
      })),
    ];

    const { error: movErr } = await supabaseAdmin.from("movimientos_balance").insert(movimientos);
    if (movErr) {
      return NextResponse.json({ error: "Movimientos: " + movErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      clienteId,
      codigo: "LM-777",
      telefono: "5512345678",
      pedidosCreados: pedidos.length,
      entregados: entregados.length,
      proximos: pedidos.length - entregados.length,
      balanceRestante: 3000 - (entregados.length * precio),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}
