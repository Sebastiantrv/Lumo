"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

type FormulaWithIngredients = Formula & {
  ingredientes: string[];
  descripcion: string;
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
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const FORMULA_DESCRIPTIONS: Record<string, string> = {
  "verde fresco": "Ligero, herbal y fresco.",
  "rojo vital": "Profundo, terroso y naturalmente dulce.",
  "tropical hydrate": "Brillante, jugoso e hidratante.",
};

/* ── Main page ── */
export default function MiLumoPage() {
  const [miembro, setMiembro] = useState<Miembro | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.style.backgroundColor = CREAM;
    document.body.style.backgroundColor = CREAM;
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("miembro_lumo");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const loginAt = parsed._loginAt ?? 0;
        if (Date.now() - loginAt > SESSION_MAX_AGE_MS) {
          localStorage.removeItem("miembro_lumo");
        } else {
          setMiembro(parsed);
        }
      } catch {
        localStorage.removeItem("miembro_lumo");
      }
    }
    setLoading(false);
  }, []);

  function handleLogin(m: Miembro) {
    const withTimestamp = { ...m, _loginAt: Date.now() };
    setMiembro(m);
    localStorage.setItem("miembro_lumo", JSON.stringify(withTimestamp));
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
  const [formulas, setFormulas] = useState<FormulaWithIngredients[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReserva, setShowReserva] = useState(false);
  const [showRecarga, setShowRecarga] = useState(false);
  const [tab, setTab] = useState<"historial" | "perfil">("historial");
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const PULL_THRESHOLD = 80;

  function onTouchStart(e: React.TouchEvent) {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!isPulling.current) return;
    const dist = Math.max(0, e.touches[0].clientY - touchStartY.current);
    setPullDistance(Math.min(dist * 0.5, 120));
  }
  async function onTouchEnd() {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      await load();
      setRefreshing(false);
    }
    setPullDistance(0);
  }

  const load = useCallback(async () => {
    // Verify member is still active
    const { data: check } = await supabase
      .from("clientes")
      .select("activo")
      .eq("id", miembro.id)
      .single();
    if (!check?.activo) {
      onLogout();
      return;
    }

    const [{ data: f }, { data: recetas }, { data: p }, { data: m }] = await Promise.all([
      supabase.from("formulas").select("id, nombre, slug, color_acento, precio").order("nombre"),
      supabase.from("recetas").select("formula_id, ingredientes(nombre)"),
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

    const formulasWithIng: FormulaWithIngredients[] = ((f ?? []) as unknown as Formula[]).map((formula) => {
      const recetasFormula = (recetas ?? []).filter((r: { formula_id: string }) => r.formula_id === formula.id);
      const ingredientes = recetasFormula
        .map((r: any) => r.ingredientes?.nombre ?? (Array.isArray(r.ingredientes) ? r.ingredientes[0]?.nombre : null))
        .filter(Boolean) as string[];
      const desc = FORMULA_DESCRIPTIONS[formula.nombre.toLowerCase()] ?? "Prensado en frío cada mañana.";
      return { ...formula, ingredientes, descripcion: desc };
    });

    setFormulas(formulasWithIng);
    setPedidos((p ?? []) as unknown as Pedido[]);
    setMovimientos((m ?? []) as unknown as Movimiento[]);
    setBalance((m ?? []).reduce((s: number, mov: { monto: number }) => s + mov.monto, 0));
    setLoading(false);
  }, [miembro.id, onLogout]);

  useEffect(() => { load(); }, [load]);

  const hoy = new Date().toISOString().split("T")[0];
  const hace3Dias = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];
  const pedidosVisibles = pedidos.filter((p) => p.estado !== "eliminado");
  const pedidosActivos = pedidosVisibles.filter(
    (p) => p.estado !== "cancelado" && !(p.estado === "entregado" && p.dia_entrega < hoy) && p.dia_entrega >= hoy
  );
  const pedidosRecientes = pedidosVisibles.filter(
    (p) => p.estado === "entregado" && p.dia_entrega < hoy && p.dia_entrega >= hace3Dias
  );
  const pedidosHistorial = pedidosVisibles.filter(
    (p) => p.dia_entrega < hace3Dias || (p.estado === "cancelado" && p.dia_entrega < hoy)
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

  const groupedActivos = groupByToken(pedidosActivos).sort((a, b) => a.diaEntrega.localeCompare(b.diaEntrega));

  // Reservation flow takes over the screen
  if (showReserva) {
    return (
      <ReservaFlow
        clienteId={miembro.id}
        formulas={formulas}
        balance={balance}
        onClose={() => setShowReserva(false)}
        onSuccess={() => { setShowReserva(false); load(); }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM }} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <MiLumoNavbar showLogout onLogout={onLogout} />

      {/* Pull-to-refresh indicator */}
      {(pullDistance > 0 || refreshing) && (
        <div className="flex justify-center overflow-hidden" style={{ height: refreshing ? 48 : pullDistance, transition: refreshing ? "none" : "height 0.1s ease" }}>
          <div className="flex items-center justify-center py-2">
            <div
              className="w-5 h-5 rounded-full border-2"
              style={{
                borderColor: `${VERDE}30`,
                borderTopColor: VERDE,
                animation: refreshing ? "lumoSpin 0.6s linear infinite" : "none",
                transform: refreshing ? "none" : `rotate(${pullDistance * 3}deg)`,
                opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
              }}
            />
          </div>
        </div>
      )}

      <main className="flex-1 pb-8 max-w-3xl mx-auto w-full">
        {/* ── Membership header ── */}
        <section className="px-5 pt-7 pb-5 relative" style={{ animation: "lumoFadeUp 0.6s ease both" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(74,94,58,0.03) 0%, transparent 60%)" }} />
          <div className="flex items-center gap-4 relative">
            <div
              className="w-[52px] h-[52px] rounded-full flex-shrink-0 flex items-center justify-center"
              style={{
                background: "rgba(74,94,58,0.06)",
                border: "1px solid rgba(74,94,58,0.1)",
                animation: "lumoScaleIn 0.5s var(--spring) both",
                animationDelay: "0.15s",
              }}
            >
              <span className="font-cormorant font-light text-[1.35rem]" style={{ color: VERDE }}>
                {miembro.nombre.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0" style={{ animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.2s" }}>
              <p className="font-inter text-[0.7rem] mb-0.5" style={{ color: "#9A9A8A", letterSpacing: "0.04em" }}>
                {greeting()}
              </p>
              <h1
                className="font-cormorant font-light truncate"
                style={{ fontSize: "1.65rem", color: "#1A1A1A", lineHeight: 1.2, letterSpacing: "-0.01em" }}
              >
                {miembro.nombre.split(" ")[0]}
              </h1>
              <p className="font-inter text-[0.65rem] mt-1 flex items-center gap-1.5 flex-wrap" style={{ color: "#B5B5A5" }}>
                <span className="tracking-[0.08em] px-2 py-0.5 rounded-full" style={{ background: "rgba(74,94,58,0.05)", color: VERDE, border: "1px solid rgba(74,94,58,0.08)", fontSize: "0.6rem" }}>
                  {miembro.codigo_miembro}
                </span>
                <span style={{ color: "#D0D0C0" }}>·</span>
                <span>Miembro desde {memberSince}</span>
              </p>
            </div>
          </div>
        </section>

        <div className="mx-8 mb-5 h-px" style={{ background: `linear-gradient(90deg, transparent, ${VERDE}15, transparent)` }} />

        {/* ── Balance card ── */}
        <div
          className="mx-5 mb-5 rounded-2xl overflow-hidden"
          style={{ background: "#fff", boxShadow: "0 1px 12px rgba(0,0,0,0.04)", animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.35s" }}
        >
          <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${VERDE}30, ${VERDE}60, ${VERDE}30)` }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <DropIcon size={14} color={VERDE} />
              <span className="font-inter text-[0.65rem] font-medium tracking-[0.14em] uppercase" style={{ color: "#8A8A7A" }}>
                Balance LUMO
              </span>
            </div>
            <div className="flex items-end justify-between mb-3">
              <span className="font-cormorant font-light" style={{ fontSize: "2.6rem", color: "#1A1A1A", lineHeight: 1 }}>
                ${balance.toLocaleString("es-MX")}
              </span>
              <button
                onClick={() => setShowRecarga(true)}
                className="font-inter text-xs px-4 py-2 rounded-full spring-press transition-all"
                style={{ background: "rgba(74,94,58,0.06)", color: VERDE, border: "1px solid rgba(74,94,58,0.1)" }}
              >
                Añadir balance
              </button>
            </div>
            <p className="font-inter text-[0.7rem]" style={{ color: "#A0A090" }}>
              {balance > 0
                ? "Disponible para tu próximo lote."
                : "Aún no tienes Balance LUMO."}
            </p>
          </div>
        </div>

        {/* ── Reservar mi LUMO — CTA principal ── */}
        <div className="mx-5 mb-7" style={{ animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.4s" }}>
          <button
            onClick={() => balance > 0 ? setShowReserva(true) : setShowRecarga(true)}
            className="w-full rounded-2xl py-5 flex flex-col items-center gap-2 spring-press transition-all"
            style={{ background: VERDE, color: CREAM }}
          >
            <span className="flex items-center gap-2.5 font-inter text-sm font-medium tracking-wide">
              <BottleIcon size={18} color={CREAM} />
              Reservar mi LUMO
            </span>
            <span className="font-inter text-[0.7rem] opacity-60">
              Reserva tu próxima mañana
            </span>
          </button>
        </div>

        {/* ── Active orders ── */}
        {groupedActivos.length > 0 && (
          <section className="mx-5 mb-7" style={{ animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.45s" }}>
            <h2 className="font-cormorant font-light text-lg mb-3" style={{ color: "#1A1A1A" }}>
              Próximas entregas
            </h2>
            <div className="flex flex-col gap-3">
              {groupedActivos.map((group) => (
                <PedidoGroupCard key={group.token} group={group} />
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {groupedActivos.length === 0 && (
          <div className="mx-5 mb-7 rounded-2xl p-7 text-center" style={{ background: "#fff", boxShadow: "0 1px 10px rgba(0,0,0,0.03)", animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.45s" }}>
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(74,94,58,0.05)" }}>
              <DropIcon size={18} color={`${VERDE}80`} />
            </div>
            <p className="font-cormorant font-light text-lg mb-1.5" style={{ color: "#1A1A1A" }}>
              {balance > 0 ? "Sin próximas entregas" : "Aún no tienes Balance LUMO"}
            </p>
            <p className="font-inter text-xs leading-relaxed" style={{ color: "#9A9A8A" }}>
              {balance > 0
                ? "Reserva tu próximo LUMO cuando quieras."
                : "Añade balance o reserva directamente tu próxima mañana."}
            </p>
          </div>
        )}

        {/* ── Recent deliveries ── */}
        {pedidosRecientes.length > 0 && (
          <section className="mx-5 mb-7" style={{ animation: "lumoFadeUp 0.5s ease both", animationDelay: "0.55s" }}>
            <h2 className="font-cormorant font-light text-lg mb-3" style={{ color: "#1A1A1A" }}>
              Entregas recientes
            </h2>
            <div className="flex flex-col gap-2.5">
              {pedidosRecientes.map((p) => (
                <Link
                  key={p.id}
                  href={p.token ? `/mi-pedido/${p.token}` : "#"}
                  className="rounded-2xl p-4 spring-press block"
                  style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.formulas?.color_acento ?? VERDE }} />
                    <span className="font-inter text-sm flex-1" style={{ color: "#2D2D2D" }}>
                      {p.cantidad}x {p.formulas?.nombre ?? "Fórmula"}
                    </span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.numero_pedido && <span className="font-inter text-xs" style={{ color: "#C0C0B0" }}>#{p.numero_pedido}</span>}
                      <span className="font-inter text-xs" style={{ color: "#C0C0B0" }}>
                        {formatDateShort(p.dia_entrega)}
                      </span>
                    </div>
                  </div>
                  {p.token && (
                    <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                      <span className="font-inter text-xs" style={{ color: "#6DBF67" }}>Entregado</span>
                      <span className="font-inter text-xs flex items-center gap-1" style={{ color: VERDE }}>
                        Cuéntanos tu experiencia
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Tabs ── */}
        <div className="mx-5 mb-4 flex gap-1 rounded-xl p-1" style={{ background: "rgba(74,94,58,0.04)" }}>
          {(["historial", "perfil"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 rounded-lg py-2.5 font-inter text-xs font-medium transition-all duration-200"
              style={{
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#1A1A1A" : "#9A9A8A",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {t === "historial" ? "Historial" : "Mi perfil"}
            </button>
          ))}
        </div>

        <div style={{ animation: "lumoFadeIn 0.3s ease both" }} key={tab}>
          {tab === "historial" && (
            <HistorialTab pedidos={pedidosHistorial} movimientos={movimientos} />
          )}

          {tab === "perfil" && (
            <PerfilTab miembro={miembro} pedidos={pedidos} onLogout={onLogout} />
          )}
        </div>
      </main>

      <MiLumoFooter />

      {/* Recarga placeholder modal */}
      {showRecarga && (
        <RecargaPlaceholder onClose={() => setShowRecarga(false)} />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   RESERVA FLOW — Full-screen 3-step experience
   Supports multiple formulas for the same day
   ══════════════════════════════════════════════ */
type ReservaLinea = { formulaId: string; cantidad: number };

function ReservaFlow({
  clienteId,
  formulas,
  balance,
  onClose,
  onSuccess,
}: {
  clienteId: string;
  formulas: FormulaWithIngredients[];
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [lineas, setLineas] = useState<ReservaLinea[]>([]);
  const [diaEntrega, setDiaEntrega] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showRecarga, setShowRecarga] = useState(false);
  const [capacidadDiaria, setCapacidadDiaria] = useState<number | null>(null);
  const [pedidosPorDia, setPedidosPorDia] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const { data: conf } = await supabase.from("configuracion").select("valor").eq("clave", "capacidad_diaria").single();
      if (conf?.valor) setCapacidadDiaria(parseInt(conf.valor));

      const deliveryDays = getNextDeliveryDays();
      if (deliveryDays.length > 0) {
        const { data: peds } = await supabase
          .from("pedidos")
          .select("dia_entrega, cantidad")
          .in("dia_entrega", deliveryDays.map((d) => d.value))
          .neq("estado", "cancelado");
        const counts: Record<string, number> = {};
        for (const p of peds ?? []) counts[p.dia_entrega] = (counts[p.dia_entrega] ?? 0) + p.cantidad;
        setPedidosPorDia(counts);
      }
    })();
  }, []);

  const total = lineas.reduce((s, l) => {
    const f = formulas.find((f) => f.id === l.formulaId);
    return s + (f?.precio ?? 0) * l.cantidad;
  }, 0);
  const alcanza = balance >= total;
  const deliveryDays = getNextDeliveryDays();
  const totalBotellas = lineas.reduce((s, l) => s + l.cantidad, 0);

  function addFormula(formulaId: string) {
    const existing = lineas.find((l) => l.formulaId === formulaId);
    if (existing) {
      setLineas(lineas.map((l) => l.formulaId === formulaId ? { ...l, cantidad: l.cantidad + 1 } : l));
    } else {
      setLineas([...lineas, { formulaId, cantidad: 1 }]);
    }
  }

  function removeFormula(formulaId: string) {
    const existing = lineas.find((l) => l.formulaId === formulaId);
    if (!existing) return;
    if (existing.cantidad <= 1) {
      setLineas(lineas.filter((l) => l.formulaId !== formulaId));
    } else {
      setLineas(lineas.map((l) => l.formulaId === formulaId ? { ...l, cantidad: l.cantidad - 1 } : l));
    }
  }

  function getAvailability(day: string): "disponible" | "pocos" | "completo" {
    if (!capacidadDiaria) return "disponible";
    const used = pedidosPorDia[day] ?? 0;
    const remaining = capacidadDiaria - used;
    if (remaining <= 0) return "completo";
    if (remaining <= Math.ceil(capacidadDiaria * 0.25)) return "pocos";
    return "disponible";
  }

  async function handleConfirm() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/mi-lumo/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          dia_entrega: diaEntrega,
          lineas: lineas.map((l) => ({ formula_id: l.formulaId, cantidad: l.cantidad })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("Balance insuficiente")) {
          setError("Tu Balance LUMO no es suficiente para confirmar esta reserva.");
        } else if (data.error?.includes("llenarse") || data.error?.includes("quedan")) {
          setError(data.error);
        } else {
          setError(data.error || "Error al confirmar la reserva");
        }
        setSaving(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Error de conexión");
      setSaving(false);
    }
  }

  const stepLabels = ["Elige tus fórmulas", "Elige tu mañana", "Confirmar reserva"];

  if (success) {
    const newBalance = balance - total;
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: CREAM, overscrollBehavior: "none" }}>
        {/* Botanical background with cream fade */}
        <div className="absolute inset-0 pointer-events-none" style={{ animation: "lumoFadeUp 1.5s ease 0.1s both" }}>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/lumo_confirmation_plant_shadow_background.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.06,
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, ${CREAM}00 0%, ${CREAM}88 45%, ${CREAM}dd 70%, ${CREAM} 100%)`,
            }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
          <div style={{ animation: "lumoFadeUp 0.8s ease both" }} className="text-center max-w-sm md:max-w-md">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{
                background: `${VERDE}0A`,
                border: `1px solid ${VERDE}15`,
                animation: "lumoScaleIn 0.6s var(--spring) both",
              }}
            >
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={VERDE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 20, strokeDashoffset: 20, animation: "checkStroke 0.6s ease 0.3s forwards" }} />
              </svg>
            </div>

            <h2
              className="font-cormorant font-light text-2xl mb-1.5"
              style={{ color: "#1A1A1A", animation: "lumoFadeUp 0.6s ease 0.4s both" }}
            >
              Tu LUMO está reservado
            </h2>
            <p
              className="font-inter text-[0.8rem] mb-6"
              style={{ color: "#8A8A7A", animation: "lumoFadeUp 0.6s ease 0.5s both" }}
            >
              Lo prepararemos la mañana de tu entrega.
            </p>

            <div
              className="rounded-2xl overflow-hidden text-left mb-6"
              style={{
                background: "#fff",
                boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
                border: "1px solid rgba(74,94,58,0.08)",
                animation: "lumoFadeUp 0.6s ease 0.6s both",
              }}
            >
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${VERDE}30, ${VERDE}60, ${VERDE}30)` }} />
              <div className="p-5">
                {lineas.map((linea) => {
                  const f = formulas.find((fo) => fo.id === linea.formulaId);
                  return (
                    <div key={linea.formulaId} className="flex items-center gap-3 mb-2 last:mb-0">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: f?.color_acento ?? VERDE }} />
                      <span className="font-cormorant font-light text-lg" style={{ color: "#1A1A1A" }}>
                        {linea.cantidad}x {f?.nombre}
                      </span>
                    </div>
                  );
                })}
                <div className="h-px my-3" style={{ background: "rgba(0,0,0,0.04)" }} />
                <p className="font-inter text-[0.8rem] flex items-center gap-1.5" style={{ color: "#6B6B5E" }}>
                  <CalendarIcon size={13} color="#9A9A8A" />
                  {formatDate(diaEntrega)}
                </p>
              </div>
            </div>

            <div
              className="flex items-center justify-center gap-2 mb-8"
              style={{ animation: "lumoFadeUp 0.6s ease 0.7s both" }}
            >
              <DropIcon size={13} color={VERDE} />
              <span className="font-inter text-[0.8rem]" style={{ color: "#8A8A7A" }}>
                Balance: <span style={{ color: "#B0B0A0", textDecoration: "line-through" }}>${balance.toLocaleString("es-MX")}</span>
                {" → "}
                <span className="font-medium" style={{ color: "#1A1A1A" }}>${newBalance.toLocaleString("es-MX")}</span>
              </span>
            </div>

            <button
              onClick={onSuccess}
              className="w-full rounded-2xl py-3.5 font-inter text-sm font-medium spring-press"
              style={{ background: VERDE, color: CREAM, animation: "lumoFadeUp 0.6s ease 0.8s both" }}
            >
              Volver a Mi LUMO
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CREAM, overscrollBehavior: "none" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-40 px-5 py-3.5 flex items-center justify-between" style={{ background: "rgba(244,239,231,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
        <button onClick={step === 1 ? onClose : () => setStep((step - 1) as 1 | 2)} className="font-inter text-[0.8rem] spring-press flex items-center gap-1.5" style={{ color: "#9A9A8A" }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          {step === 1 ? "Mi LUMO" : "Atrás"}
        </button>
        <span className="font-inter text-[0.65rem] tracking-[0.08em] uppercase" style={{ color: "#B5B5A5" }}>
          Paso {step} de 3
        </span>
      </div>

      <div className="max-w-2xl mx-auto w-full">
      {/* Step indicator */}
      <div className="px-5 pt-5 pb-2">
        <div className="flex gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 h-[2px] rounded-full transition-all duration-300" style={{ background: s <= step ? VERDE : `${VERDE}15` }} />
          ))}
        </div>
        <h2
          className="font-cormorant font-light text-[1.4rem]"
          style={{ color: "#1A1A1A", letterSpacing: "-0.01em", animation: "lumoFadeUp 0.4s ease both" }}
          key={`step-title-${step}`}
        >
          {stepLabels[step - 1]}
        </h2>
      </div>

      {/* Step content */}
      <div className="flex-1 px-5 pb-8">
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4" style={{ animation: "lumoFadeUp 0.4s ease both" }}>
            {formulas.map((f, i) => {
              const lineaCant = lineas.find((l) => l.formulaId === f.id)?.cantidad ?? 0;
              return (
                <FormulaCard
                  key={f.id}
                  formula={f}
                  cantidad={lineaCant}
                  delay={i * 0.06}
                  onAdd={() => addFormula(f.id)}
                  onRemove={() => removeFormula(f.id)}
                />
              );
            })}

            {lineas.length > 0 && (
              <div className="md:col-span-2 lg:col-span-3" style={{ animation: "lumoFadeUp 0.3s ease both" }}>
                <div className="rounded-xl p-3.5 mb-3 flex items-center justify-between" style={{ background: "#fff", border: `1px solid ${VERDE}12`, boxShadow: "0 1px 6px rgba(0,0,0,0.03)" }}>
                  <span className="font-inter text-[0.75rem]" style={{ color: "#8A8A7A" }}>
                    {lineas.length} {lineas.length === 1 ? "fórmula" : "fórmulas"} · {totalBotellas} {totalBotellas === 1 ? "botella" : "botellas"}
                  </span>
                  <span className="font-cormorant font-light text-lg" style={{ color: "#1A1A1A" }}>
                    ${total.toLocaleString("es-MX")}
                  </span>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full rounded-2xl py-3.5 font-inter text-sm font-medium spring-press"
                  style={{ background: VERDE, color: CREAM }}
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 pt-4" style={{ animation: "lumoFadeUp 0.4s ease both" }}>
            <p className="font-inter text-[0.75rem]" style={{ color: "#9A9A8A" }}>
              Cada lote se prepara temprano y con cupo limitado.
            </p>

            {/* Selected formulas summary */}
            <div className="rounded-xl p-3 flex flex-wrap gap-2" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.04)" }}>
              {lineas.map((l) => {
                const f = formulas.find((fo) => fo.id === l.formulaId);
                return (
                  <span key={l.formulaId} className="flex items-center gap-1.5 font-inter text-[0.75rem] px-2.5 py-1 rounded-full" style={{ background: `${f?.color_acento ?? VERDE}08`, color: "#2D2D2D" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: f?.color_acento ?? VERDE }} />
                    {l.cantidad}x {f?.nombre}
                  </span>
                );
              })}
            </div>

            {/* Dates */}
            <div className="flex flex-col gap-2.5">
              {deliveryDays.map((d, i) => {
                const avail = getAvailability(d.value);
                const isCompleto = avail === "completo";
                const isSelected = diaEntrega === d.value;
                return (
                  <button
                    key={d.value}
                    onClick={() => !isCompleto && setDiaEntrega(d.value)}
                    disabled={isCompleto}
                    className="rounded-2xl p-4 text-left flex items-center justify-between transition-all duration-200 spring-press disabled:opacity-40 relative overflow-hidden"
                    style={{
                      background: "#fff",
                      border: `1px solid ${isSelected ? `${VERDE}40` : "rgba(0,0,0,0.04)"}`,
                      boxShadow: isSelected ? `0 4px 20px ${VERDE}10` : "0 1px 4px rgba(0,0,0,0.02)",
                      animation: "lumoFadeUp 0.3s ease both",
                      animationDelay: `${i * 0.04}s`,
                    }}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full" style={{ background: VERDE, animation: "lumoFadeUp 0.2s ease both" }} />
                    )}
                    <div className={isSelected ? "pl-2" : ""} style={{ transition: "padding 0.2s ease" }}>
                      <p className="font-cormorant font-light text-[1.1rem]" style={{ color: isCompleto ? "#B0B0A0" : "#1A1A1A" }}>
                        {d.dayLabel}
                      </p>
                      <p className="font-inter text-[0.7rem] flex items-center gap-1 mt-0.5" style={{ color: "#9A9A8A" }}>
                        <ClockIcon size={11} color="#9A9A8A" /> {d.fullLabel}
                      </p>
                    </div>
                    <span
                      className="font-inter text-[0.65rem] px-2.5 py-1 rounded-full"
                      style={{
                        background: isCompleto ? "rgba(122,32,48,0.06)" : avail === "pocos" ? "rgba(184,134,11,0.06)" : `${VERDE}08`,
                        color: isCompleto ? ROJO : avail === "pocos" ? TROPICAL : VERDE,
                      }}
                    >
                      {isCompleto ? "Completo" : avail === "pocos" ? "Últimos lugares" : "Disponible"}
                    </span>
                  </button>
                );
              })}
            </div>

            {diaEntrega && (
              <button
                onClick={() => setStep(3)}
                className="w-full rounded-2xl py-3.5 font-inter text-sm font-medium spring-press mt-2"
                style={{ background: VERDE, color: CREAM, animation: "lumoFadeUp 0.3s ease both" }}
              >
                Continuar
              </button>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5 pt-4" style={{ animation: "lumoFadeUp 0.4s ease both" }}>
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{ background: "#fff", boxShadow: "0 2px 16px rgba(0,0,0,0.04)", border: "1px solid rgba(74,94,58,0.08)" }}
            >
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${VERDE}30, ${VERDE}60, ${VERDE}30)` }} />
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none" style={{ background: VERDE, opacity: 0.03, transform: "translate(30%, -30%)", filter: "blur(20px)" }} />

              <div className="p-5">
                <p className="font-inter text-[0.6rem] tracking-[0.14em] uppercase mb-4" style={{ color: "#9A9A8A" }}>Tu reserva</p>

                {lineas.map((linea) => {
                  const f = formulas.find((fo) => fo.id === linea.formulaId);
                  return (
                    <div key={linea.formulaId} className="flex items-center gap-3 mb-3 last:mb-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${f?.color_acento ?? VERDE}08` }}>
                        <BottleIcon size={18} color={f?.color_acento ?? VERDE} />
                      </div>
                      <div>
                        <p className="font-cormorant font-light text-[1.1rem]" style={{ color: "#1A1A1A" }}>
                          {f?.nombre}
                        </p>
                        <p className="font-inter text-[0.7rem]" style={{ color: "#9A9A8A" }}>
                          {linea.cantidad} {linea.cantidad === 1 ? "botella" : "botellas"}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div className="h-px my-4" style={{ background: "rgba(0,0,0,0.04)" }} />

                <div className="flex items-center gap-2 mb-4">
                  <CalendarIcon size={13} color="#9A9A8A" />
                  <span className="font-inter text-[0.8rem]" style={{ color: "#1A1A1A" }}>
                    {formatDate(diaEntrega)}
                  </span>
                </div>

                <div className="rounded-xl p-3.5" style={{ background: `${VERDE}06` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DropIcon size={13} color={VERDE} />
                      <span className="font-inter text-[0.7rem]" style={{ color: "#8A8A7A" }}>Balance LUMO</span>
                    </div>
                    <div className="text-right">
                      <span className="font-inter text-[0.8rem]" style={{ color: "#B0B0A0", textDecoration: "line-through" }}>
                        ${balance.toLocaleString("es-MX")}
                      </span>
                      <span className="font-inter text-[0.8rem] font-medium ml-2" style={{ color: alcanza ? "#1A1A1A" : ROJO }}>
                        ${(balance - total).toLocaleString("es-MX")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!alcanza && (
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(122,32,48,0.03)", border: "1px solid rgba(122,32,48,0.08)" }}>
                <p className="font-inter text-[0.8rem] mb-3" style={{ color: ROJO }}>
                  Tu Balance LUMO no es suficiente para confirmar esta reserva.
                </p>
                <button
                  onClick={() => setShowRecarga(true)}
                  className="font-inter text-[0.8rem] font-medium spring-press px-5 py-2 rounded-xl"
                  style={{ background: `${VERDE}08`, color: VERDE, border: `1px solid ${VERDE}15` }}
                >
                  Añadir balance
                </button>
              </div>
            )}

            {error && (
              <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(122,32,48,0.03)", border: "1px solid rgba(122,32,48,0.08)", animation: "lumoShake 0.4s ease" }}>
                <p className="font-inter text-[0.8rem] mb-2" style={{ color: ROJO }}>{error}</p>
                {(error.includes("llenarse") || error.includes("quedan")) && (
                  <button
                    onClick={() => { setError(""); setDiaEntrega(""); setStep(2); }}
                    className="font-inter text-[0.75rem] font-medium spring-press px-4 py-1.5 rounded-xl"
                    style={{ background: `${VERDE}08`, color: VERDE, border: `1px solid ${VERDE}15` }}
                  >
                    Elegir otra fecha
                  </button>
                )}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={saving || !alcanza}
              className="w-full rounded-2xl py-4 font-inter text-sm font-medium spring-press disabled:opacity-40 transition-all"
              style={{ background: VERDE, color: CREAM }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white" style={{ animation: "lumoSpin 0.6s linear infinite" }} />
                  Confirmando…
                </span>
              ) : `Confirmar reserva · $${total.toLocaleString("es-MX")}`}
            </button>

            <p className="font-inter text-[0.7rem] text-center" style={{ color: "#B5B5A5" }}>
              Lo preparamos la mañana de tu entrega.
            </p>
          </div>
        )}
      </div>

      </div>
      {showRecarga && <RecargaPlaceholder onClose={() => setShowRecarga(false)} />}
    </div>
  );
}

/* ── Formula card (premium editorial, multi-select) ── */
const BOTTLE_IMAGES: Record<string, string> = {
  "verde-fresco": "/bottle-verde.png",
  "rojo-vital": "/bottle-rojo.png",
  "tropical-hydrate": "/bottle-tropical.png",
};

function getBottleImage(slug: string): string | null {
  if (BOTTLE_IMAGES[slug]) return BOTTLE_IMAGES[slug];
  for (const [key, val] of Object.entries(BOTTLE_IMAGES)) {
    if (slug.includes(key.split("-")[0])) return val;
  }
  return null;
}

function FormulaCard({ formula, cantidad, delay, onAdd, onRemove }: {
  formula: FormulaWithIngredients;
  cantidad: number;
  delay: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const color = formula.color_acento;
  const selected = cantidad > 0;
  const bottleImg = getBottleImage(formula.slug);
  return (
    <div
      className="rounded-2xl text-left relative overflow-hidden transition-all duration-200"
      style={{
        background: "#fff",
        border: `1px solid ${selected ? `${color}30` : "rgba(0,0,0,0.04)"}`,
        boxShadow: selected ? `0 2px 16px ${color}08` : "0 1px 4px rgba(0,0,0,0.02)",
        animation: "lumoFadeUp 0.45s ease both",
        animationDelay: `${delay}s`,
      }}
    >
      {/* Top accent line */}
      <div className="h-[2px] transition-all duration-200" style={{ background: selected ? `linear-gradient(90deg, ${color}40, ${color}80, ${color}40)` : `linear-gradient(90deg, ${color}10, ${color}20, ${color}10)` }} />

      <div className="p-4 relative">
        {/* Color accent — subtle halo top-right */}
        <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none" style={{ background: color, opacity: 0.04, transform: "translate(30%, -40%)", filter: "blur(16px)" }} />

        <div className="relative z-10 flex gap-3">
          {/* Bottle image */}
          {bottleImg && (
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 56 }}>
              <img
                src={bottleImg}
                alt={formula.nombre}
                className="object-contain drop-shadow-sm"
                style={{ height: 80, width: "auto", opacity: 0.92 }}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <h3 className="font-cormorant font-light text-[1.15rem] truncate" style={{ color: "#1A1A1A" }}>
                {formula.nombre}
              </h3>
            </div>

            {formula.ingredientes.length > 0 && (
              <p className="font-inter text-[0.7rem] mb-1.5" style={{ color: "#9A9A8A" }}>
                {formula.ingredientes.join(" · ")}
              </p>
            )}

            <p className="font-inter text-[0.7rem] italic mb-2.5" style={{ color: "#B0B0A0" }}>
              {formula.descripcion}
            </p>

            <div className="flex items-center justify-between">
              <span className="font-inter text-[0.7rem]" style={{ color: "#9A9A8A" }}>
                ${formula.precio} por botella
              </span>

              {selected ? (
                <div className="flex items-center gap-2">
                  <button onClick={onRemove} className="w-8 h-8 rounded-xl flex items-center justify-center spring-press" style={{ background: `${color}06`, border: `1px solid ${color}12` }}>
                    <span style={{ color, fontSize: "1.1rem" }}>−</span>
                  </button>
                  <span className="font-cormorant font-light text-lg w-6 text-center" style={{ color: "#1A1A1A" }}>{cantidad}</span>
                  <button onClick={onAdd} className="w-8 h-8 rounded-xl flex items-center justify-center spring-press" style={{ background: `${color}06`, border: `1px solid ${color}12` }}>
                    <span style={{ color, fontSize: "1.1rem" }}>+</span>
                  </button>
                </div>
              ) : (
                <button onClick={onAdd} className="font-inter text-[0.7rem] px-3.5 py-1.5 rounded-full spring-press" style={{ background: `${color}06`, color, border: `1px solid ${color}12` }}>
                  Agregar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: color }}>
          <svg width={10} height={10} viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
            <path d="M2 6L5 9L10 3" />
          </svg>
        </div>
      )}
    </div>
  );
}

/* ── Recarga placeholder modal ── */
function RecargaPlaceholder({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="text-center mb-5">
        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `${VERDE}10` }}>
          <DropIcon size={22} color={VERDE} />
        </div>
        <h2 className="font-cormorant font-light text-xl mb-1" style={{ color: "#2D2D2D" }}>
          Añadir Balance LUMO
        </h2>
        <p className="font-inter text-xs" style={{ color: "#8A8A7A" }}>
          Próximamente podrás añadir balance desde aquí.
        </p>
      </div>

      <div className="flex flex-col gap-2 mb-5">
        {[
          { amount: 300, label: "$300" },
          { amount: 600, label: "$600" },
          { amount: 1200, label: "$1,200" },
        ].map(({ amount, label }) => (
          <div
            key={amount}
            className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: `${VERDE}06`, border: `1px solid ${VERDE}12`, opacity: 0.6 }}
          >
            <span className="font-cormorant font-semibold text-lg" style={{ color: "#2D2D2D" }}>{label}</span>
            <span className="font-inter text-xs px-3 py-1 rounded-full" style={{ background: `${VERDE}10`, color: VERDE }}>
              Próximamente
            </span>
          </div>
        ))}
      </div>

      <p className="font-inter text-xs text-center mb-4" style={{ color: "#A0A090" }}>
        Mientras tanto, contáctanos por WhatsApp para añadir balance.
      </p>
      <a
        href={`https://wa.me/${LUMO_WHATSAPP}?text=${encodeURIComponent("Hola LUMO 🍃 Me gustaría añadir balance a mi cuenta.")}`}
        target="_blank"
        rel="noopener"
        className="flex items-center justify-center gap-2 w-full rounded-xl py-3 font-inter text-sm spring-press"
        style={{ background: "rgba(37,211,102,0.08)", color: "#25D366", border: "1px solid rgba(37,211,102,0.15)" }}
      >
        <WhatsAppIcon size={16} />
        Añadir balance por WhatsApp
      </a>
    </ModalOverlay>
  );
}

/* ── Navbar ── */
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
              <button onClick={() => { onLogout(); closeMenu(); }} className="font-inter text-sm spring-press" style={{ color: "#8A8A8A" }}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ── Footer ── */
function MiLumoFooter() {
  return (
    <footer className="px-5 py-6 text-center" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
      <span className="font-cormorant text-sm tracking-[0.3em]" style={{ color: "#C0C0B0" }}>L U M O</span>
      <p className="font-inter text-xs mt-1" style={{ color: "#C0C0B0" }}>Prensados en frío · Lotes limitados</p>
    </footer>
  );
}

/* ── Historial tab ── */
function HistorialTab({ pedidos, movimientos }: { pedidos: Pedido[]; movimientos: Movimiento[] }) {
  const [section, setSection] = useState<"entregas" | "balance">("entregas");

  const hasPedidos = pedidos.length > 0;
  const hasMovimientos = movimientos.length > 0;

  if (!hasPedidos && !hasMovimientos) {
    return (
      <div className="mx-5 rounded-2xl p-6 text-center" style={{ background: "#fff" }}>
        <p className="font-inter text-sm" style={{ color: "#8A8A7A" }}>Aún no hay actividad.</p>
      </div>
    );
  }

  const estadoLabel: Record<string, string> = { pendiente: "Pendiente", confirmado: "Confirmado", preparado: "Preparado", entregado: "Entregado", cancelado: "Cancelado" };

  return (
    <section className="mx-5">
      {/* Section toggle */}
      <div className="flex gap-1 rounded-xl p-1 mb-4" style={{ background: "rgba(74,94,58,0.04)" }}>
        <button
          onClick={() => setSection("entregas")}
          className="flex-1 rounded-lg py-2 font-inter text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          style={{
            background: section === "entregas" ? "#fff" : "transparent",
            color: section === "entregas" ? "#2D2D2D" : "#8A8A7A",
            boxShadow: section === "entregas" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
          }}
        >
          <BottleIcon size={12} color={section === "entregas" ? VERDE : "#8A8A7A"} />
          Entregas
        </button>
        <button
          onClick={() => setSection("balance")}
          className="flex-1 rounded-lg py-2 font-inter text-xs font-medium transition-all flex items-center justify-center gap-1.5"
          style={{
            background: section === "balance" ? "#fff" : "transparent",
            color: section === "balance" ? "#2D2D2D" : "#8A8A7A",
            boxShadow: section === "balance" ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
          }}
        >
          <DropIcon size={12} color={section === "balance" ? ACCENT : "#8A8A7A"} />
          Balance
        </button>
      </div>

      <div className="flex flex-col gap-2" style={{ animation: "lumoFadeIn 0.25s ease both" }} key={section}>
        {section === "entregas" && (
          pedidos.length === 0 ? (
            <div className="rounded-xl p-4 text-center" style={{ background: "#fff" }}>
              <p className="font-inter text-sm" style={{ color: "#8A8A7A" }}>Aún no hay entregas.</p>
            </div>
          ) : pedidos.slice(0, 30).map((p) => (
            <Link key={p.id} href={p.token ? `/mi-pedido/${p.token}` : "#"} className="rounded-xl p-3.5 spring-press block" style={{ background: "#fff" }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.formulas?.color_acento ?? VERDE }} />
                <div className="flex-1 min-w-0">
                  <p className="font-inter text-sm truncate" style={{ color: "#2D2D2D" }}>{p.cantidad}x {p.formulas?.nombre ?? "Fórmula"}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {p.numero_pedido && <span className="font-inter text-xs" style={{ color: "#C0C0B0" }}>#{p.numero_pedido}</span>}
                  <span className="font-inter text-xs" style={{ color: "#8A8A7A" }}>{formatDateShort(p.dia_entrega)}</span>
                </div>
              </div>
              {p.estado === "entregado" && p.token && (
                <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                  <span className="font-inter text-xs" style={{ color: "#6DBF67" }}>Entregado</span>
                  <span className="font-inter text-xs flex items-center gap-1" style={{ color: VERDE }}>
                    Cuéntanos tu experiencia
                    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </span>
                </div>
              )}
              {p.estado === "cancelado" && (
                <div className="mt-2.5 pt-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                  <span className="font-inter text-xs" style={{ color: ROJO }}>Cancelado</span>
                </div>
              )}
            </Link>
          ))
        )}

        {section === "balance" && (
          movimientos.length === 0 ? (
            <div className="rounded-xl p-4 text-center" style={{ background: "#fff" }}>
              <p className="font-inter text-sm" style={{ color: "#8A8A7A" }}>Sin movimientos aún.</p>
            </div>
          ) : movimientos.slice(0, 30).map((m) => (
            <div key={m.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#fff" }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: m.monto > 0 ? "rgba(109,191,103,0.1)" : "rgba(0,0,0,0.04)" }}>
                <span className="font-inter text-xs" style={{ color: m.monto > 0 ? "#6DBF67" : "#8A8A7A" }}>{m.monto > 0 ? "↑" : "↓"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-inter text-sm truncate" style={{ color: "#2D2D2D" }}>{m.descripcion}</p>
                <p className="font-inter text-xs" style={{ color: "#8A8A7A" }}>{formatDateTime(m.created_at)}</p>
              </div>
              <span className="font-inter text-sm font-medium flex-shrink-0" style={{ color: m.monto > 0 ? "#6DBF67" : "#8A8A7A" }}>
                {m.monto > 0 ? "+" : ""}${Math.abs(m.monto).toLocaleString("es-MX")}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

/* ── Perfil tab ── */
function PerfilTab({ miembro, pedidos, onLogout }: { miembro: Miembro; pedidos: Pedido[]; onLogout: () => void }) {
  const totalEntregas = pedidos.filter((p) => p.estado === "entregado").length;
  const totalBotellas = pedidos.filter((p) => p.estado === "entregado").reduce((s, p) => s + p.cantidad, 0);

  const formulaCounts = new Map<string, { nombre: string; color: string; count: number }>();
  for (const p of pedidos.filter((p) => p.estado === "entregado")) {
    const existing = formulaCounts.get(p.formula_id);
    if (existing) existing.count += p.cantidad;
    else formulaCounts.set(p.formula_id, { nombre: p.formulas?.nombre ?? "—", color: p.formulas?.color_acento ?? VERDE, count: p.cantidad });
  }
  const favorita = Array.from(formulaCounts.values()).sort((a, b) => b.count - a.count)[0];

  const cambioMsg = encodeURIComponent(`Hola LUMO 🍃 Soy ${miembro.nombre} (${miembro.codigo_miembro}). Me gustaría actualizar mis datos de miembro.`);

  return (
    <section className="mx-5 flex flex-col gap-4">
      <div className="rounded-2xl p-5" style={{ background: "#fff" }}>
        <h3 className="font-cormorant font-semibold text-base mb-3" style={{ color: "#2D2D2D" }}>Mi información</h3>
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
        <h3 className="font-cormorant font-semibold text-base mb-3" style={{ color: "#2D2D2D" }}>Mi actividad</h3>
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

/* ── Shared ── */
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
  const estadoColors: Record<string, string> = { pendiente: TROPICAL, confirmado: VERDE, preparado: "#6DBF67", entregado: "#6DBF67", cancelado: ROJO };
  const estadoLabels: Record<string, string> = { pendiente: "Pendiente", confirmado: "Confirmado", preparado: "Listo para entrega", entregado: "Entregado", cancelado: "Cancelado" };
  const isActive = group.estado === "pendiente" || group.estado === "confirmado" || group.estado === "preparado";
  const statusColor = estadoColors[group.estado] ?? "#888";

  return (
    <Link href={`/mi-pedido/${group.token}`} className="block rounded-2xl p-4 spring-press" style={{ background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="relative w-2.5 h-2.5">
              <div className="absolute inset-0 rounded-full" style={{ background: statusColor, animation: "accentPulse 2s ease infinite" }} />
              <div className="absolute inset-0 rounded-full" style={{ background: statusColor }} />
            </div>
          )}
          <span className="font-inter text-xs font-medium" style={{ color: statusColor }}>{estadoLabels[group.estado] ?? group.estado}</span>
        </div>
        {group.numeroPedido && (
          <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.04)", color: "#8A8A7A" }}>#{group.numeroPedido}</span>
        )}
      </div>
      {group.lineas.map((l, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
          <span className="font-inter text-sm" style={{ color: "#2D2D2D" }}>{l.cantidad}x {l.formula}</span>
        </div>
      ))}
      <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
        <p className="font-inter text-xs" style={{ color: "#8A8A7A" }}>Entrega: {formatDate(group.diaEntrega)}</p>
        <span className="font-inter text-xs flex items-center gap-1" style={{ color: VERDE }}>
          Ver status <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
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
  const label = new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

function getNextDeliveryDays(): { value: string; dayLabel: string; fullLabel: string }[] {
  const days: { value: string; dayLabel: string; fullLabel: string }[] = [];
  const now = new Date();
  for (let i = 1; i <= 10 && days.length < 5; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dow = d.getDay();
    if (dow === 0) continue;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayName = d.toLocaleDateString("es-MX", { weekday: "long" });
    const dayLabel = dayName.charAt(0).toUpperCase() + dayName.slice(1) + " " + d.getDate();
    const fullLabel = d.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
    days.push({ value: iso, dayLabel, fullLabel });
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

function BottleIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2h4v3l2 3v12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V8l2-3V2z" />
      <path d="M10 2h4" />
      <path d="M8 8h8" />
    </svg>
  );
}

function LeafIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function CalendarIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ClockIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" style={{ display: "inline", verticalAlign: "middle" }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
