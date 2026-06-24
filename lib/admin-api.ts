export async function adminWrite(
  table: string,
  operation: "insert" | "update" | "delete" | "upsert",
  payload: Record<string, unknown>,
  filters?: { column: string; value: unknown }[],
  options?: { onConflict?: string; select?: boolean },
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const res = await fetch("/api/admin/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, operation, payload, filters, options }),
  });
  return res.json();
}
