"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { adminWrite } from "@/lib/admin-api";
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
  empresa: string | null;
  codigo_miembro: string | null;
  activo: boolean;
  created_at: string;
  categoria: string | null;
};

type Formula = { id: string; nombre: string; slug: string; color_acento: string };

type Movimiento = {
  id: string;
  cliente_id: string;
  tipo: string;
  monto: number;
  descripcion: string;
  referencia_pedido: string | null;
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

function generarCodigoMiembro(): string {
  const num = Math.floor(Math.random() * 900) + 100;
  return `LM-${num}`;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [stats, setStats] = useState<Map<string, PedidoStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPedidoFor, setShowPedidoFor] = useState<string | null>(null);
  const [editandoCliente, setEditandoCliente] = useState<Cliente | null>(null);
  const [fichaCliente, setFichaCliente] = useState<string | null>(null);
  const [showInactivos, setShowInactivos] = useState(false);
  const [showRecargaModal, setShowRecargaModal] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [catFilter, setCatFilter] = useState<string>("todos");

  async function load() {
    const [{ data: c }, { data: f }, { data: mov }, { data: pedidos }] = await Promise.all([
      supabase.from("clientes").select("*").order("nombre"),
      supabase.from("formulas").select("*").order("nombre"),
      supabase.from("movimientos_balance").select("*").order("created_at", { ascending: false }),
      supabase.from("pedidos").select("cliente_id, cantidad, dia_entrega, formula_id, formulas(nombre, color_acento)").order("dia_entrega", { ascending: false }),
    ]);
    setClientes(c ?? []);
    setFormulas(f ?? []);
    setMovimientos((mov ?? []) as unknown as Movimiento[]);

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

  function getMovimientosCliente(clienteId: string) {
    return movimientos.filter((m) => m.cliente_id === clienteId);
  }

  function getBalance(clienteId: string) {
    return getMovimientosCliente(clienteId).reduce((s, m) => s + m.monto, 0);
  }

  if (loading) return <Loader />;

  const activos = clientes.filter((c) => c.activo);
  const inactivos = clientes.filter((c) => !c.activo);
  const totalBalance = movimientos.reduce((s, m) => s + m.monto, 0);

  const getCat = (c: Cliente) => c.categoria ?? (c.empresa ? "empresa" : "amigo");
  const catCounts = { empresa: 0, vecino: 0, amigo: 0 };
  for (const c of activos) {
    const cat = getCat(c);
    if (cat in catCounts) catCounts[cat as keyof typeof catCounts]++;
  }

  const afterCat = catFilter === "todos" ? activos : activos.filter((c) => getCat(c) === catFilter);
  const filtrados = busqueda.trim()
    ? afterCat.filter((c) =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.telefono?.includes(busqueda) ||
        c.codigo_miembro?.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.empresa?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : afterCat;

  const fichaClienteData = fichaCliente ? clientes.find((c) => c.id === fichaCliente) : null;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#4A5E3A" }}>Miembros</p>
          <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2rem" }}>{activos.length} activos</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="rounded-xl px-4 py-2.5 font-inter text-sm font-medium"
          style={{ background: "#F5F0E8", color: "#0D0D0D" }}>+ Nuevo miembro</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Activos</p>
          <p className="font-cormorant text-2xl mt-1" style={{ color: "#F5F0E8" }}>{activos.length}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Inactivos</p>
          <p className="font-cormorant text-2xl mt-1" style={{ color: "#555" }}>{inactivos.length}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: totalBalance > 0 ? "rgba(184,134,11,0.06)" : "rgba(255,255,255,0.03)", border: totalBalance > 0 ? "1px solid rgba(184,134,11,0.15)" : "1px solid rgba(255,255,255,0.06)" }}>
          <p className="font-inter text-xs uppercase tracking-widest" style={{ color: totalBalance > 0 ? "#B8860B" : "#8A8A8A" }}>Balance LUMO</p>
          <p className="font-cormorant text-2xl mt-1" style={{ color: totalBalance > 0 ? "#E6A800" : "#555" }}>${totalBalance}</p>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {([
          { id: "todos", label: "Todos", count: activos.length, color: "#F5F0E8" },
          { id: "empresa", label: "Empresa", count: catCounts.empresa, color: "#4A5E3A" },
          { id: "vecino", label: "Vecinos", count: catCounts.vecino, color: "#B8860B" },
          { id: "amigo", label: "Amigos / Otros", count: catCounts.amigo, color: "#8A8A8A" },
        ] as const).map((tab) => {
          const active = catFilter === tab.id;
          return (
            <button key={tab.id} onClick={() => setCatFilter(tab.id)}
              className="rounded-full px-3.5 py-1.5 font-inter text-xs whitespace-nowrap transition-all shrink-0"
              style={{
                background: active ? `${tab.color}18` : "rgba(255,255,255,0.03)",
                border: active ? `1px solid ${tab.color}50` : "1px solid rgba(255,255,255,0.06)",
                color: active ? tab.color : "#666",
                fontWeight: active ? 500 : 400,
              }}>
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      <div className="mb-4">
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, código, empresa o teléfono..."
          className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F5F0E8" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#4A5E3A")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
      </div>

      {activos.length === 0 && inactivos.length === 0 ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtrados.map((c) => (
            <MiembroCard key={c.id} cliente={c} stats={stats.get(c.id)} balance={getBalance(c.id)}
              onOpenFicha={() => setFichaCliente(c.id)} onPedido={() => setShowPedidoFor(c.id)} onEditar={() => setEditandoCliente(c)} />
          ))}
          {inactivos.length > 0 && (
            <div className="mt-4">
              <button onClick={() => setShowInactivos((v) => !v)} className="font-inter text-xs mb-3" style={{ color: "#555" }}>
                {showInactivos ? "▲ Ocultar inactivos" : `▼ Ver inactivos (${inactivos.length})`}
              </button>
              {showInactivos && inactivos.map((c) => (
                <div key={c.id} className="mb-2 opacity-50">
                  <MiembroCard cliente={c} stats={stats.get(c.id)} balance={0}
                    onOpenFicha={() => setFichaCliente(c.id)} onPedido={() => {}} onEditar={() => setEditandoCliente(c)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {fichaClienteData && (
        <FichaMiembro cliente={fichaClienteData} stats={stats.get(fichaClienteData.id)}
          movimientos={getMovimientosCliente(fichaClienteData.id)} balance={getBalance(fichaClienteData.id)}
          onClose={() => setFichaCliente(null)}
          onEditar={() => { setFichaCliente(null); setEditandoCliente(fichaClienteData); }}
          onPedido={() => { setFichaCliente(null); setShowPedidoFor(fichaClienteData.id); }}
          onRecarga={() => { setFichaCliente(null); setShowRecargaModal(fichaClienteData.id); }}
          onReload={load} />
      )}

      {showForm && <NuevoMiembroModal clientes={clientes} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
      {editandoCliente && <EditarMiembroModal cliente={editandoCliente} onClose={() => setEditandoCliente(null)} onSaved={() => { setEditandoCliente(null); load(); }} />}
      {showPedidoFor && (
        <NuevoPedidoModal clienteId={showPedidoFor} clienteNombre={clientes.find((c) => c.id === showPedidoFor)?.nombre ?? ""}
          formulas={formulas} balanceDisponible={getBalance(showPedidoFor)}
          onClose={() => setShowPedidoFor(null)} onSaved={() => { setShowPedidoFor(null); load(); }} />
      )}
      {showRecargaModal && (
        <RecargaBalanceModal clienteId={showRecargaModal} clienteNombre={clientes.find((c) => c.id === showRecargaModal)?.nombre ?? ""}
          codigoMiembro={clientes.find((c) => c.id === showRecargaModal)?.codigo_miembro ?? ""}
          onClose={() => setShowRecargaModal(null)} onSaved={() => { setShowRecargaModal(null); load(); }} />
      )}
    </div>
  );
}

function DropIcon({ size = 14, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 0-8 9.27-8 13a8 8 0 0 0 16 0c0-3.73-8-13-8-13z"/>
    </svg>
  );
}

function MiembroCard({ cliente, stats, balance, onOpenFicha, onPedido, onEditar }: {
  cliente: Cliente; stats: PedidoStats | undefined; balance: number; onOpenFicha: () => void; onPedido: () => void; onEditar: () => void;
}) {
  return (
    <div onClick={onOpenFicha} className="rounded-xl px-4 py-3.5 cursor-pointer transition-all"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-inter text-sm font-semibold"
            style={{ background: stats?.formula_color ? `${stats.formula_color}20` : "rgba(255,255,255,0.06)", color: stats?.formula_color ?? "#8A8A8A" }}>
            {cliente.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-inter text-sm font-medium truncate" style={{ color: "#F5F0E8" }}>{cliente.nombre}</span>
              {cliente.codigo_miembro && <span className="font-inter text-xs shrink-0" style={{ color: "#555" }}>{cliente.codigo_miembro}</span>}
              {balance > 0 && (
                <span className="font-inter text-xs px-2 py-0.5 rounded-full shrink-0 inline-flex items-center gap-1"
                  style={{ background: "rgba(184,134,11,0.15)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.3)" }}>
                  <DropIcon size={10} color="#E6A800" />${balance}
                </span>
              )}
              {cliente.restricciones && (
                <span className="font-inter text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: "rgba(224,80,112,0.1)", color: "#E05070" }}>Restricciones</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              {stats ? (
                <>
                  <span className="font-inter text-xs" style={{ color: "#8A8A8A" }}>{stats.total_pedidos} pedido{stats.total_pedidos !== 1 ? "s" : ""} · {stats.total_botellas} bot.</span>
                  {stats.formula_favorita && (<><span style={{ color: "#333" }}>·</span><span className="font-inter text-xs" style={{ color: stats.formula_color ?? "#8A8A8A" }}>{stats.formula_favorita}</span></>)}
                </>
              ) : (<span className="font-inter text-xs" style={{ color: "#555" }}>Sin pedidos</span>)}
              {cliente.empresa && (<><span style={{ color: "#333" }}>·</span><span className="font-inter text-xs" style={{ color: "#666" }}>{cliente.empresa}</span></>)}
              {(() => { const cat = cliente.categoria ?? (cliente.empresa ? "empresa" : "amigo"); const catLabel = cat === "empresa" ? "Empresa" : cat === "vecino" ? "Vecino" : null; const catColor = cat === "empresa" ? "#4A5E3A" : cat === "vecino" ? "#B8860B" : null; return catLabel ? (<><span style={{ color: "#333" }}>·</span><span className="font-inter text-[0.65rem]" style={{ color: catColor ?? "#555" }}>{catLabel}</span></>) : null; })()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {cliente.telefono && (
            <button onClick={(e) => { e.stopPropagation(); window.open(buildWhatsAppUrl(cliente.telefono!, `Hola ${cliente.nombre}, te escribe LUMO.`), "_blank"); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.2)" }} title="WhatsApp">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
          )}
          {cliente.activo && (
            <button onClick={(e) => { e.stopPropagation(); onPedido(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
              style={{ background: "rgba(74,94,58,0.15)", border: "1px solid rgba(74,94,58,0.3)" }} title="Nuevo pedido">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FichaMiembro({ cliente, stats, movimientos, balance, onClose, onEditar, onPedido, onRecarga, onReload }: {
  cliente: Cliente; stats: PedidoStats | undefined; movimientos: Movimiento[]; balance: number;
  onClose: () => void; onEditar: () => void; onPedido: () => void; onRecarga: () => void; onReload: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  async function handleToggleActivo() { setToggling(true); await adminWrite("clientes", "update", { activo: !cliente.activo }, [{ column: "id", value: cliente.id }]); onReload(); setToggling(false); }
  async function handleEliminar() { if (!window.confirm(`¿Eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`)) return; await adminWrite("clientes", "delete", {}, [{ column: "id", value: cliente.id }]); onClose(); onReload(); }
  const miembroDesde = new Date(cliente.created_at).toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl max-h-[90vh] overflow-y-auto"
        style={{ background: "#141414", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-inter text-lg font-semibold"
                style={{ background: stats?.formula_color ? `${stats.formula_color}20` : "rgba(255,255,255,0.06)", color: stats?.formula_color ?? "#8A8A8A" }}>
                {cliente.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-cormorant text-xl" style={{ color: "#F5F0E8" }}>{cliente.nombre}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {cliente.codigo_miembro && <span className="font-inter text-xs font-medium" style={{ color: "#B8860B" }}>{cliente.codigo_miembro}</span>}
                  {(() => { const cat = cliente.categoria ?? (cliente.empresa ? "empresa" : "amigo"); const catLabel = cat === "empresa" ? "Empresa" : cat === "vecino" ? "Vecino" : "Amigo"; const catColor = cat === "empresa" ? "#4A5E3A" : cat === "vecino" ? "#B8860B" : "#8A8A8A"; return <span className="font-inter text-[0.65rem] px-1.5 py-0.5 rounded" style={{ background: `${catColor}15`, color: catColor }}>{catLabel}</span>; })()}
                  <span className="font-inter text-xs" style={{ color: "#8A8A8A" }}>Miembro desde {miembroDesde}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "#8A8A8A" }}>✕</button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {cliente.telefono && (
              <a href={buildWhatsAppUrl(cliente.telefono, `Hola ${cliente.nombre}, te escribe LUMO.`)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 font-inter text-xs transition-all"
                style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.18)", color: "#25D366" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                {cliente.telefono}
              </a>
            )}
            {cliente.email && <span className="font-inter text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", color: "#8A8A8A" }}>{cliente.email}</span>}
            {cliente.empresa && <span className="font-inter text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", color: "#8A8A8A" }}>{cliente.empresa}</span>}
          </div>
        </div>

        <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="grid grid-cols-3 gap-3">
            <div><p className="font-inter text-xs" style={{ color: "#555" }}>Pedidos</p><p className="font-cormorant text-xl mt-0.5" style={{ color: "#F5F0E8" }}>{stats?.total_pedidos ?? 0}</p></div>
            <div><p className="font-inter text-xs" style={{ color: "#555" }}>Botellas</p><p className="font-cormorant text-xl mt-0.5" style={{ color: "#F5F0E8" }}>{stats?.total_botellas ?? 0}</p></div>
            <div><p className="font-inter text-xs" style={{ color: "#555" }}>Favorita</p><p className="font-inter text-xs font-medium mt-1.5" style={{ color: stats?.formula_color ?? "#555" }}>{stats?.formula_favorita ?? "—"}</p></div>
          </div>
          {stats?.ultimo_pedido && <p className="font-inter text-xs mt-3" style={{ color: "#555" }}>Último pedido: {formatDateShort(stats.ultimo_pedido)}</p>}
        </div>

        {cliente.restricciones && (
          <div className="px-6 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ background: "rgba(224,80,112,0.06)", border: "1px solid rgba(224,80,112,0.12)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E05070" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <span className="font-inter text-xs" style={{ color: "#E05070" }}>{cliente.restricciones}</span>
            </div>
          </div>
        )}
        {cliente.notas && <div className="px-6 py-2"><p className="font-inter text-xs" style={{ color: "#8A8A8A" }}>{cliente.notas}</p></div>}

        <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DropIcon size={14} color={balance > 0 ? "#B8860B" : "#555"} />
              <p className="font-inter text-xs uppercase tracking-widest" style={{ color: balance > 0 ? "#B8860B" : "#555" }}>Balance LUMO</p>
              <span className="font-cormorant text-lg font-medium ml-1" style={{ color: balance > 0 ? "#E6A800" : "#555" }}>${balance}</span>
            </div>
            <button onClick={onRecarga} className="font-inter text-xs px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
              style={{ background: "rgba(184,134,11,0.1)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.2)" }}>
              <DropIcon size={10} color="#E6A800" />Recarga
            </button>
          </div>
          {movimientos.length === 0 ? (
            <p className="font-inter text-xs" style={{ color: "#444" }}>Sin movimientos</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {movimientos.map((m) => {
                const isPositive = m.monto > 0;
                const fecha = new Date(m.created_at);
                const fechaStr = fecha.toLocaleDateString("es-MX", { month: "short", year: "numeric" });
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: isPositive ? "#4A5E3A" : "rgba(255,255,255,0.15)" }} />
                      <div className="min-w-0">
                        <p className="font-inter text-xs truncate" style={{ color: "#ccc" }}>{m.descripcion}</p>
                        <p className="font-inter text-xs" style={{ color: "#444" }}>{fechaStr}</p>
                      </div>
                    </div>
                    <span className="font-inter text-xs font-medium shrink-0 ml-2" style={{ color: isPositive ? "#4A5E3A" : "#8A8A8A" }}>
                      {isPositive ? "+" : ""}${m.monto}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 flex items-center gap-2 flex-wrap" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {cliente.activo && <button onClick={onPedido} className="rounded-lg px-4 py-2 font-inter text-xs font-medium" style={{ background: "rgba(74,94,58,0.2)", color: "#6DBF67", border: "1px solid rgba(74,94,58,0.3)" }}>+ Nuevo pedido</button>}
          <button onClick={onEditar} className="rounded-lg px-4 py-2 font-inter text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}>Editar</button>
          <button onClick={handleToggleActivo} disabled={toggling} className="rounded-lg px-4 py-2 font-inter text-xs" style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}>{cliente.activo ? "Desactivar" : "Reactivar"}</button>
          <button onClick={handleEliminar} className="rounded-lg px-4 py-2 font-inter text-xs ml-auto" style={{ background: "rgba(122,32,48,0.12)", color: "#7A2030", border: "1px solid rgba(122,32,48,0.2)" }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

function RecargaBalanceModal({ clienteId, clienteNombre, codigoMiembro, onClose, onSaved }: {
  clienteId: string; clienteNombre: string; codigoMiembro: string; onClose: () => void; onSaved: () => void;
}) {
  const [monto, setMonto] = useState("");
  const [montoCustom, setMontoCustom] = useState("");
  const [descripcion, setDescripcion] = useState("Balance LUMO de cortesía");
  const [saving, setSaving] = useState(false);
  const presets = [300, 600, 1200];
  const montoFinal = monto === "custom" ? parseFloat(montoCustom) : parseFloat(monto);
  const isValid = montoFinal > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSaving(true);
    await adminWrite("movimientos_balance", "insert", { cliente_id: clienteId, tipo: "recarga", monto: montoFinal, descripcion });
    onSaved();
  }

  return (
    <Modal title={`Recarga — ${clienteNombre}`} onClose={onClose}>
      <div className="flex items-center gap-2 mb-5">
        <DropIcon size={14} color="#B8860B" />
        <span className="font-inter text-xs" style={{ color: "#B8860B" }}>{codigoMiembro}</span>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Monto de recarga">
          <div className="grid grid-cols-3 gap-2 mb-2">
            {presets.map((p) => (
              <button key={p} type="button" onClick={() => { setMonto(String(p)); setMontoCustom(""); }}
                className="rounded-xl py-3 font-inter text-sm font-medium transition-all"
                style={{ background: monto === String(p) ? "rgba(184,134,11,0.2)" : "rgba(255,255,255,0.06)", color: monto === String(p) ? "#E6A800" : "#8A8A8A", border: monto === String(p) ? "1px solid rgba(184,134,11,0.4)" : "1px solid rgba(255,255,255,0.08)" }}>
                ${p.toLocaleString()}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setMonto("custom")} className="w-full rounded-xl py-2 font-inter text-xs mb-2 transition-all"
            style={{ background: monto === "custom" ? "rgba(184,134,11,0.12)" : "rgba(255,255,255,0.03)", color: monto === "custom" ? "#E6A800" : "#666", border: monto === "custom" ? "1px solid rgba(184,134,11,0.25)" : "1px solid rgba(255,255,255,0.06)" }}>
            Monto personalizado
          </button>
          {monto === "custom" && (
            <input value={montoCustom} onChange={(e) => setMontoCustom(e.target.value)} placeholder="Ej. 450" type="number" min="1"
              className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#B8860B")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
          )}
        </Field>
        <Field label="Descripción"><Input value={descripcion} onChange={setDescripcion} placeholder="Ej. Recarga de Balance LUMO" /></Field>
        <button type="submit" disabled={saving || !isValid} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2 flex items-center justify-center gap-2"
          style={{ background: "#E6A800", color: "#0D0D0D", opacity: saving || !isValid ? 0.5 : 1 }}>
          <DropIcon size={14} color="#0D0D0D" />{saving ? "Procesando..." : `Recargar ${isValid ? "$" + montoFinal.toLocaleString() : ""}`}
        </button>
      </form>
    </Modal>
  );
}

function NuevoMiembroModal({ clientes, onClose, onSaved }: { clientes: Cliente[]; onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState(""); const [telefono, setTelefono] = useState(""); const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState(""); const [restricciones, setRestricciones] = useState(""); const [notas, setNotas] = useState("");
  const [categoria, setCategoria] = useState("amigo");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const existingCodes = clientes.map((c) => c.codigo_miembro).filter(Boolean) as string[];
    let codigo = generarCodigoMiembro(); let attempts = 0;
    while (existingCodes.includes(codigo) && attempts < 50) { codigo = generarCodigoMiembro(); attempts++; }
    await adminWrite("clientes", "insert", { nombre, telefono: telefono || null, email: email || null, empresa: empresa || null, restricciones: restricciones || null, notas: notas || null, activo: true, codigo_miembro: codigo, categoria });
    onSaved();
  }

  return (
    <Modal title="Nuevo miembro" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Categoría">
          <CategoriaSelector value={categoria} onChange={setCategoria} />
        </Field>
        <Field label="Nombre" required><Input value={nombre} onChange={setNombre} placeholder="Ej. María García" required /></Field>
        <Field label="Teléfono / WhatsApp"><Input value={telefono} onChange={setTelefono} placeholder="+52 55 1234 5678" /></Field>
        <Field label="Email"><Input value={email} onChange={setEmail} placeholder="correo@ejemplo.com" /></Field>
        <Field label={categoria === "vecino" ? "Colonia / Zona" : "Empresa"}><Input value={empresa} onChange={setEmpresa} placeholder={categoria === "vecino" ? "Ej. Col. Roma Norte" : "Ej. Deloitte, WeWork Roma..."} /></Field>
        <Field label="Restricciones / Alergias"><Input value={restricciones} onChange={setRestricciones} placeholder="Ej. Sin apio, sin jengibre..." /></Field>
        <Field label="Notas"><Input value={notas} onChange={setNotas} placeholder="Observaciones internas..." /></Field>
        <button type="submit" disabled={saving} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2"
          style={{ background: "#F5F0E8", color: "#0D0D0D", opacity: saving ? 0.6 : 1 }}>{saving ? "Registrando..." : "Registrar miembro"}</button>
      </form>
    </Modal>
  );
}

function EditarMiembroModal({ cliente, onClose, onSaved }: { cliente: Cliente; onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState(cliente.nombre); const [telefono, setTelefono] = useState(cliente.telefono ?? "");
  const [email, setEmail] = useState(cliente.email ?? ""); const [empresa, setEmpresa] = useState(cliente.empresa ?? "");
  const [restricciones, setRestricciones] = useState(cliente.restricciones ?? ""); const [notas, setNotas] = useState(cliente.notas ?? "");
  const [categoria, setCategoria] = useState(cliente.categoria ?? (cliente.empresa ? "empresa" : "amigo"));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await adminWrite("clientes", "update", { nombre, telefono: telefono || null, email: email || null, empresa: empresa || null, restricciones: restricciones || null, notas: notas || null, categoria }, [{ column: "id", value: cliente.id }]);
    onSaved();
  }

  return (
    <Modal title="Editar miembro" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Categoría">
          <CategoriaSelector value={categoria} onChange={setCategoria} />
        </Field>
        <Field label="Nombre" required><Input value={nombre} onChange={setNombre} placeholder="Ej. María García" required /></Field>
        <Field label="Teléfono / WhatsApp"><Input value={telefono} onChange={setTelefono} placeholder="+52 55 1234 5678" /></Field>
        <Field label="Email"><Input value={email} onChange={setEmail} placeholder="correo@ejemplo.com" /></Field>
        <Field label={categoria === "vecino" ? "Colonia / Zona" : "Empresa"}><Input value={empresa} onChange={setEmpresa} placeholder={categoria === "vecino" ? "Ej. Col. Roma Norte" : "Ej. Deloitte, WeWork Roma..."} /></Field>
        <Field label="Restricciones / Alergias"><Input value={restricciones} onChange={setRestricciones} placeholder="Ej. Sin apio, sin jengibre..." /></Field>
        <Field label="Notas"><Input value={notas} onChange={setNotas} placeholder="Observaciones internas..." /></Field>
        <button type="submit" disabled={saving} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2"
          style={{ background: "#F5F0E8", color: "#0D0D0D", opacity: saving ? 0.6 : 1 }}>{saving ? "Guardando..." : "Guardar cambios"}</button>
      </form>
    </Modal>
  );
}

function NuevoPedidoModal({ clienteId, clienteNombre, formulas, balanceDisponible, onClose, onSaved }: {
  clienteId: string; clienteNombre: string; formulas: Formula[]; balanceDisponible: number; onClose: () => void; onSaved: () => void;
}) {
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const [formulaId, setFormulaId] = useState(formulas[0]?.id ?? "");
  const [cantidad, setCantidad] = useState("1"); const [diaEntrega, setDiaEntrega] = useState(todayStr);
  const [notas, setNotas] = useState(""); const [excluidos, setExcluidos] = useState<string[]>([]);
  const [ingredientes, setIngredientes] = useState<{ nombre: string }[]>([]); const [preferencia, setPreferencia] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (formulaId && formulaId !== SORPRESA_ID) {
      supabase.from("recetas").select("ingredientes(nombre)").eq("formula_id", formulaId)
        .then(({ data }) => { const ings = (data ?? []).map((r) => (r.ingredientes as unknown as { nombre: string })).filter(Boolean) as { nombre: string }[]; setIngredientes(ings); setExcluidos([]); });
    } else { setIngredientes([]); setExcluidos([]); }
  }, [formulaId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    let realFormulaId = formulaId; let esSorpresa = false;
    if (formulaId === SORPRESA_ID) { realFormulaId = formulas[Math.floor(Math.random() * formulas.length)]?.id ?? formulas[0]?.id ?? ""; esSorpresa = true; }
    await adminWrite("pedidos", "insert", { cliente_id: clienteId, formula_id: realFormulaId, cantidad: parseInt(cantidad), dia_entrega: diaEntrega, notas: notas || null, tipo_pedido: getTipoPedido(diaEntrega), es_sorpresa: esSorpresa, ingredientes_excluidos: excluidos.length > 0 ? excluidos : null, preferencia_sorpresa: preferencia || null });
    onSaved();
  }

  return (
    <Modal title={`Pedido — ${clienteNombre}`} onClose={onClose}>
      {balanceDisponible > 0 && (
        <div className="rounded-xl px-4 py-3 mb-4 flex items-center gap-2" style={{ background: "rgba(184,134,11,0.08)", border: "1px solid rgba(184,134,11,0.18)" }}>
          <DropIcon size={14} color="#E6A800" />
          <span className="font-inter text-xs" style={{ color: "#E6A800" }}>Balance LUMO disponible: <strong>${balanceDisponible}</strong></span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Fórmula">
          <select value={formulaId} onChange={(e) => setFormulaId(e.target.value)} className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}>
            {formulas.map((f) => <option key={f.id} value={f.id} style={{ background: "#1a1a1a" }}>{f.nombre}</option>)}
            <option value={SORPRESA_ID} style={{ background: "#1a1a1a" }}>Sorpresa</option>
          </select>
        </Field>
        {formulaId === SORPRESA_ID && <div className="rounded-xl px-4 py-3" style={{ background: "rgba(184,134,11,0.12)", border: "1px solid rgba(184,134,11,0.25)" }}><p className="font-inter text-xs" style={{ color: "#E6A800" }}>Se asignará una fórmula al azar al guardar.</p></div>}
        {formulaId !== SORPRESA_ID && ingredientes.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Excluir ingredientes</label>
            <div className="flex flex-wrap gap-2">
              {ingredientes.map((ing) => { const excluido = excluidos.includes(ing.nombre); return (
                <button key={ing.nombre} type="button" onClick={() => setExcluidos((prev) => excluido ? prev.filter((n) => n !== ing.nombre) : [...prev, ing.nombre])}
                  className="rounded-lg px-3 py-1.5 font-inter text-xs transition-all"
                  style={{ background: excluido ? "rgba(224,80,112,0.12)" : "rgba(255,255,255,0.06)", color: excluido ? "#E05070" : "#8A8A8A", border: excluido ? "1px solid rgba(224,80,112,0.3)" : "1px solid rgba(255,255,255,0.08)", textDecoration: excluido ? "line-through" : "none" }}>{ing.nombre}</button>
              ); })}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Preferencia de sabor</label>
          <div className="flex gap-2">
            {["Dulce", "Fresco", "Balanceado"].map((p) => (
              <button key={p} type="button" onClick={() => setPreferencia((prev) => prev === p ? "" : p)}
                className="rounded-lg px-3 py-1.5 font-inter text-xs transition-all"
                style={{ background: preferencia === p ? "rgba(74,94,58,0.25)" : "rgba(255,255,255,0.06)", color: preferencia === p ? "#6DBF67" : "#8A8A8A", border: preferencia === p ? "1px solid rgba(74,94,58,0.4)" : "1px solid rgba(255,255,255,0.08)" }}>{p}</button>
            ))}
          </div>
        </div>
        <Field label="Cantidad">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setCantidad((v) => String(Math.max(1, parseInt(v) - 1)))} className="w-10 h-10 rounded-xl font-inter text-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#F5F0E8" }}>−</button>
            <span className="font-cormorant text-2xl flex-1 text-center" style={{ color: "#F5F0E8" }}>{cantidad}</span>
            <button type="button" onClick={() => setCantidad((v) => String(parseInt(v) + 1))} className="w-10 h-10 rounded-xl font-inter text-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#F5F0E8" }}>+</button>
          </div>
        </Field>
        <Field label="Día de entrega">
          <input type="date" value={diaEntrega} onChange={(e) => setDiaEntrega(e.target.value)} className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", colorScheme: "dark" }} />
        </Field>
        <Field label="Notas (opcional)"><Input value={notas} onChange={setNotas} placeholder="Ej. doble betabel..." /></Field>
        <button type="submit" disabled={saving} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2"
          style={{ background: "#F5F0E8", color: "#0D0D0D", opacity: saving ? 0.6 : 1 }}>{saving ? "Guardando..." : "Guardar pedido"}</button>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "#171717", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-cormorant text-xl font-light" style={{ color: "#F5F0E8" }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)", color: "#8A8A8A" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (<div className="flex flex-col gap-1.5"><label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>{label}{required && <span style={{ color: "#7A2030" }}> *</span>}</label>{children}</div>);
}

function Input({ value, onChange, placeholder, required }: { value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (<input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
    className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}
    onFocus={(e) => (e.currentTarget.style.borderColor = "#4A5E3A")} onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />);
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
      <p className="font-cormorant text-2xl mb-2" style={{ color: "#F5F0E8" }}>Sin miembros aún</p>
      <p className="font-inter text-sm mb-5" style={{ color: "#555" }}>Registra tu primer miembro para empezar.</p>
      <button onClick={onAdd} className="rounded-xl px-5 py-2.5 font-inter text-sm font-medium" style={{ background: "#F5F0E8", color: "#0D0D0D" }}>+ Registrar miembro</button>
    </div>
  );
}

function CategoriaSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cats = [
    { id: "empresa", label: "Empresa", color: "#4A5E3A", icon: "🏢" },
    { id: "vecino", label: "Vecino", color: "#B8860B", icon: "🏠" },
    { id: "amigo", label: "Amigo / Otro", color: "#8A8A8A", icon: "👤" },
  ];
  return (
    <div className="flex gap-2">
      {cats.map((cat) => {
        const active = value === cat.id;
        return (
          <button key={cat.id} type="button" onClick={() => onChange(cat.id)}
            className="flex-1 rounded-xl py-2.5 font-inter text-xs transition-all flex items-center justify-center gap-1.5"
            style={{
              background: active ? `${cat.color}20` : "rgba(255,255,255,0.04)",
              border: active ? `1px solid ${cat.color}50` : "1px solid rgba(255,255,255,0.07)",
              color: active ? cat.color : "#666",
              fontWeight: active ? 500 : 400,
            }}>
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

function Loader() {
  return (<div className="flex justify-center py-16"><div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#4A5E3A", borderTopColor: "transparent" }} /></div>);
}
