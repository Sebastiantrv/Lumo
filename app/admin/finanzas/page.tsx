"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Formula = { id: string; nombre: string; slug: string; color_acento: string; precio: number };

type Pedido = {
  id: string;
  cantidad: number;
  estado: string;
  dia_entrega: string;
  tipo_pedido: string | null;
  es_regalo: boolean;
  descuento: number;
  formula_id: string;
  clientes: { nombre: string } | null;
  formulas: { nombre: string; color_acento: string; precio: number } | null;
};

function getWeekRange(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 + offset * 7);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  return {
    inicio: monday.toISOString().split("T")[0],
    fin: saturday.toISOString().split("T")[0],
    label: `${monday.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} – ${saturday.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`,
  };
}

function precioFinal(p: Pedido): number {
  if (p.es_regalo) return 0;
  const unitario = p.formulas?.precio ?? 0;
  return unitario * p.cantidad * (1 - (p.descuento ?? 0) / 100);
}

export default function FinanzasPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingPrecio, setSavingPrecio] = useState<string | null>(null);
  const [savedPrecio, setSavedPrecio] = useState<string | null>(null);

  const { inicio, fin, label } = getWeekRange(weekOffset);

  async function load() {
    setLoading(true);
    const [{ data: f }, { data: p }] = await Promise.all([
      supabase.from("formulas").select("*").order("nombre"),
      supabase
        .from("pedidos")
        .select("*, clientes(nombre), formulas(nombre, color_acento, precio)")
        .gte("dia_entrega", inicio)
        .lte("dia_entrega", fin)
        .order("dia_entrega"),
    ]);
    setFormulas(f ?? []);
    setPedidos(p ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [weekOffset]);

  async function updatePrecio(formulaId: string, precio: number) {
    setSavingPrecio(formulaId);
    await supabase.from("formulas").update({ precio }).eq("id", formulaId);
    setFormulas((prev) => prev.map((f) => f.id === formulaId ? { ...f, precio } : f));
    setSavingPrecio(null);
    setSavedPrecio(formulaId);
    setTimeout(() => setSavedPrecio(null), 2000);
  }

  async function toggleRegalo(pedidoId: string, actual: boolean) {
    await supabase.from("pedidos").update({ es_regalo: !actual }).eq("id", pedidoId);
    setPedidos((prev) => prev.map((p) => p.id === pedidoId ? { ...p, es_regalo: !actual } : p));
  }

  async function updateDescuento(pedidoId: string, descuento: number) {
    await supabase.from("pedidos").update({ descuento }).eq("id", pedidoId);
    setPedidos((prev) => prev.map((p) => p.id === pedidoId ? { ...p, descuento } : p));
  }

  const pedidosActivos = pedidos.filter((p) => p.tipo_pedido !== "extra" || true);
  const ingresoTotal = pedidosActivos.reduce((s, p) => s + precioFinal(p), 0);
  const pedidosConIngreso = pedidosActivos.filter((p) => !p.es_regalo);
  const regalos = pedidosActivos.filter((p) => p.es_regalo).length;
  const botellasTotales = pedidosActivos.reduce((s, p) => s + p.cantidad, 0);

  const porFormula = formulas.map((f) => {
    const ps = pedidosActivos.filter((p) => p.formula_id === f.id);
    const botellas = ps.reduce((s, p) => s + p.cantidad, 0);
    const ingreso = ps.reduce((s, p) => s + precioFinal(p), 0);
    return { ...f, botellas, ingreso };
  }).filter((f) => f.botellas > 0);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#4A5E3A" }}>Finanzas</p>
          <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2rem" }}>
            ${ingresoTotal.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            <span className="font-inter text-sm ml-2" style={{ color: "#555" }}>esta semana</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((w) => w - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A" }}>‹</button>
          <span className="font-inter text-xs px-3" style={{ color: "#8A8A8A" }}>{label}</span>
          <button onClick={() => setWeekOffset((w) => w + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A" }}>›</button>
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="flex flex-col gap-6">
          {/* Métricas rápidas */}
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Ingresos" value={`$${ingresoTotal.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`} sub={`${pedidosConIngreso.length} pedidos`} color="#4A5E3A" />
            <Metric label="Botellas" value={String(botellasTotales)} sub="vendidas" color="#B8860B" />
            <Metric label="Regalos" value={String(regalos)} sub="pedidos sin cargo" color="#7A2030" />
          </div>

          {/* Por fórmula */}
          {porFormula.length > 0 && (
            <Panel title="Por fórmula">
              <div className="flex flex-col gap-3">
                {porFormula.map((f) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color_acento }} />
                      <span className="font-inter text-sm" style={{ color: "#F5F0E8" }}>{f.nombre}</span>
                      <span className="font-inter text-xs" style={{ color: "#555" }}>{f.botellas} bot.</span>
                    </div>
                    <span className="font-cormorant text-lg" style={{ color: f.color_acento }}>
                      ${f.ingreso.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* Precios por fórmula */}
          <Panel title="Precios por botella">
            <div className="flex flex-col gap-3">
              {formulas.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color_acento }} />
                    <span className="font-inter text-sm" style={{ color: "#F5F0E8" }}>{f.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-inter text-sm" style={{ color: "#555" }}>$</span>
                    <input
                      type="number"
                      defaultValue={f.precio}
                      min={0}
                      step={5}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val !== f.precio) updatePrecio(f.id, val);
                      }}
                      className="w-24 rounded-lg px-3 py-1.5 font-inter text-sm outline-none text-right"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#4A5E3A")}
                    />
                    <span className="font-inter text-xs w-4" style={{ color: "#4A5E3A" }}>
                      {savingPrecio === f.id ? "…" : savedPrecio === f.id ? "✓" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Pedidos de la semana con opciones financieras */}
          {pedidos.length > 0 && (
            <Panel title="Pedidos — ajustes financieros">
              <div className="flex flex-col gap-2">
                {pedidos.map((p) => (
                  <PedidoFinRow key={p.id} p={p} onToggleRegalo={toggleRegalo} onDescuento={updateDescuento} />
                ))}
              </div>
            </Panel>
          )}

          {pedidos.length === 0 && (
            <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
              <p className="font-inter text-sm" style={{ color: "#555" }}>Sin pedidos esta semana.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PedidoFinRow({ p, onToggleRegalo, onDescuento }: {
  p: Pedido;
  onToggleRegalo: (id: string, actual: boolean) => void;
  onDescuento: (id: string, d: number) => void;
}) {
  const [desc, setDesc] = useState(p.descuento ?? 0);
  const total = precioFinal(p);

  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3"
      style={{ background: p.es_regalo ? "rgba(122,32,48,0.06)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex-1 min-w-0">
        <p className="font-inter text-sm truncate" style={{ color: "#F5F0E8" }}>
          {p.clientes?.nombre ?? "—"}
        </p>
        <p className="font-inter text-xs" style={{ color: p.formulas?.color_acento ?? "#8A8A8A" }}>
          {p.formulas?.nombre} ×{p.cantidad} · {new Date(p.dia_entrega + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })}
        </p>
      </div>

      {/* Descuento */}
      {!p.es_regalo && (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={desc}
            min={0}
            max={100}
            step={5}
            onChange={(e) => setDesc(Number(e.target.value))}
            onBlur={() => onDescuento(p.id, desc)}
            className="w-14 rounded-lg px-2 py-1 font-inter text-xs outline-none text-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#F5F0E8" }}
          />
          <span className="font-inter text-xs" style={{ color: "#555" }}>%</span>
        </div>
      )}

      {/* Regalo toggle */}
      <button
        onClick={() => onToggleRegalo(p.id, p.es_regalo)}
        className="rounded-lg px-2.5 py-1 font-inter text-xs transition-all"
        style={{
          background: p.es_regalo ? "rgba(122,32,48,0.2)" : "rgba(255,255,255,0.05)",
          color: p.es_regalo ? "#7A2030" : "#555",
        }}>
        {p.es_regalo ? "♥ Regalo" : "Regalo"}
      </button>

      {/* Total */}
      <span className="font-cormorant text-lg w-16 text-right"
        style={{ color: p.es_regalo ? "#444" : "#F5F0E8" }}>
        {p.es_regalo ? "—" : `$${total.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`}
      </span>
    </div>
  );
}

function Metric({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="font-inter text-xs uppercase tracking-widest mb-2" style={{ color: "#8A8A8A" }}>{label}</p>
      <p className="font-cormorant font-light" style={{ fontSize: "2rem", color: "#F5F0E8", lineHeight: 1 }}>{value}</p>
      <p className="font-inter text-xs mt-2" style={{ color }}>{sub}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <h2 className="font-inter text-xs uppercase tracking-widest mb-4" style={{ color: "#8A8A8A" }}>{title}</h2>
      {children}
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
