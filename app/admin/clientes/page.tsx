"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { SORPRESA_ID } from "@/lib/constants";
import { getTipoPedido, formatDateShort } from "@/lib/dates";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  restricciones: string | null;
  activo: boolean;
  created_at: string;
};

type Formula = { id: string; nombre: string; slug: string; color_acento: string };

type Credito = {
  id: string;
  cliente_id: string;
  monto: number;
  motivo: string;
  fecha_expiracion: string;
  estado: string;
  pedido_origen: string | null;
  created_at: string;
};

type PedidoStats = {
  cliente_id: string;
  total_pedidos: number;
  total_botellas: number;
  ultimo_pedido: string | null;
  formula_favorita: string | null;
  formula_color: string | null;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [stats, setStats] = useState<Map<string, PedidoStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPedidoFor, setShowPedidoFor] = useState<string | null>(null);
  const [editandoCliente, setEditandoCliente] = useState<Cliente | null>(null);
  const [fichaCliente, setFichaCliente] = useState<string | null>(null);
  const [showInactivos, setShowInactivos] = useState(false);
  const [showCreditoModal, setShowCreditoModal] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  async function load() {
    const [{ data: c }, { data: f }, { data: cr }, { data: pedidos }] = await Promise.all([
      supabase.from("clientes").select("*").order("nombre"),
      supabase.from("formulas").select("*").order("nombre"),
      supabase.from("creditos_lumo").select("*"),
      supabase.from("pedidos").select("cliente_id, cantidad, dia_entrega, formula_id, formulas(nombre, color_acento)").order("dia_entrega", { ascending: false }),
    ]);
    setClientes(c ?? []);
    setFormulas(f ?? []);
    const allCreditos = (cr ?? []) as unknown as Credito[];
    const today = new Date().toISOString().split("T")[0];
    const expired = allCreditos.filter((c) => c.estado === "activo" && c.fecha_expiracion < today);
    if (expired.length > 0) {
      await Promise.all(expired.map((c) => supabase.from("creditos_lumo").update({ estado: "expirado" }).eq("id", c.id)));
      expired.forEach((c) => { c.estado = "expirado"; });
    }
    setCreditos(allCreditos);

    const statsMap = new Map<string, PedidoStats>();
    for (const p of (pedidos ?? []) as unknown as { cliente_id: string; cantidad: number; dia_entrega: string; formula_id: string; formulas: { nombre: string; color_acento: string } | null }[]) {
      const existing = statsMap.get(p.cliente_id);
      if (!existing) {
        statsMap.set(p.cliente_id, {
          cliente_id: p.cliente_id,
          total_pedidos: 1,
          total_botellas: p.cantidad,
          ultimo_pedido: p.dia_entrega,
          formula_favorita: p.formulas?.nombre ?? null,
          formula_color: p.formulas?.color_acento ?? null,
        });
      } else {
        existing.total_pedidos++;
        existing.total_botellas += p.cantidad;
        if (!existing.ultimo_pedido || p.dia_entrega > existing.ultimo_pedido) {
          existing.ultimo_pedido = p.dia_entrega;
        }
      }
    }
    // Calculate formula favorita (most ordered)
    const formulaCounts = new Map<string, Map<string, { count: number; nombre: string; color: string }>>();
    for (const p of (pedidos ?? []) as unknown as { cliente_id: string; cantidad: number; formula_id: string; formulas: { nombre: string; color_acento: string } | null }[]) {
      if (!formulaCounts.has(p.cliente_id)) formulaCounts.set(p.cliente_id, new Map());
      const clientMap = formulaCounts.get(p.cliente_id)!;
      const existing = clientMap.get(p.formula_id);
      if (existing) {
        existing.count += p.cantidad;
      } else {
        clientMap.set(p.formula_id, { count: p.cantidad, nombre: p.formulas?.nombre ?? "?", color: p.formulas?.color_acento ?? "#888" });
      }
    }
    for (const [clienteId, fMap] of Array.from(formulaCounts)) {
      const top = Array.from(fMap.values()).sort((a, b) => b.count - a.count)[0];
      const s = statsMap.get(clienteId);
      if (s && top) {
        s.formula_favorita = top.nombre;
        s.formula_color = top.color;
      }
    }

    setStats(statsMap);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function getCreditosCliente(clienteId: string) {
    return creditos.filter((c) => c.cliente_id === clienteId);
  }

  function getCreditosActivos(clienteId: string) {
    return creditos.filter((c) => c.cliente_id === clienteId && c.estado === "activo");
  }

  function getTotalCredito(clienteId: string) {
    return getCreditosActivos(clienteId).reduce((s, c) => s + c.monto, 0);
  }

  if (loading) return <Loader />;

  const activos = clientes.filter((c) => c.activo);
  const inactivos = clientes.filter((c) => !c.activo);
  const totalCreditosActivos = creditos.filter((c) => c.estado === "activo").reduce((s, c) => s + c.monto, 0);

  const filtrados = busqueda.trim()
    ? activos.filter((c) => c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || c.telefono?.includes(busqueda))
    : activos;

  const fichaClienteData = fichaCliente ? clientes.find((c) => c.id === fichaCliente) : null;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#4A5E3A" }}>
            Clientes
          </p>
          <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2rem" }}>
            {activos.length} activos
          </h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl px-4 py-2.5 font-inter text-sm font-medium"
          style={{ background: "#F5F0E8", color: "#0D0D0D" }}
        >
          + Nuevo cliente
        </button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Activos</p>
          <p className="font-cormorant text-2xl mt-1" style={{ color: "#F5F0E8" }}>{activos.length}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Inactivos</p>
          <p className="font-cormorant text-2xl mt-1" style={{ color: "#555" }}>{inactivos.length}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: totalCreditosActivos > 0 ? "rgba(184,134,11,0.06)" : "rgba(255,255,255,0.03)", border: totalCreditosActivos > 0 ? "1px solid rgba(184,134,11,0.15)" : "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-inter text-xs uppercase tracking-widest" style={{ color: totalCreditosActivos > 0 ? "#B8860B" : "#8A8A8A" }}>Balance LUMO</p>
          <p className="font-cormorant text-2xl mt-1" style={{ color: totalCreditosActivos > 0 ? "#E6A800" : "#555" }}>${totalCreditosActivos}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o teléfono..."
          className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F5F0E8" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#4A5E3A")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
        />
      </div>

      {activos.length === 0 && inactivos.length === 0 ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((c) => {
            const st = stats.get(c.id);
            const creditoTotal = getTotalCredito(c.id);
            return (
              <ClienteCard
                key={c.id}
                cliente={c}
                stats={st}
                creditoTotal={creditoTotal}
                onOpenFicha={() => setFichaCliente(c.id)}
                onPedido={() => setShowPedidoFor(c.id)}
                onEditar={() => setEditandoCliente(c)}
              />
            );
          })}

          {/* Inactivos */}
          {inactivos.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowInactivos((v) => !v)}
                className="font-inter text-xs mb-3"
                style={{ color: "#555" }}
              >
                {showInactivos ? "▲ Ocultar inactivos" : `▼ Ver inactivos (${inactivos.length})`}
              </button>
              {showInactivos && inactivos.map((c) => (
                <div key={c.id} className="mb-2 opacity-50">
                  <ClienteCard
                    cliente={c}
                    stats={stats.get(c.id)}
                    creditoTotal={0}
                    onOpenFicha={() => setFichaCliente(c.id)}
                    onPedido={() => {}}
                    onEditar={() => setEditandoCliente(c)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Client detail sheet */}
      {fichaClienteData && (
        <FichaCliente
          cliente={fichaClienteData}
          stats={stats.get(fichaClienteData.id)}
          creditos={getCreditosCliente(fichaClienteData.id)}
          onClose={() => setFichaCliente(null)}
          onEditar={() => { setFichaCliente(null); setEditandoCliente(fichaClienteData); }}
          onPedido={() => { setFichaCliente(null); setShowPedidoFor(fichaClienteData.id); }}
          onNuevoCredito={() => { setFichaCliente(null); setShowCreditoModal(fichaClienteData.id); }}
          onReload={load}
        />
      )}

      {showForm && (
        <NuevoClienteModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
      {editandoCliente && (
        <EditarClienteModal cliente={editandoCliente} onClose={() => setEditandoCliente(null)} onSaved={() => { setEditandoCliente(null); load(); }} />
      )}
      {showPedidoFor && (
        <NuevoPedidoModal
          clienteId={showPedidoFor}
          clienteNombre={clientes.find((c) => c.id === showPedidoFor)?.nombre ?? ""}
          formulas={formulas}
          creditoDisponible={getTotalCredito(showPedidoFor)}
          onClose={() => setShowPedidoFor(null)}
          onSaved={() => { setShowPedidoFor(null); load(); }}
        />
      )}
      {showCreditoModal && (
        <NuevoCreditoModal
          clienteId={showCreditoModal}
          clienteNombre={clientes.find((c) => c.id === showCreditoModal)?.nombre ?? ""}
          onClose={() => setShowCreditoModal(null)}
          onSaved={() => { setShowCreditoModal(null); load(); }}
        />
      )}
    </div>
  );
}

/* ── Client Card ── */
function ClienteCard({ cliente, stats, creditoTotal, onOpenFicha, onPedido, onEditar }: {
  cliente: Cliente;
  stats: PedidoStats | undefined;
  creditoTotal: number;
  onOpenFicha: () => void;
  onPedido: () => void;
  onEditar: () => void;
}) {
  return (
    <div
      onClick={onOpenFicha}
      className="rounded-xl px-4 py-3.5 cursor-pointer transition-all"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-inter text-sm font-semibold"
            style={{ background: stats?.formula_color ? `${stats.formula_color}20` : "rgba(255,255,255,0.06)", color: stats?.formula_color ?? "#8A8A8A" }}>
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-inter text-sm font-medium truncate" style={{ color: "#F5F0E8" }}>
                {cliente.nombre}
              </span>
              {creditoTotal > 0 && (
                <span className="font-inter text-xs px-2 py-0.5 rounded-full shrink-0 inline-flex items-center gap-1"
                  style={{ background: "rgba(184,134,11,0.15)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.3)" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c0 0-8 9.27-8 13a8 8 0 0 0 16 0c0-3.73-8-13-8-13z"/></svg>
                  ${creditoTotal}
                </span>
              )}
              {cliente.restricciones && (
                <span className="font-inter text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "rgba(224,80,112,0.1)", color: "#E05070" }}>
                  Restricciones
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {stats ? (
                <>
                  <span className="font-inter text-xs" style={{ color: "#8A8A8A" }}>
                    {stats.total_pedidos} pedido{stats.total_pedidos !== 1 ? "s" : ""} · {stats.total_botellas} bot.
                  </span>
                  {stats.formula_favorita && (
                    <>
                      <span style={{ color: "#333" }}>·</span>
                      <span className="font-inter text-xs" style={{ color: stats.formula_color ?? "#8A8A8A" }}>
                        {stats.formula_favorita}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <span className="font-inter text-xs" style={{ color: "#555" }}>Sin pedidos</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {cliente.telefono && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(buildWhatsAppUrl(cliente.telefono!, `Hola ${cliente.nombre}, te escribe LUMO.`), "_blank");
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)" }}
              title="WhatsApp"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </button>
          )}
          {cliente.activo && (
            <button
              onClick={(e) => { e.stopPropagation(); onPedido(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(74,94,58,0.15)", border: "1px solid rgba(74,94,58,0.3)" }}
              title="Nuevo pedido"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Client Detail Sheet (Ficha) ── */
function FichaCliente({ cliente, stats, creditos, onClose, onEditar, onPedido, onNuevoCredito, onReload }: {
  cliente: Cliente;
  stats: PedidoStats | undefined;
  creditos: Credito[];
  onClose: () => void;
  onEditar: () => void;
  onPedido: () => void;
  onNuevoCredito: () => void;
  onReload: () => void;
}) {
  const [toggling, setToggling] = useState(false);

  async function handleToggleActivo() {
    setToggling(true);
    await supabase.from("clientes").update({ activo: !cliente.activo }).eq("id", cliente.id);
    onReload();
    setToggling(false);
  }

  async function handleEliminar() {
    if (!window.confirm(`¿Eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`)) return;
    await supabase.from("clientes").delete().eq("id", cliente.id);
    onClose();
    onReload();
  }

  async function marcarCreditoUsado(creditoId: string) {
    await supabase.from("creditos_lumo").update({ estado: "usado" }).eq("id", creditoId);
    onReload();
  }

  async function marcarCreditoExpirado(creditoId: string) {
    await supabase.from("creditos_lumo").update({ estado: "expirado" }).eq("id", creditoId);
    onReload();
  }

  async function renovarCredito(cr: Credito) {
    const dias = parseInt(prompt("¿Cuántos días de vigencia?", "14") ?? "0");
    if (!dias) return;
    const exp = new Date();
    exp.setDate(exp.getDate() + dias);
    const fechaExp = `${exp.getFullYear()}-${String(exp.getMonth() + 1).padStart(2, "0")}-${String(exp.getDate()).padStart(2, "0")}`;
    await supabase.from("creditos_lumo").update({ estado: "activo", fecha_expiracion: fechaExp }).eq("id", cr.id);
    onReload();
  }

  const creditosActivos = creditos.filter((c) => c.estado === "activo");
  const creditosInactivos = creditos.filter((c) => c.estado !== "activo");
  const totalCredito = creditosActivos.reduce((s, c) => s + c.monto, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-inter text-lg font-semibold"
                style={{ background: stats?.formula_color ? `${stats.formula_color}20` : "rgba(255,255,255,0.06)", color: stats?.formula_color ?? "#8A8A8A" }}>
                {cliente.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-cormorant text-xl" style={{ color: "#F5F0E8" }}>{cliente.nombre}</h2>
                <p className="font-inter text-xs mt-0.5" style={{ color: "#8A8A8A" }}>
                  Cliente desde {new Date(cliente.created_at).toLocaleDateString("es-MX", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.06)", color: "#8A8A8A" }}>✕</button>
          </div>

          {/* Contact info */}
          <div className="flex items-center gap-3 flex-wrap">
            {cliente.telefono && (
              <a
                href={buildWhatsAppUrl(cliente.telefono, `Hola ${cliente.nombre}, te escribe LUMO.`)}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 font-inter text-xs transition-all"
                style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.18)", color: "#25D366" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {cliente.telefono}
              </a>
            )}
            {cliente.email && (
              <span className="font-inter text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", color: "#8A8A8A" }}>
                {cliente.email}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="font-inter text-xs" style={{ color: "#555" }}>Pedidos</p>
              <p className="font-cormorant text-xl mt-0.5" style={{ color: "#F5F0E8" }}>{stats?.total_pedidos ?? 0}</p>
            </div>
            <div>
              <p className="font-inter text-xs" style={{ color: "#555" }}>Botellas</p>
              <p className="font-cormorant text-xl mt-0.5" style={{ color: "#F5F0E8" }}>{stats?.total_botellas ?? 0}</p>
            </div>
            <div>
              <p className="font-inter text-xs" style={{ color: "#555" }}>Favorita</p>
              <p className="font-inter text-xs font-medium mt-1.5" style={{ color: stats?.formula_color ?? "#555" }}>
                {stats?.formula_favorita ?? "—"}
              </p>
            </div>
          </div>
          {stats?.ultimo_pedido && (
            <p className="font-inter text-xs mt-3" style={{ color: "#555" }}>
              Último pedido: {formatDateShort(stats.ultimo_pedido)}
            </p>
          )}
        </div>

        {/* Restrictions */}
        {cliente.restricciones && (
          <div className="px-6 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(224,80,112,0.06)", border: "1px solid rgba(224,80,112,0.12)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E05070" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="font-inter text-xs" style={{ color: "#E05070" }}>{cliente.restricciones}</span>
            </div>
          </div>
        )}

        {cliente.notas && (
          <div className="px-6 py-2">
            <p className="font-inter text-xs" style={{ color: "#8A8A8A" }}>{cliente.notas}</p>
          </div>
        )}

        {/* Balance LUMO section */}
        <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={totalCredito > 0 ? "#B8860B" : "#555"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2c0 0-8 9.27-8 13a8 8 0 0 0 16 0c0-3.73-8-13-8-13z"/>
              </svg>
              <p className="font-inter text-xs uppercase tracking-widest" style={{ color: totalCredito > 0 ? "#B8860B" : "#555" }}>
                Balance LUMO
              </p>
              {totalCredito > 0 && (
                <span className="font-inter text-xs font-medium ml-1" style={{ color: "#E6A800" }}>${totalCredito}</span>
              )}
            </div>
            <button
              onClick={onNuevoCredito}
              className="font-inter text-xs px-2.5 py-1 rounded-lg"
              style={{ background: "rgba(184,134,11,0.1)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.2)" }}
            >
              + Agregar
            </button>
          </div>
          {creditosActivos.length === 0 && creditosInactivos.length === 0 ? (
            <p className="font-inter text-xs" style={{ color: "#444" }}>Sin balance activo</p>
          ) : (
            <div className="flex flex-col gap-2">
              {creditosActivos.map((cr) => {
                const expDate = new Date(cr.fecha_expiracion + "T12:00:00");
                const isExpiringSoon = expDate.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
                return (
                  <div key={cr.id} className="flex items-center justify-between rounded-lg px-3 py-2.5"
                    style={{ background: "rgba(184,134,11,0.06)", border: "1px solid rgba(184,134,11,0.12)" }}>
                    <div>
                      <span className="font-inter text-sm font-medium" style={{ color: "#E6A800" }}>${cr.monto}</span>
                      <span className="font-inter text-xs ml-2" style={{ color: isExpiringSoon ? "#E05070" : "#8A8A8A" }}>
                        Vence {formatDateShort(cr.fecha_expiracion)}
                      </span>
                      {cr.motivo && (
                        <p className="font-inter text-xs mt-0.5" style={{ color: "#555" }}>{cr.motivo}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => marcarCreditoUsado(cr.id)}
                        className="rounded-md px-2 py-1 font-inter text-xs"
                        style={{ background: "rgba(74,94,58,0.2)", color: "#6DBF67" }}>Usar</button>
                      <button onClick={() => marcarCreditoExpirado(cr.id)}
                        className="rounded-md px-2 py-1 font-inter text-xs"
                        style={{ background: "rgba(122,32,48,0.1)", color: "#7A2030" }}>Expirar</button>
                    </div>
                  </div>
                );
              })}
              {creditosInactivos.length > 0 && (
                <div className="mt-1">
                  <p className="font-inter text-xs mb-1.5" style={{ color: "#444" }}>Historial</p>
                  {creditosInactivos.map((cr) => (
                    <div key={cr.id} className="flex items-center justify-between rounded-lg px-3 py-2 mb-1 opacity-50"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <div>
                        <span className="font-inter text-xs" style={{ color: "#8A8A8A", textDecoration: "line-through" }}>${cr.monto}</span>
                        <span className="font-inter text-xs ml-2 px-1.5 py-0.5 rounded"
                          style={{ background: cr.estado === "usado" ? "rgba(74,94,58,0.15)" : "rgba(122,32,48,0.1)", color: cr.estado === "usado" ? "#6DBF67" : "#7A2030" }}>
                          {cr.estado === "usado" ? "Usado" : "Vencido"}
                        </span>
                        {cr.motivo && <span className="font-inter text-xs ml-2" style={{ color: "#444" }}>{cr.motivo}</span>}
                      </div>
                      {cr.estado === "expirado" && (
                        <button onClick={() => renovarCredito(cr)}
                          className="rounded-md px-2 py-1 font-inter text-xs"
                          style={{ background: "rgba(184,134,11,0.12)", color: "#E6A800" }}>Renovar</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 flex items-center gap-2 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {cliente.activo && (
            <button onClick={onPedido}
              className="rounded-lg px-4 py-2 font-inter text-xs font-medium"
              style={{ background: "rgba(74,94,58,0.2)", color: "#6DBF67", border: "1px solid rgba(74,94,58,0.3)" }}>
              + Nuevo pedido
            </button>
          )}
          <button onClick={onEditar}
            className="rounded-lg px-4 py-2 font-inter text-xs"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}>
            Editar
          </button>
          <button onClick={handleToggleActivo} disabled={toggling}
            className="rounded-lg px-4 py-2 font-inter text-xs"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}>
            {cliente.activo ? "Desactivar" : "Reactivar"}
          </button>
          <button onClick={handleEliminar}
            className="rounded-lg px-4 py-2 font-inter text-xs ml-auto"
            style={{ background: "rgba(122,32,48,0.12)", color: "#7A2030", border: "1px solid rgba(122,32,48,0.2)" }}>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Nuevo Crédito Modal ── */
function NuevoCreditoModal({ clienteId, clienteNombre, onClose, onSaved }: {
  clienteId: string; clienteNombre: string; onClose: () => void; onSaved: () => void;
}) {
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("Pedido convertido en Balance LUMO");
  const defaultExp = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
  const [fechaExp, setFechaExp] = useState(defaultExp);
  const [saving, setSaving] = useState(false);

  function setQuickDays(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFechaExp(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!monto || parseFloat(monto) <= 0 || !fechaExp) return;
    setSaving(true);
    await supabase.from("creditos_lumo").insert({
      cliente_id: clienteId,
      monto: parseFloat(monto),
      motivo,
      fecha_expiracion: fechaExp,
      estado: "activo",
    });
    onSaved();
  }

  return (
    <Modal title={`Balance LUMO — ${clienteNombre}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Monto ($)" required>
          <Input value={monto} onChange={setMonto} placeholder="Ej. 150" required />
        </Field>
        <Field label="Motivo">
          <Input value={motivo} onChange={setMotivo} placeholder="Ej. Pedido convertido en Balance LUMO" />
        </Field>
        <Field label="Fecha de vencimiento" required>
          <div className="flex gap-2 mb-2">
            {[7, 14, 30].map((d) => (
              <button key={d} type="button" onClick={() => setQuickDays(d)}
                className="rounded-lg px-3 py-1.5 font-inter text-xs transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}>
                {d} días
              </button>
            ))}
          </div>
          <input type="date" value={fechaExp} onChange={(e) => setFechaExp(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", colorScheme: "dark" }} />
        </Field>
        <button type="submit" disabled={saving || !monto || !fechaExp} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2 flex items-center justify-center gap-2"
          style={{ background: "#E6A800", color: "#0D0D0D", opacity: saving || !monto || !fechaExp ? 0.5 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c0 0-8 9.27-8 13a8 8 0 0 0 16 0c0-3.73-8-13-8-13z"/></svg>
          {saving ? "Guardando..." : "Crear Balance LUMO"}
        </button>
      </form>
    </Modal>
  );
}

/* ── Modals (same as before, with credit banner in NuevoPedido) ── */

function NuevoClienteModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [restricciones, setRestricciones] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("clientes").insert({
      nombre, telefono: telefono || null, email: email || null,
      restricciones: restricciones || null, notas: notas || null, activo: true,
    });
    onSaved();
  }

  return (
    <Modal title="Nuevo cliente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre" required><Input value={nombre} onChange={setNombre} placeholder="Ej. María García" required /></Field>
        <Field label="Teléfono / WhatsApp"><Input value={telefono} onChange={setTelefono} placeholder="+52 55 1234 5678" /></Field>
        <Field label="Email"><Input value={email} onChange={setEmail} placeholder="correo@ejemplo.com" /></Field>
        <Field label="Restricciones / Alergias"><Input value={restricciones} onChange={setRestricciones} placeholder="Ej. Sin apio, sin jengibre..." /></Field>
        <Field label="Notas"><Input value={notas} onChange={setNotas} placeholder="Empresa, observaciones..." /></Field>
        <button type="submit" disabled={saving} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2"
          style={{ background: "#F5F0E8", color: "#0D0D0D", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Guardando..." : "Guardar cliente"}
        </button>
      </form>
    </Modal>
  );
}

function EditarClienteModal({ cliente, onClose, onSaved }: { cliente: Cliente; onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState(cliente.nombre);
  const [telefono, setTelefono] = useState(cliente.telefono ?? "");
  const [email, setEmail] = useState(cliente.email ?? "");
  const [restricciones, setRestricciones] = useState(cliente.restricciones ?? "");
  const [notas, setNotas] = useState(cliente.notas ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await supabase.from("clientes").update({
      nombre, telefono: telefono || null, email: email || null,
      restricciones: restricciones || null, notas: notas || null,
    }).eq("id", cliente.id);
    onSaved();
  }

  return (
    <Modal title="Editar cliente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nombre" required><Input value={nombre} onChange={setNombre} placeholder="Ej. María García" required /></Field>
        <Field label="Teléfono / WhatsApp"><Input value={telefono} onChange={setTelefono} placeholder="+52 55 1234 5678" /></Field>
        <Field label="Email"><Input value={email} onChange={setEmail} placeholder="correo@ejemplo.com" /></Field>
        <Field label="Restricciones / Alergias"><Input value={restricciones} onChange={setRestricciones} placeholder="Ej. Sin apio, sin jengibre..." /></Field>
        <Field label="Notas"><Input value={notas} onChange={setNotas} placeholder="Empresa, observaciones..." /></Field>
        <button type="submit" disabled={saving} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2"
          style={{ background: "#F5F0E8", color: "#0D0D0D", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </Modal>
  );
}

function NuevoPedidoModal({ clienteId, clienteNombre, formulas, creditoDisponible, onClose, onSaved }: {
  clienteId: string; clienteNombre: string; formulas: Formula[]; creditoDisponible: number; onClose: () => void; onSaved: () => void;
}) {
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const [formulaId, setFormulaId] = useState(formulas[0]?.id ?? "");
  const [cantidad, setCantidad] = useState("1");
  const [diaEntrega, setDiaEntrega] = useState(todayStr);
  const [notas, setNotas] = useState("");
  const [excluidos, setExcluidos] = useState<string[]>([]);
  const [ingredientes, setIngredientes] = useState<{ nombre: string }[]>([]);
  const [preferencia, setPreferencia] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (formulaId && formulaId !== SORPRESA_ID) {
      supabase.from("recetas").select("ingredientes(nombre)").eq("formula_id", formulaId)
        .then(({ data }) => {
          const ings = (data ?? []).map((r) => (r.ingredientes as unknown as { nombre: string })).filter(Boolean) as { nombre: string }[];
          setIngredientes(ings);
          setExcluidos([]);
        });
    } else {
      setIngredientes([]);
      setExcluidos([]);
    }
  }, [formulaId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    let realFormulaId = formulaId;
    let esSorpresa = false;
    if (formulaId === SORPRESA_ID) {
      realFormulaId = formulas[Math.floor(Math.random() * formulas.length)]?.id ?? formulas[0]?.id ?? "";
      esSorpresa = true;
    }
    await supabase.from("pedidos").insert({
      cliente_id: clienteId, formula_id: realFormulaId, cantidad: parseInt(cantidad),
      dia_entrega: diaEntrega, notas: notas || null, tipo_pedido: getTipoPedido(diaEntrega),
      es_sorpresa: esSorpresa, ingredientes_excluidos: excluidos.length > 0 ? excluidos : null,
      preferencia_sorpresa: preferencia || null,
    });
    onSaved();
  }

  return (
    <Modal title={`Pedido — ${clienteNombre}`} onClose={onClose}>
      {/* Balance LUMO banner */}
      {creditoDisponible > 0 && (
        <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2"
          style={{ background: "rgba(184,134,11,0.08)", border: "1px solid rgba(184,134,11,0.18)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E6A800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2c0 0-8 9.27-8 13a8 8 0 0 0 16 0c0-3.73-8-13-8-13z"/>
          </svg>
          <span className="font-inter text-xs" style={{ color: "#E6A800" }}>
            Balance LUMO disponible: <strong>${creditoDisponible}</strong>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Fórmula">
          <select value={formulaId} onChange={(e) => setFormulaId(e.target.value)}
            className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}>
            {formulas.map((f) => <option key={f.id} value={f.id} style={{ background: "#1a1a1a" }}>{f.nombre}</option>)}
            <option value={SORPRESA_ID} style={{ background: "#1a1a1a" }}>Sorpresa</option>
          </select>
        </Field>

        {formulaId === SORPRESA_ID && (
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(184,134,11,0.12)", border: "1px solid rgba(184,134,11,0.25)" }}>
            <p className="font-inter text-xs" style={{ color: "#E6A800" }}>Se asignará una fórmula al azar al guardar.</p>
          </div>
        )}

        {formulaId !== SORPRESA_ID && ingredientes.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Excluir ingredientes</label>
            <div className="flex flex-wrap gap-2">
              {ingredientes.map((ing) => {
                const excluido = excluidos.includes(ing.nombre);
                return (
                  <button key={ing.nombre} type="button" onClick={() => setExcluidos((prev) => excluido ? prev.filter((n) => n !== ing.nombre) : [...prev, ing.nombre])}
                    className="rounded-lg px-3 py-1.5 font-inter text-xs transition-all"
                    style={{ background: excluido ? "rgba(224,80,112,0.12)" : "rgba(255,255,255,0.06)", color: excluido ? "#E05070" : "#8A8A8A", border: excluido ? "1px solid rgba(224,80,112,0.3)" : "1px solid rgba(255,255,255,0.08)", textDecoration: excluido ? "line-through" : "none" }}>
                    {ing.nombre}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Preferencia de sabor</label>
          <div className="flex gap-2">
            {["Dulce", "Fresco", "Balanceado"].map((p) => (
              <button key={p} type="button" onClick={() => setPreferencia((prev) => prev === p ? "" : p)}
                className="rounded-lg px-3 py-1.5 font-inter text-xs transition-all"
                style={{ background: preferencia === p ? "rgba(74,94,58,0.25)" : "rgba(255,255,255,0.06)", color: preferencia === p ? "#6DBF67" : "#8A8A8A", border: preferencia === p ? "1px solid rgba(74,94,58,0.4)" : "1px solid rgba(255,255,255,0.08)" }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <Field label="Cantidad">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCantidad((v) => String(Math.max(1, parseInt(v) - 1)))}
              className="w-10 h-10 rounded-xl font-inter text-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#F5F0E8" }}>−</button>
            <span className="font-cormorant text-2xl flex-1 text-center" style={{ color: "#F5F0E8" }}>{cantidad}</span>
            <button type="button" onClick={() => setCantidad((v) => String(parseInt(v) + 1))}
              className="w-10 h-10 rounded-xl font-inter text-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#F5F0E8" }}>+</button>
          </div>
        </Field>

        <Field label="Día de entrega">
          <input type="date" value={diaEntrega} onChange={(e) => setDiaEntrega(e.target.value)}
            className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", colorScheme: "dark" }} />
        </Field>

        <Field label="Notas (opcional)">
          <Input value={notas} onChange={setNotas} placeholder="Ej. doble betabel..." />
        </Field>

        <button type="submit" disabled={saving} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2"
          style={{ background: "#F5F0E8", color: "#0D0D0D", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Guardando..." : "Guardar pedido"}
        </button>
      </form>
    </Modal>
  );
}

/* ── Shared UI components ── */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "#171717", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-cormorant text-xl font-light" style={{ color: "#F5F0E8" }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", color: "#8A8A8A" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>
        {label}{required && <span style={{ color: "#7A2030" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, required }: { value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
      className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#4A5E3A")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
      <p className="font-cormorant text-2xl mb-2" style={{ color: "#F5F0E8" }}>Sin clientes aún</p>
      <p className="font-inter text-sm mb-5" style={{ color: "#555" }}>Agrega tu primer cliente para empezar.</p>
      <button onClick={onAdd} className="rounded-xl px-5 py-2.5 font-inter text-sm font-medium"
        style={{ background: "#F5F0E8", color: "#0D0D0D" }}>+ Agregar cliente</button>
    </div>
  );
}

function Loader() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#4A5E3A", borderTopColor: "transparent" }} />
    </div>
  );
}
