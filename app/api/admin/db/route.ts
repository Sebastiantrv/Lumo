import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_TABLES = [
  "clientes", "pedidos", "movimientos_balance", "ajustes_pedido",
  "formulas", "recetas", "feedback", "configuracion",
];

export async function POST(req: NextRequest) {
  const { table, operation, payload, filters, options } = await req.json();

  if (!ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: "Table not allowed" }, { status: 400 });
  }
  if (!["insert", "update", "delete", "upsert"].includes(operation)) {
    return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;

    if (operation === "insert") {
      const q = supabaseAdmin.from(table).insert(payload);
      result = options?.select ? await q.select().single() : await q;
    } else if (operation === "upsert") {
      result = await supabaseAdmin.from(table).upsert(payload, options?.onConflict ? { onConflict: options.onConflict } : undefined);
    } else if (operation === "update") {
      let q = supabaseAdmin.from(table).update(payload) as any;
      for (const f of filters ?? []) {
        q = q.eq(f.column, f.value);
      }
      result = await q;
    } else {
      let q = supabaseAdmin.from(table).delete() as any;
      for (const f of filters ?? []) {
        q = q.eq(f.column, f.value);
      }
      result = await q;
    }

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, data: result.data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
