"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { LUMO_WHATSAPP } from "@/lib/constants";

/* ── Types ── */
type Miembro = {
  id: string;
  nombre: string;
  codigo_miembro: string;
  telefono: string | null;
  email: string | null;
  empresa: string | null;
  restricciones: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
};

type Formula = {
  id: string;
  nombre: string;
  slug: string;
  color_acento: string;
  precio: number;
};

type Pedido = {
  id: string;
  cantidad: number;
  estado: string;
  dia_entrega: string;
  formula_id: string;
  token: string | null;
  numero_pedido: number | null;
  created_at: string;
  formulas: { nombre: string; color_acento: string } | null;
};

type Movimiento = {
  id: string;
  tipo: string;
  monto: number;
  descripcion: string;
  referencia_pedido: string | null;
  created_at: string;
};

/* ── Constants ── */
const CREAM = "#F4EFE7";
const VERDE = "#4A5E3A";
const TROPICAL = "#B8860B";
const ACCENT = "#E6A800";
const ROJO = "#7A2030";

/* ── Main page ── */
export default function MiLumoPage() {
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("miembro_lumo");
    if (stored) {
      try {
        setMiembro(JSON.parse(stored));
      } catch {
        localStorage.removeItem("miembro_lumo");
      }
    }
    setLoading(false);
  }, []);

  function handleLogin(m: Miembro) {
    setMiembro(m);
    localStorage.setItem("miembro_lumo", JSON.stringify(m));
  }

  function handleLogout() {
    setMiembro(null);
    localStorage.removeItem("miembro_lumo");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM }}>
        <div style={{ animation: "lumoFadeIn 0.8s ease both" }}>
          <span className="font-cormorant text-2xl tracking-[0.3em]" style={{ color: VERDE }}>
            L U M O
          </span>
        </div>
      </div>
    );
  }

  if (!miembro) return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard miembro={miembro} onLogout={handleLogout} />;
}

/* ══════════════════════════════════════════════
   LOGIN
   ══════════════════════════════════════════════ */
function LoginScreen({ onLogin }: { onLogin: (m: Miembro) => void }) {
  const [codigo, setCodigo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/mi-lumo/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, telefono }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al verificar");
        setSubmitting(false);
        return;
      }
      onLogin(data.miembro);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM }}>
      <MiLumoNavbar />

      <div className="flex-1 flex flex-col items-center justify-center px-6" style={{ animation: "lumoFadeUp 0.6s ease both" }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-10" style={{ animation: "lumoFadeUp 0.6s ease both", animationDelay: "0.1s" }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "rgba(74,94,58,0.08)" }}>
              <DropIcon size={24} color={VERDE} />
            </div>
            <h1 className="font-cormorant font-semibold text-2xl mb-2" style={{ color: "#2D2D2D" }}>
              Bienvenido a Mi LUMO
            </h1>
            <p className="font-inter text-sm" style={{ color: "#8A8A7A" }}>
              Tu espacio privado como miembro
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" style={{ animation: "lumoFadeUp 0.6s ease both", animationDelay: "0.2s" }}>
            <div>
              <label className="font-inter text-xs mb-1.5 block" style={{ color: "#6B6B5E", letterSpacing: "0.06em" }}>
                Código LUMO
              </label>
              <div className="flex items-center rounded-xl overflow-hidden" style={{ background: "#fff", border: "1px solid rgba(74,94,58,0.15)" }}>
                <span className="px-3 font-inter text-base font-medium" style={{ color: VERDE }}>LM-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={codigo.replace(/^LM-/, "")}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="000"
                  className="w-full py-3.5 pr-4 font-inter outline-none"
                  style={{ background: "transparent", color: "#2D2D2D", fontSize: "16px" }}
                />
              </div>
            </div>

            <div>
              <label className="font-inter text-xs mb-1.5 block" style={{ color: "#6B6B5E", letterSpacing: "0.06em" }}>
                WhatsApp registrado
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="55 1234 5678"
                className="w-full rounded-xl py-3.5 px-4 font-inter outline-none"
                style={{ background: "#fff", border: "1px solid rgba(74,94,58,0.15)", color: "#2D2D2D", fontSize: "16px" }}
              />
            </div>

            {error && (
              <p className="font-inter text-xs text-center py-2" style={{ color: ROJO, animation: "lumoShake 0.4s ease" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || codigo.length < 3 || !telefono.trim()}
              className="w-full rounded-xl py-3.5 font-inter text-sm font-medium transition-opacity disabled:opacity-40 spring-press"
              style={{ background: VERDE, color: CREAM }}
            >
              {submitting ? "Verificando…" : "Acceder a Mi LUMO"}
            </button>
          </form>

          <p className="text-center mt-8 font-inter text-xs" style={{ color: "#A0A090" }}>
            ¿No tienes código?{" "}
            <a href={`https://wa.me/${LUMO_WHATSAPP}`} target="_blank" rel="noopener" style={{ color: VERDE, textDecoration: "underline" }}>
              Escríbenos
            </a>
          </p>
        </div>
      </div>

      <MiLumoFooter />
    </div>
  );
}

/* ══════════════════════════════════════════════
   DASHBOARD
   ══════════════════════════════════════════════ */
function Dashboard({ miembro, onLogout }: { miembro: Miembro; onLogout: () => void }) {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNuevoPedido, setShowNuevoPedido] = useState(false);
  const [tab, setTab] = useState<"inicio" | "historial" | "perfil">("inicio");

  const load = useCallback(async () => {
    const [{ data: f }, { data: p }, { data: m }] = await Promise.all([
      supabase.from("formulas").select("id, nombre, slug, color_acento, precio").order("nombre"),
      supabase
        .from("pedidos")
        .select("id, cantidad, estado, dia_entrega, formula_id, token, numero_pedido, created_at, formulas(nombre, color_acento)")
        .eq("cliente_id", miembro.id)
        .order("dia_entrega", { ascending: false }),
      supabase
        .from("movimientos_balance")
        .select("id, tipo, monto, descripcion, referencia_pedido, created_at")
        .eq("cliente_id", miembro.id)
        .order("created_at", { ascending: false }),
    ]);
    setFormulas((f ?? []) as unknown as Formula[]);
    setPedidos((p ?? []) as unknown as Pedido[]);
    setMovimientos((m ?? []) as unknown as Movimiento[]);
    setBalance((m ?? []).reduce((s: number, mov: { monto: number }) => s + mov.monto, 0));
    setLoading(false);
  }, [miembro.id]);

  useEffect(() => { load(); }, [load]);

  const hoy = new Date().toISOString().split("T")[0];
  const pedidosActivos = pedidos.filter(
    (p) => p.dia_entrega >= hoy && p.estado !== "cancelado" && p.estado !== "entregado"
  );
  const pedidosHistorial = pedidos.filter(
    (p) => p.estado === "entregado" || p.estado === "cancelado" || p.dia_entrega < hoy
  );

  const memberSince = new Date(miembro.created_at).toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: CREAM }}>
        <div style={{ animation: "accentPulse 1.5s ease infinite" }}>
          <DropIcon size={28} color={VERDE} />
        </div>
      </div>
    );
  }

  // Group active orders by token
  const groupedActivos = groupByToken(pedidosActivos);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM }}>
      <MiLumoNavbar showLogout onLogout={onLogout} />

      <main className="flex-1 pb-8">
        {/* Hero greeting */}
        <section
          className="px-5 pt-6 pb-8 text-center"
          style={{ animation: "lumoFadeUp 0.6s ease both" }}
        >
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(74,94,58,0.08)", animation: "lumoScaleIn 0.5s var(--spring) both", animationDelay: "0.15s" }}
          >
            <span className="font-cormorant font-semibold text-2xl" style={{ color: VERDE }}>
              {miembro.nombre.charAt(0).toUpperCase()}
            </span>
          </div>
          <p className="font-inter text-sm mb-1" style={{ color: "#8A8A7A", animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.2s" }}>
            {greeting()}
          </p>
          <h1
            className="font-cormorant font-semibold mb-1"
            style={{ fontSize: "1.9rem", color: "#2D2D2D", lineHeight: 1.2, animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.25s" }}
          >
            {miembro.nombre.split(" ")[0]}
          </h1>
          <div style={{ animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.3s" }}>
            <span className="font-inter text-xs px-3 py-1 rounded-full" style={{ background: "rgba(74,94,58,0.1)", color: VERDE }}>
              {miembro.codigo_miembro}
            </span>
            {miembro.empresa && (
              <p className="font-inter text-xs mt-2" style={{ color: "#A0A090" }}>
                {miembro.empresa}
              </p>
            )}
            <p className="font-inter text-xs mt-1" style={{ color: "#B0B0A0" }}>
              Miembro desde {memberSince}
            </p>
          </div>
        </section>

        {/* Balance card */}
        <div
          className="mx-5 mb-5 rounded-2xl p-5"
          style={{ background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.04)", animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.35s" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <DropIcon size={16} color={ACCENT} />
            <span className="font-inter text-xs font-medium tracking-wide" style={{ color: "#8A8A7A" }}>
              BALANCE LUMO
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="font-cormorant font-semibold" style={{ fontSize: "2.4rem", color: "#2D2D2D", lineHeight: 1 }}>
              ${balance.toLocaleString("es-MX")}
            </span>
            <button
              className="font-inter text-xs px-4 py-2 rounded-xl spring-press"
              style={{ background: "rgba(184,134,11,0.08)", color: TROPICAL, border: "1px solid rgba(184,134,11,0.15)" }}
            >
              Recargar
            </button>
          </div>
          <p className="font-inter text-xs mt-2" style={{ color: "#A0A090" }}>
            Próximamente podrás recargar tu Balance LUMO desde aquí.
          </p>
        </div>

        {/* Quick action */}
        {balance > 0 && (
          <div className="mx-5 mb-6" style={{ animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.4s" }}>
            <button
              onClick={() => setShowNuevoPedido(true)}
              className="w-full rounded-2xl py-4 font-inter text-sm font-medium flex items-center justify-center gap-2 spring-press"
              style={{ background: VERDE, color: CREAM }}
            >
              <PlusIcon size={16} color={CREAM} />
              Solicitar nuevo LUMO
            </button>
          </div>
        )}

        {/* Active orders grouped by token */}
        {groupedActivos.length > 0 && (
          <section className="mx-5 mb-6" style={{ animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.45s" }}>
            <h2 className="font-cormorant font-semibold text-lg mb-3" style={{ color: "#2D2D2D" }}>
              Entregas activas
            </h2>
            <div className="flex flex-col gap-3">
              {groupedActivos.map((group) => (
                <PedidoGroupCard key={group.token} group={group} />
              ))}
            </div>
          </section>
        )}

        {/* Empty states */}
        {groupedActivos.length === 0 && balance > 0 && (
          <div className="mx-5 mb-6 rounded-2xl p-6 text-center" style={{ background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.04)", animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.45s" }}>
            <LeafIllustration />
            <p className="font-cormorant text-lg mb-1" style={{ color: "#2D2D2D" }}>
              Sin entregas activas
            </p>
            <p className="font-inter text-xs" style={{ color: "#8A8A7A" }}>
              Tienes balance disponible. Solicita tu próximo LUMO.
            </p>
          </div>
        )}

        {groupedActivos.length === 0 && balance <= 0 && (
          <div className="mx-5 mb-6 rounded-2xl p-6 text-center" style={{ background: "#fff", boxShadow: "0 1px 8px rgba(0,0,0,0.04)", animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.45s" }}>
            <LeafIllustration />
            <p className="font-cormorant text-lg mb-1" style={{ color: "#2D2D2D" }}>
              Tu Balance LUMO está en cero
            </p>
            <p className="font-inter text-xs" style={{ color: "#8A8A7A" }}>
              Recarga tu balance para solicitar tu próxima entrega.
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="mx-5 mb-4 flex gap-1 rounded-xl p-1" style={{ background: "rgba(74,94,58,0.06)" }}>
          {(["inicio", "historial", "perfil"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 rounded-lg py-2 font-inter text-xs font-medium transition-all"
              style={{
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#2D2D2D" : "#8A8A7A",
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {t === "inicio" ? "Inicio" : t === "historial" ? "Historial" : "Mi perfil"}
            </button>
          ))}
        </div>

        <div style={{ animation: "lumoFadeIn 0.3s ease both" }} key={tab}>
          {tab === "inicio" && (
            <section className="mx-5">
              {pedidosHistorial.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
                  <p className="font-inter text-xs mb-2" style={{ color: "#8A8A7A" }}>Últimas entregas</p>
                  {pedidosHistorial.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: p.formulas?.color_acento ?? VERDE }} />
                      <span className="font-inter text-sm flex-1" style={{ color: "#2D2D2D" }}>
                        {p.cantidad}x {p.formulas?.nombre ?? "Fórmula"}
                      </span>
                      <span className="font-inter text-xs" style={{ color: "#A0A090" }}>{formatDateShort(p.dia_entrega)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "historial" && (
            <HistorialTab pedidos={pedidosHistorial} movimientos={movimientos} />
          )}

          {tab === "perfil" && (
            <PerfilTab miembro={miembro} pedidos={pedidos} onLogout={onLogout} />
          )}
        </div>
      </main>

      <MiLumoFooter />

      {showNuevoPedido && (
        <NuevoPedidoModal
          clienteId={miembro.id}
          formulas={formulas}
          balance={balance}
          onClose={() => setShowNuevoPedido(false)}
          onSuccess={() => { setShowNuevoPedido(false); load(); }}
        />
      )}
    </div>
  );
}

/* ── Navbar for Mi LUMO ── */
function MiLumoNavbar({ showLogout, onLogout }: { showLogout?: boolean; onLogout?: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  function openMenu() { setMenuOpen(true); setClosing(false); }
  function closeMenu() { setClosing(true); }
  function handleAnimationEnd() { if (closing) { setMenuOpen(false); setClosing(false); } }

  return (
    <>
      <nav
        className="sticky top-0 z-40 flex items-center justify-between px-5 py-4"
        style={{
          background: "rgba(244,239,231,0.85)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Link href="/" className="font-cormorant text-lg tracking-[0.3em] font-semibold spring-press" style={{ color: "#2D2D2D" }}>
          L U M O
        </Link>
        <button onClick={openMenu} className="flex flex-col gap-[5px] p-2 spring-press rounded-lg" aria-label="Abrir menú">
          <span className="block w-5 h-[1.5px]" style={{ backgroundColor: "#2D2D2D" }} />
          <span className="block w-5 h-[1.5px]" style={{ backgroundColor: "#2D2D2D" }} />
        </button>
      </nav>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{
            background: "rgba(13, 13, 13, 0.88)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            animation: closing ? "overlayOut 0.4s var(--spring) both" : "overlayIn 0.4s var(--spring) both",
          }}
          onAnimationEnd={handleAnimationEnd}
        >
          <div className="flex items-center justify-between px-6 py-5">
            <Link href="/" onClick={closeMenu} className="font-cormorant text-xl tracking-[0.35em] font-semibold text-[#F5F0E8] spring-press">
              L U M O
            </Link>
            <button onClick={closeMenu} className="p-2 text-[#F5F0E8] spring-press rounded-full" aria-label="Cerrar menú">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col items-center justify-center flex-1 gap-8">
            {[
              { href: "/", label: "Inicio" },
              { href: "/formulas", label: "Fórmulas" },
              { href: "/proceso", label: "Proceso" },
              { href: "/mi-lumo", label: "Mi LUMO" },
            ].map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="font-cormorant text-4xl md:text-5xl font-light text-[#F5F0E8] spring-press"
                style={{ animation: `menuItemIn 0.5s var(--spring) both`, animationDelay: `${0.06 + i * 0.08}s` }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {showLogout && onLogout && (
            <div className="px-6 pb-8 text-center" style={{ animation: "menuItemIn 0.5s var(--spring) both", animationDelay: "0.4s" }}>
              <button
                onClick={() => { onLogout(); closeMenu(); }}
                className="font-inter text-sm spring-press"
                style={{ color: "#8A8A8A" }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ── Footer for Mi LUMO ── */
function MiLumoFooter() {
  return (
    <footer className="px-5 py-6 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
      <span className="font-cormorant text-sm tracking-[0.3em]" style={{ color: "#C0C0B0" }}>
        L U M O
      </span>
      <p className="font-inter text-xs mt-1" style={{ color: "#C0C0B0" }}>
        Prensados en frío · Lotes limitados
      </p>
    </footer>
  );
}

/* ── Historial tab ── */
function HistorialTab({ pedidos, movimientos }: { pedidos: Pedido[]; movimientos: Movimiento[] }) {
  type TimelineItem = { date: string; type: "pedido" | "movimiento"; data: Pedido | Movimiento };
  const items: TimelineItem[] = [
    ...pedidos.map((p) => ({ date: p.created_at, type: "pedido" as const, data: p })),
    ...movimientos.map((m) => ({ date: m.created_at, type: "movimiento" as const, data: m })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (items.length === 0) {
    return (
      <div className="mx-5 rounded-2xl p-6 text-center" style={{ background: "#fff" }}>
        <p className="font-inter text-sm" style={{ color: "#8A8A7A" }}>Aún no hay actividad.</p>
      </div>
    );
  }

  return (
    <section className="mx-5">
      <div className="flex flex-col gap-2">
        {items.slice(0, 30).map((item) => {
          if (item.type === "pedido") {
            const p = item.data as Pedido;
            const estadoLabel: Record<string, string> = {
              pendiente: "Pendiente",
              confirmado: "Confirmado",
              preparado: "Preparado",
              entregado: "Entregado",
              cancelado: "Cancelado",
            };
            return (
              <div key={`p-${p.id}`} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#fff" }}>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: p.estado === "entregado" ? "#6DBF67" : p.estado === "cancelado" ? ROJO : TROPICAL }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-sm truncate" style={{ color: "#2D2D2D" }}>
                    {p.cantidad}x {p.formulas?.nombre ?? "Fórmula"}
                  </p>
                  <p className="font-inter text-xs" style={{ color: "#8A8A7A" }}>
                    {formatDate(p.dia_entrega)} · {estadoLabel[p.estado] ?? p.estado}
                  </p>
                </div>
              </div>
            );
          }
          const m = item.data as Movimiento;
          return (
            <div key={`m-${m.id}`} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#fff" }}>
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: m.monto > 0 ? "#6DBF67" : "#B0B0A0" }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-inter text-sm truncate" style={{ color: "#2D2D2D" }}>
                  {m.descripcion}
                </p>
                <p className="font-inter text-xs" style={{ color: "#8A8A7A" }}>
                  {formatDateTime(m.created_at)}
                </p>
              </div>
              <span
                className="font-inter text-sm font-medium flex-shrink-0"
                style={{ color: m.monto > 0 ? "#6DBF67" : "#8A8A7A" }}
              >
                {m.monto > 0 ? "+" : ""}${Math.abs(m.monto).toLocaleString("es-MX")}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Perfil tab ── */
function PerfilTab({ miembro, pedidos, onLogout }: { miembro: Miembro; pedidos: Pedido[]; onLogout: () => void }) {
  const totalEntregas = pedidos.filter((p) => p.estado === "entregado").length;
  const totalBotellas = pedidos
    .filter((p) => p.estado === "entregado")
    .reduce((s, p) => s + p.cantidad, 0);

  const formulaCounts = new Map<string, { nombre: string; color: string; count: number }>();
  for (const p of pedidos.filter((p) => p.estado === "entregado")) {
    const key = p.formula_id;
    const existing = formulaCounts.get(key);
    if (existing) {
      existing.count += p.cantidad;
    } else {
      formulaCounts.set(key, {
        nombre: p.formulas?.nombre ?? "—",
        color: p.formulas?.color_acento ?? VERDE,
        count: p.cantidad,
      });
    }
  }
  const favorita = Array.from(formulaCounts.values()).sort((a, b) => b.count - a.count)[0];

  const cambioMsg = encodeURIComponent(
    `Hola LUMO 🍃 Soy ${miembro.nombre} (${miembro.codigo_miembro}). Me gustaría actualizar mis datos de miembro.`
  );

  return (
    <section className="mx-5 flex flex-col gap-4">
      <div className="rounded-2xl p-5" style={{ background: "#fff" }}>
        <h3 className="font-cormorant font-semibold text-base mb-3" style={{ color: "#2D2D2D" }}>
          Mi información
        </h3>
        <div className="flex flex-col gap-2">
          <InfoRow label="Nombre" value={miembro.nombre} />
          <InfoRow label="Código" value={miembro.codigo_miembro} />
          <InfoRow label="WhatsApp" value={miembro.telefono ?? "—"} />
          {miembro.email && <InfoRow label="Email" value={miembro.email} />}
          {miembro.empresa && <InfoRow label="Empresa" value={miembro.empresa} />}
          {miembro.restricciones && <InfoRow label="Restricciones" value={miembro.restricciones} />}
        </div>

        <a
          href={`https://wa.me/${LUMO_WHATSAPP}?text=${cambioMsg}`}
          target="_blank"
          rel="noopener"
          className="flex items-center justify-center gap-2 w-full mt-4 rounded-xl py-3 font-inter text-sm spring-press"
          style={{ background: "rgba(37,211,102,0.08)", color: "#25D366", border: "1px solid rgba(37,211,102,0.15)" }}
        >
          <WhatsAppIcon size={16} />
          Solicitar cambio de datos
        </a>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "#fff" }}>
        <h3 className="font-cormorant font-semibold text-base mb-3" style={{ color: "#2D2D2D" }}>
          Mi actividad
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Entregas" value={String(totalEntregas)} />
          <StatBox label="Botellas" value={String(totalBotellas)} />
        </div>
        {favorita && (
          <div className="mt-3 flex items-center gap-2 rounded-xl p-3" style={{ background: "rgba(74,94,58,0.04)" }}>
            <div className="w-3 h-3 rounded-full" style={{ background: favorita.color }} />
            <span className="font-inter text-xs" style={{ color: "#8A8A7A" }}>Favorita:</span>
            <span className="font-inter text-xs font-medium" style={{ color: "#2D2D2D" }}>{favorita.nombre}</span>
          </div>
        )}
      </div>

      <button
        onClick={onLogout}
        className="w-full rounded-xl py-3 font-inter text-sm transition-all spring-press"
        style={{ background: "rgba(122,32,48,0.06)", color: ROJO, border: "1px solid rgba(122,32,48,0.12)" }}
      >
        Cerrar sesión
      </button>
    </section>
  );
}

/* ── Nuevo pedido modal ── */
function NuevoPedidoModal({
  clienteId,
  formulas,
  balance,
  onClose,
  onSuccess,
}: {
  clienteId: string;
  formulas: Formula[];
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [formulaId, setFormulaId] = useState(formulas[0]?.id ?? "");
  const [cantidad, setCantidad] = useState(1);
  const [diaEntrega, setDiaEntrega] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const formula = formulas.find((f) => f.id === formulaId);
  const total = (formula?.precio ?? 0) * cantidad;
  const alcanza = balance >= total;

  const deliveryDays = getNextDeliveryDays();

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/mi-lumo/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, formula_id: formulaId, cantidad, dia_entrega: diaEntrega }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear la entrega");
        setSaving(false);
        return;
      }
      setSuccess(true);
      setTimeout(onSuccess, 2000);
    } catch {
      setError("Error de conexión");
      setSaving(false);
    }
  }

  if (success) {
    return (
      <ModalOverlay onClose={() => {}}>
        <div className="text-center py-8" style={{ animation: "lumoScaleIn 0.5s var(--spring) both" }}>
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(74,94,58,0.1)" }}>
            <CheckIcon size={28} color={VERDE} />
          </div>
          <h2 className="font-cormorant font-semibold text-xl mb-2" style={{ color: "#2D2D2D" }}>
            ¡Entrega solicitada!
          </h2>
          <p className="font-inter text-sm" style={{ color: "#8A8A7A" }}>
            Te avisaremos por WhatsApp cuando esté lista.
          </p>
        </div>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="font-cormorant font-semibold text-lg mb-5" style={{ color: "#2D2D2D" }}>
        Solicitar nuevo LUMO
      </h2>

      {step === 1 && (
        <div className="flex flex-col gap-3" style={{ animation: "lumoFadeUp 0.4s ease both" }}>
          <p className="font-inter text-xs mb-1" style={{ color: "#8A8A7A" }}>Elige tu fórmula</p>
          {formulas.map((f, i) => (
            <button
              key={f.id}
              onClick={() => { setFormulaId(f.id); setStep(2); }}
              className="rounded-xl p-4 text-left flex items-center gap-3 transition-all spring-press"
              style={{
                background: formulaId === f.id ? "rgba(74,94,58,0.06)" : "#fff",
                border: `1px solid ${formulaId === f.id ? "rgba(74,94,58,0.2)" : "rgba(0,0,0,0.06)"}`,
                animation: "lumoFadeUp 0.4s ease both",
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: f.color_acento }} />
              <div className="flex-1">
                <p className="font-inter text-sm font-medium" style={{ color: "#2D2D2D" }}>{f.nombre}</p>
                <p className="font-inter text-xs" style={{ color: "#8A8A7A" }}>${f.precio} por botella</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4" style={{ animation: "lumoFadeUp 0.4s ease both" }}>
          <div>
            <p className="font-inter text-xs mb-2" style={{ color: "#8A8A7A" }}>Cantidad de botellas</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-10 h-10 rounded-xl flex items-center justify-center spring-press"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <span style={{ color: "#2D2D2D", fontSize: "1.2rem" }}>−</span>
              </button>
              <span className="font-cormorant font-semibold text-2xl w-10 text-center" style={{ color: "#2D2D2D" }}>
                {cantidad}
              </span>
              <button
                onClick={() => setCantidad(cantidad + 1)}
                className="w-10 h-10 rounded-xl flex items-center justify-center spring-press"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <span style={{ color: "#2D2D2D", fontSize: "1.2rem" }}>+</span>
              </button>
            </div>
          </div>

          <div>
            <p className="font-inter text-xs mb-2" style={{ color: "#8A8A7A" }}>Día de entrega</p>
            <div className="flex flex-col gap-2">
              {deliveryDays.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDiaEntrega(d.value)}
                  className="rounded-xl px-4 py-3 text-left font-inter text-sm transition-all spring-press"
                  style={{
                    background: diaEntrega === d.value ? "rgba(74,94,58,0.08)" : "#fff",
                    border: `1px solid ${diaEntrega === d.value ? "rgba(74,94,58,0.2)" : "rgba(0,0,0,0.06)"}`,
                    color: "#2D2D2D",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: "rgba(184,134,11,0.06)" }}>
            <div className="flex items-center gap-2">
              <DropIcon size={14} color={ACCENT} />
              <span className="font-inter text-xs" style={{ color: "#8A8A7A" }}>Total</span>
            </div>
            <span className="font-inter text-sm font-semibold" style={{ color: alcanza ? "#2D2D2D" : ROJO }}>
              ${total.toLocaleString("es-MX")}
            </span>
          </div>

          {!alcanza && (
            <p className="font-inter text-xs text-center" style={{ color: ROJO }}>
              Balance insuficiente. Necesitas ${(total - balance).toLocaleString("es-MX")} más.
            </p>
          )}

          {error && (
            <p className="font-inter text-xs text-center" style={{ color: ROJO }}>{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 rounded-xl py-3 font-inter text-sm spring-press"
              style={{ background: "rgba(0,0,0,0.04)", color: "#8A8A7A" }}
            >
              Atrás
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || !diaEntrega || !alcanza}
              className="flex-1 rounded-xl py-3 font-inter text-sm font-medium transition-opacity disabled:opacity-40 spring-press"
              style={{ background: VERDE, color: CREAM }}
            >
              {saving ? "Enviando…" : "Confirmar"}
            </button>
          </div>
        </div>
      )}
    </ModalOverlay>
  );
}

/* ── Shared components ── */
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", animation: "lumoFadeIn 0.3s ease both" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        style={{ background: CREAM, boxShadow: "0 8px 40px rgba(0,0,0,0.12)", animation: "lumoSlideUp 0.4s var(--spring) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-1 spring-press" style={{ color: "#8A8A7A" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type PedidoGroup = {
  token: string;
  numeroPedido: number | null;
  estado: string;
  diaEntrega: string;
  lineas: { cantidad: number; formula: string; color: string }[];
  totalBotellas: number;
};

function groupByToken(pedidos: Pedido[]): PedidoGroup[] {
  const map = new Map<string, PedidoGroup>();
  for (const p of pedidos) {
    const key = p.token ?? p.id;
    const existing = map.get(key);
    if (existing) {
      existing.lineas.push({ cantidad: p.cantidad, formula: p.formulas?.nombre ?? "Fórmula", color: p.formulas?.color_acento ?? VERDE });
      existing.totalBotellas += p.cantidad;
      if (p.numero_pedido && !existing.numeroPedido) existing.numeroPedido = p.numero_pedido;
    } else {
      map.set(key, {
        token: p.token ?? p.id,
        numeroPedido: p.numero_pedido,
        estado: p.estado,
        diaEntrega: p.dia_entrega,
        lineas: [{ cantidad: p.cantidad, formula: p.formulas?.nombre ?? "Fórmula", color: p.formulas?.color_acento ?? VERDE }],
        totalBotellas: p.cantidad,
      });
    }
  }
  return Array.from(map.values());
}

function PedidoGroupCard({ group }: { group: PedidoGroup }) {
  const estadoColors: Record<string, string> = {
    pendiente: TROPICAL,
    confirmado: VERDE,
    preparado: "#6DBF67",
    entregado: "#6DBF67",
    cancelado: ROJO,
  };
  const estadoLabels: Record<string, string> = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    preparado: "Listo para entrega",
    entregado: "Entregado",
    cancelado: "Cancelado",
  };
  const isActive = group.estado === "pendiente" || group.estado === "confirmado" || group.estado === "preparado";
  const statusColor = estadoColors[group.estado] ?? "#888";

  return (
    <Link
      href={`/mi-pedido/${group.token}`}
      className="block rounded-2xl p-4 spring-press"
      style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="relative w-2.5 h-2.5">
              <div className="absolute inset-0 rounded-full" style={{ background: statusColor, animation: "accentPulse 2s ease infinite" }} />
              <div className="absolute inset-0 rounded-full" style={{ background: statusColor }} />
            </div>
          )}
          <span className="font-inter text-xs font-medium" style={{ color: statusColor }}>
            {estadoLabels[group.estado] ?? group.estado}
          </span>
        </div>
        {group.numeroPedido && (
          <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.04)", color: "#8A8A7A" }}>
            #{group.numeroPedido}
          </span>
        )}
      </div>

      {group.lineas.map((l, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
          <span className="font-inter text-sm" style={{ color: "#2D2D2D" }}>
            {l.cantidad}x {l.formula}
          </span>
        </div>
      ))}

      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
        <p className="font-inter text-xs" style={{ color: "#8A8A7A" }}>
          Entrega: {formatDate(group.diaEntrega)}
        </p>
        <span className="font-inter text-xs flex items-center gap-1" style={{ color: VERDE }}>
          Ver status
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
      <span className="font-inter text-xs" style={{ color: "#8A8A7A" }}>{label}</span>
      <span className="font-inter text-sm" style={{ color: "#2D2D2D" }}>{value}</span>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "rgba(74,94,58,0.04)" }}>
      <p className="font-cormorant font-semibold text-xl" style={{ color: "#2D2D2D" }}>{value}</p>
      <p className="font-inter text-xs" style={{ color: "#8A8A7A" }}>{label}</p>
    </div>
  );
}

/* ── Helpers ── */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function formatDate(dateStr: string): string {
  const label = new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getNextDeliveryDays(): { value: string; label: string }[] {
  const days: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 1; i <= 10 && days.length < 5; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dow = d.getDay();
    if (dow === 0) continue;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
    days.push({ value: iso, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return days;
}

/* ── Icons ── */
function DropIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function PlusIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WhatsAppIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function LeafIllustration() {
  return (
    <div className="mb-3">
      <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#C0C0B0" strokeWidth="1.2" strokeLinecap="round" className="mx-auto opacity-40">
        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
      </svg>
    </div>
  );
}
