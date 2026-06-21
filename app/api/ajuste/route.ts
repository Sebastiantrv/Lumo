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
  const { token, adjustment_type, requested_date, credit_validity_days } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  if (!adjustment_type || !["date_change", "credit_request"].includes(adjustment_type)) {
    return NextResponse.json({ error: "Invalid adjustment_type" }, { status: 400 });
  }

  if (adjustment_type === "date_change" && !requested_date) {
    return NextResponse.json({ error: "requested_date is required for date_change" }, { status: 400 });
  }

  try {
    const { data: pedidos, error: fetchError } = await supabase
      .from("pedidos")
      .select("id")
      .eq("token", token)
      .limit(1);

    if (fetchError || !pedidos?.length) {
      return NextResponse.json({ error: "Pedido not found" }, { status: 404 });
    }

    const pedido_id = pedidos[0].id;

    await supabase
      .from("ajustes_pedido")
      .update({ status: "superseded" })
      .eq("pedido_id", pedido_id)
      .eq("status", "pending_review");

    const { error } = await supabase.from("ajustes_pedido").insert({
      pedido_id,
      adjustment_type,
      requested_date: requested_date || null,
      credit_validity_days: credit_validity_days || null,
      status: "pending_review",
      requested_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase ajuste error:", error.message);
      return NextResponse.json({ error: "Failed to save adjustment" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Unexpected ajuste error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
