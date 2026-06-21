"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SORPRESA_ID = "__sorpresa__";

type ClienteOption = { id: string; nombre: string };
type FormulaOption = { id: string; nombre: string };

function getTipoPedido(diaEntrega: string): "normal" | "domingo" | "extra" {
  const hoy = new Date();
  const dow = hoy.getDay();
  if (dow === 0) return "domingo";
  if (dow === 6) return "normal";
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - dow + 1);
  const sabado = new Date(lunes);
  sabado.setDate(lunes.getDate() + 5);
  const lunesStr = `${lunes.getFullYear()}-${String(lunes.getMonth()+1).padStart(2,"0")}-${String(lunes.getDate()).padStart(2,"0")}`;
  const sabadoStr = `${sabado.getFullYear()}-${String(sabado.getMonth()+1).padStart(2,"0")}-${String(sabado.getDate()).padStart(2,"0")}`;
  if (diaEntrega >= lunesStr && diaEntrega <= sabadoStr) return "extra";
  return "normal";
}

type Pedido = {
  id: string;
  cantidad: number;
  estado: string;
  dia_entrega: string;
  formula_id: string;
  clientes: { nombre: string } | null;
  formulas: { nombre: string; slug: string; color_acento: string } | null;
};

function localStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(base: string, n: number) {
  const d = new Date(base + "T12:00:00");
  d.setDate(d.getDate() + n);
  return localStr(d);
}

function todayStr() {
  return localStr(new Date());
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getWeekRange(offset = 0) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  return {
    inicio: localStr(monday),
    fin: localStr(saturday),
    label: `${monday.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} – ${saturday.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`,
  };
}

export default function AdminInicio() {
  const [pedidosHoy, setPedidosHoy] = useState<Pedido[]>([]);
  const [pedidosSemana, setPedidosSemana] = useState<Pedido[]>([]);
  const [compras, setCompras] = useState<{ ingrediente: string; gramos: number; unidad: string }[]>([]);
  const [numClientes, setNumClientes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dayOffset, setDayOffset] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const [showNuevoPedido, setShowNuevoPedido] = useState(false);
  const [clientes, setClientes] = useState<ClienteOption[]>([]);
  const [formulas, setFormulas] = useState<FormulaOption[]>([]);

  const baseToday = todayStr();
  const fecha = addDays(baseToday, dayOffset);
  const fechaLabel = new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const isActualToday = dayOffset === 0;

  const { inicio, fin, label: weekLabel } = getWeekRange(weekOffset);
  const isCurrentWeek = weekOffset === 0;

  async function load() {
    const [hoyRes, semanaRes, clientesRes, recetasRes, clientesListRes, formulasListRes] = await Promise.all([
      supabase.from("pedidos").select("*, clientes(nombre), formulas(nombre, slug, color_acento)").eq("dia_entrega", fecha).order("created_at"),
      supabase.from("pedidos").select("*, clientes(nombre), formulas(nombre, slug, color_acento)").gte("dia_entrega", inicio).lte("dia_entrega", fin).order("dia_entrega"),
      supabase.from("clientes").select("id", { count: "exact", head: true }),
      supabase.from("recetas").select("formula_id, gramos, ingredientes(nombre, unidad)"),
      supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
      supabase.from("formulas").select("id, nombre").order("nombre"),
    ]);

    setPedidosHoy(hoyRes.data ?? []);
    setPedidosSemana(semanaRes.data ?? []);
    setNumClientes(clientesRes.count ?? 0);
    setClientes(clientesListRes.data ?? []);
    setFormulas(formulasListRes.data ?? []);

    const totales: Record<string, { gramos: number; unidad: string }> = {};
    for (const pedido of semanaRes.data ?? []) {
      for (const r of (recetasRes.data ?? []).filter((r) => r.formula_id === (pedido as any).formula_id)) {
        const ing = r.ingredientes as any;
        if (!totales[ing.nombre]) totales[ing.nombre] = { gramos: 0, unidad: ing.unidad };
        totales[ing.nombre].gramos += r.gramos * pedido.cantidad;
      }
    }
    setCompras(Object.entries(totales).map(([ingrediente, v]) => ({ ingrediente, ...v })).sort((a, b) => b.gramos - a.gramos));
    setLoading(false);
  }

  useEffect(() => { load(); }, [fecha, inicio, fin]);

  if (loading) return <PageLoader />;

  const botellasHoy = pedidosHoy.reduce((s, p) => s + p.cantidad, 0);
  const pendientesHoy = pedidosHoy.filter((p) => p.estado !== "entregado").length;
  const botellasSemana = pedidosSemana.reduce((s, p) => s + p.cantidad, 0);

  const resumenHoy = pedidosHoy.reduce<Record<string, { nombre: string; color: string; total: number }>>((acc, p) => {
    const slug = p.formulas?.slug ?? "?";
    if (!acc[slug]) acc[slug] = { nombre: p.formulas?.nombre ?? slug, color: p.formulas?.color_acento ?? "#888", total: 0 };
    acc[slug].total += p.cantidad;
    return acc;
  }, {});

  const proximos = pedidosSemana
    .filter((p) => p.dia_entrega > fecha)
    .sort((a, b) => a.dia_entrega.localeCompare(b.dia_entrega));
  const proximaFecha = proximos[0]?.dia_entrega;
  const proximaEntrega = proximaFecha
    ? { fecha: proximaFecha, pedidos: proximos.filter((p) => p.dia_entrega === proximaFecha) }
    : null;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <p className="font-inter text-sm mb-1" style={{ color: "#4A5E3A", letterSpacing: "0.1em" }}>{greeting()}, Sebastián</p>
        <h1 className="font-cormorant font-light text-[#F5F0E8] capitalize" style={{ fontSize: "2.2rem" }}>
          {new Date(localStr(new Date()) + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </h1>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <MetricCard label="Hoy" value={botellasHoy} unit="botellas" accent="#4A5E3A"
          sub={pendientesHoy > 0 ? `${pendientesHoy} pendiente${pendientesHoy > 1 ? "s" : ""}` : botellasHoy > 0 ? "Todo entregado" : "Sin pedidos"} href="/admin/hoy" />
        <MetricCard label="Esta semana" value={botellasSemana} unit="botellas" accent="#B8860B"
          sub={`${pedidosSemana.length} pedido${pedidosSemana.length !== 1 ? "s" : ""}`} href="/admin/semana" />
        <MetricCard label="Clientes" value={numClientes} unit="registrados" accent="#7A2030"
          sub="Ver todos" href="/admin/clientes" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Producción del día — con navegación */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Producción del día</h2>
              <p className="font-inter text-xs mt-0.5 capitalize" style={{ color: isActualToday ? "#4A5E3A" : "#B8860B" }}>
                {isActualToday ? "hoy · " : ""}{fechaLabel}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <NavBtn onClick={() => setDayOffset((d) => d - 1)}>‹</NavBtn>
              {!isActualToday && (
                <button onClick={() => setDayOffset(0)}
                  className="font-inter text-xs px-2 py-1 rounded-lg"
                  style={{ background: "rgba(74,94,58,0.15)", color: "#4A5E3A" }}>
                  Hoy
                </button>
              )}
              <NavBtn onClick={() => setDayOffset((d) => d + 1)}>›</NavBtn>
              <Link href="/admin/hoy" className="font-inter text-xs ml-1" style={{ color: "#4A5E3A" }}>Gestionar →</Link>
            </div>
          </div>
          {botellasHoy === 0 ? (
            <Empty texto="No hay pedidos para este día" />
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(resumenHoy).map(([slug, { nombre, color, total }]) => (
                <div key={slug} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-inter text-sm" style={{ color: "#F5F0E8" }}>{nombre}</span>
                  </div>
                  <span className="font-cormorant text-lg" style={{ color }}>{total} bot.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Esta semana — con navegación */}
        <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Esta semana</h2>
              <p className="font-inter text-xs mt-0.5" style={{ color: isCurrentWeek ? "#B8860B" : "#8A8A8A" }}>{weekLabel}</p>
            </div>
            <div className="flex items-center gap-1">
              <NavBtn onClick={() => setWeekOffset((w) => w - 1)}>‹</NavBtn>
              {!isCurrentWeek && (
                <button onClick={() => setWeekOffset(0)}
                  className="font-inter text-xs px-2 py-1 rounded-lg"
                  style={{ background: "rgba(184,134,11,0.15)", color: "#B8860B" }}>
                  Actual
                </button>
              )}
              <NavBtn onClick={() => setWeekOffset((w) => w + 1)}>›</NavBtn>
              <Link href="/admin/semana" className="font-inter text-xs ml-1" style={{ color: "#4A5E3A" }}>Ver →</Link>
            </div>
          </div>
          {pedidosSemana.length === 0 ? (
            <Empty texto="Sin pedidos esta semana" />
          ) : (() => {
            const agrupado = pedidosSemana.reduce<Record<string, { nombre: string; color: string; total: number }>>((acc, p) => {
              const slug = p.formulas?.slug ?? "?";
              if (!acc[slug]) acc[slug] = { nombre: p.formulas?.nombre ?? slug, color: p.formulas?.color_acento ?? "#888", total: 0 };
              acc[slug].total += p.cantidad;
              return acc;
            }, {});
            return (
              <div className="flex flex-col gap-3">
                {Object.entries(agrupado).map(([slug, { nombre, color, total }]) => (
                  <div key={slug} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-inter text-sm" style={{ color: "#F5F0E8" }}>{nombre}</span>
                    </div>
                    <span className="font-cormorant text-lg" style={{ color }}>×{total}</span>
                  </div>
                ))}
                <p className="font-inter text-xs mt-1" style={{ color: "#555" }}>
                  {pedidosSemana.length} pedido{pedidosSemana.length !== 1 ? "s" : ""} · {botellasSemana} botellas
                </p>
              </div>
            );
          })()}
        </div>

        {/* Compras de la semana */}
        <Panel title={`Compras · ${weekLabel}`} href="/admin/compras" linkLabel="Ver lista">
          {compras.length === 0 ? (
            <Empty texto="Sin ingredientes por comprar" />
          ) : (
            <div className="flex flex-col gap-2.5">
              {compras.slice(0, 5).map((c) => (
                <div key={c.ingrediente} className="flex items-center justify-between">
                  <span className="font-inter text-sm" style={{ color: "#F5F0E8" }}>{c.ingrediente}</span>
                  <span className="font-cormorant text-base" style={{ color: "#4A5E3A" }}>{fmt(c.gramos, c.unidad)}</span>
                </div>
              ))}
              {compras.length > 5 && <p className="font-inter text-xs mt-1" style={{ color: "#555" }}>+{compras.length - 5} más</p>}
            </div>
          )}
        </Panel>

        {/* Accesos rápidos */}
        <Panel title="Accesos rápidos">
          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => setShowNuevoPedido(true)}
              className="rounded-xl px-4 py-3.5 font-inter text-sm transition-all flex items-center gap-2"
              style={{ background: "#4A5E3A14", border: "1px solid #4A5E3A30", color: "#F5F0E8" }}>
              <span style={{ color: "#4A5E3A" }}>+</span> Nuevo pedido
            </button>
            <QuickAction href="/admin/clientes" label="Nuevo cliente" color="#7A2030" />
            <QuickAction href="/admin/compras" label="Lista de compras" color="#B8860B" />
            <QuickAction href="/admin/recetas" label="Editar recetas" color="#8A8A8A" />
          </div>
        </Panel>
      </div>

      {showNuevoPedido && (
        <NuevoPedidoModal
          clientes={clientes}
          formulas={formulas}
          onClose={() => setShowNuevoPedido(false)}
          onSaved={() => { setShowNuevoPedido(false); load(); }}
        />
      )}
    </div>
  );
}

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-7 h-7 rounded-lg flex items-center justify-center font-inter text-sm transition-colors"
      style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A" }}>
      {children}
    </button>
  );
}

function fmt(g: number, u: string) {
  if (u === "g") return g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${g} g`;
  return `${g} ${u}`;
}

function MetricCard({ label, value, unit, sub, accent, href }: { label: string; value: number; unit: string; sub: string; accent: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl p-5 transition-all block"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="font-inter text-xs uppercase tracking-widest mb-2" style={{ color: "#8A8A8A" }}>{label}</p>
      <p className="font-cormorant font-light" style={{ fontSize: "2.6rem", color: "#F5F0E8", lineHeight: 1 }}>
        {value}<span className="font-inter text-xs ml-1.5" style={{ color: "#555" }}>{unit}</span>
      </p>
      <p className="font-inter text-xs mt-2" style={{ color: accent }}>{sub}</p>
    </Link>
  );
}

function Panel({ title, href, linkLabel, children }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>{title}</h2>
        {href && linkLabel && (
          <Link href={href} className="font-inter text-xs" style={{ color: "#4A5E3A" }}>{linkLabel} →</Link>
        )}
      </div>
      {children}
    </div>
  );
}

function QuickAction({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <Link href={href} className="rounded-xl px-4 py-3.5 font-inter text-sm transition-all flex items-center gap-2"
      style={{ background: `${color}14`, border: `1px solid ${color}30`, color: "#F5F0E8" }}>
      <span style={{ color }}>+</span> {label}
    </Link>
  );
}

function Empty({ texto }: { texto: string }) {
  return <p className="font-inter text-sm py-2" style={{ color: "#555" }}>{texto}</p>;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#4A5E3A", borderTopColor: "transparent" }} />
    </div>
  );
}

function NuevoPedidoModal({ clientes, formulas, onClose, onSaved }: {
  clientes: ClienteOption[]; formulas: FormulaOption[]; onClose: () => void; onSaved: () => void;
}) {
  const d = new Date();
  const hoyStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const [clienteId, setClienteId] = useState("");
  const [formulaId, setFormulaId] = useState(formulas[0]?.id ?? "");
  const [cantidad, setCantidad] = useState("1");
  const [diaEntrega, setDiaEntrega] = useState(hoyStr);
  const [notas, setNotas] = useState("");
  const [excluidos, setExcluidos] = useState<string[]>([]);
  const [ingredientes, setIngredientes] = useState<{ nombre: string }[]>([]);
  const [preferencia, setPreferencia] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (formulaId && formulaId !== SORPRESA_ID) {
      supabase.from("recetas").select("ingredientes(nombre)").eq("formula_id", formulaId)
        .then(({ data }) => {
          const ings = (data ?? []).map((r: any) => r.ingredientes as { nombre: string } | null).filter(Boolean) as { nombre: string }[];
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
    if (!clienteId) return;
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

  const selectStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8",
    borderRadius: 12, padding: "12px 16px", fontSize: "0.875rem", width: "100%", outline: "none",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: "#171717", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-cormorant text-xl font-light" style={{ color: "#F5F0E8" }}>Nuevo pedido</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", color: "#8A8A8A" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>
              Cliente<span style={{ color: "#7A2030" }}> *</span>
            </label>
            <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required style={selectStyle}>
              <option value="" style={{ background: "#1a1a1a" }}>Seleccionar cliente...</option>
              {clientes.map((c) => <option key={c.id} value={c.id} style={{ background: "#1a1a1a" }}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Fórmula</label>
            <select value={formulaId} onChange={(e) => setFormulaId(e.target.value)} style={selectStyle}>
              {formulas.map((f) => <option key={f.id} value={f.id} style={{ background: "#1a1a1a" }}>{f.nombre}</option>)}
              <option value={SORPRESA_ID} style={{ background: "#1a1a1a" }}>🎲 Sorpresa</option>
            </select>
          </div>

          {formulaId === SORPRESA_ID && (
            <div className="rounded-xl px-4 py-3" style={{ background: "rgba(184,134,11,0.12)", border: "1px solid rgba(184,134,11,0.25)" }}>
              <p className="font-inter text-xs" style={{ color: "#E6A800" }}>🎲 Se asignará una fórmula al azar.</p>
            </div>
          )}

          {formulaId !== SORPRESA_ID && ingredientes.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Excluir ingredientes</label>
              <div className="flex flex-wrap gap-2">
                {ingredientes.map((ing) => {
                  const ex = excluidos.includes(ing.nombre);
                  return (
                    <button key={ing.nombre} type="button" onClick={() => setExcluidos((prev) => ex ? prev.filter((n) => n !== ing.nombre) : [...prev, ing.nombre])}
                      className="rounded-lg px-3 py-1.5 font-inter text-xs transition-all"
                      style={{ background: ex ? "rgba(224,80,112,0.12)" : "rgba(255,255,255,0.06)", color: ex ? "#E05070" : "#8A8A8A", border: ex ? "1px solid rgba(224,80,112,0.3)" : "1px solid rgba(255,255,255,0.08)", textDecoration: ex ? "line-through" : "none" }}>
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

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Cantidad</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setCantidad((v) => String(Math.max(1, parseInt(v) - 1)))}
                className="w-10 h-10 rounded-xl font-inter text-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#F5F0E8" }}>−</button>
              <span className="font-cormorant text-2xl flex-1 text-center" style={{ color: "#F5F0E8" }}>{cantidad}</span>
              <button type="button" onClick={() => setCantidad((v) => String(parseInt(v) + 1))}
                className="w-10 h-10 rounded-xl font-inter text-lg" style={{ background: "rgba(255,255,255,0.06)", color: "#F5F0E8" }}>+</button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Día de entrega</label>
            <input type="date" value={diaEntrega} onChange={(e) => setDiaEntrega(e.target.value)}
              className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", colorScheme: "dark" }} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>Notas (opcional)</label>
            <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej. doble betabel..."
              className="w-full rounded-xl px-4 py-3 font-inter text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }} />
          </div>

          <button type="submit" disabled={saving || !clienteId} className="w-full rounded-xl py-3 font-inter text-sm font-medium mt-2"
            style={{ background: "#F5F0E8", color: "#0D0D0D", opacity: saving || !clienteId ? 0.5 : 1 }}>
            {saving ? "Guardando..." : "Crear pedido"}
          </button>
        </form>
      </div>
    </div>
  );
}
