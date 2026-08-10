import { createHmac, timingSafeEqual } from "crypto";

// Falls back to the service-role key (already a server-only secret present
// in every deploy) so this works without a new required env var. Setting a
// dedicated SESSION_SECRET is still recommended — see recommendation below.
const SECRET =
  process.env.SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "lumo-dev-fallback-secret";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

/**
 * Opaque, HMAC-signed session token binding a browser session to one
 * cliente_id. The client only ever stores this string — never the raw
 * cliente_id or any client data — so hand-editing localStorage can't
 * forge a session for a different member without the server secret.
 */
export function createSessionToken(clienteId: string): string {
  const payload = Buffer.from(JSON.stringify({ cid: clienteId, iat: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | null | undefined, maxAgeMs: number): { clienteId: string } | null {
  if (!token || typeof token !== "string") return null;

  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let parsed: { cid?: string; iat?: number };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!parsed.cid || !parsed.iat) return null;
  if (Date.now() - parsed.iat > maxAgeMs) return null;

  return { clienteId: parsed.cid };
}
