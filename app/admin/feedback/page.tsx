"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { adminWrite } from "@/lib/admin-api";

type Feedback = {
  id: string;
  nombre: string;
  sabor_rating: number;
  sensacion_sabor: string;
  frescura_rating: number;
  experiencia_lumo: string;
  recomendacion: string;
  precio_justo: string;
  razon_adopcion: string;
  mejora_abierta: string | null;
  submitted_at: string;
  created_at: string;
  formula_asignada: string | null;
  numero_pedido: number | null;
  pedido_token: string | null;
};

type ClienteConFormula = {
  nombre: string;
  formula_nombre: string;
  formula_color: string;
};

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  const partsA = na.split(/\s+/);
  const partsB = nb.split(/\s+/);
  const match = partsA.filter((p) => partsB.some((q) => q === p || q.includes(p) || p.includes(q)));
  if (match.length > 0) return match.length / Math.max(partsA.length, partsB.length);
  return 0;
}

function ratingColor(n: number): string {
  if (n <= 2) return "#E05070";
  if (n === 3) return "#E6A800";
  return "#6DBF67";
}

const FORMULA_COLORS: Record<string, string> = {
  verde: "#4A5E3A",
  rojo: "#7A2030",
  tropical: "#B8860B",
};

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [clientes, setClientes] = useState<ClienteConFormula[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("todos");

  async function load() {
    const [{ data: fb }, { data: pedidos }] = await Promise.all([
      supabase.from("feedback").select("*").order("created_at", { ascending: false }),
      supabase.from("pedidos").select("clientes(nombre), formulas(nombre, color_acento)").not("clientes", "is", null),
    ]);

    setItems(fb ?? []);

    const clienteMap = new Map<string, ClienteConFormula>();
    for (const p of pedidos ?? []) {
      const c = p.clientes as unknown as { nombre: string } | null;
      const f = p.formulas as unknown as { nombre: string; color_acento: string } | null;
      if (c?.nombre && f?.nombre && !clienteMap.has(c.nombre)) {
        clienteMap.set(c.nombre, { nombre: c.nombre, formula_nombre: f.nombre, formula_color: f.color_acento });
      }
    }
    setClientes(Array.from(clienteMap.values()));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function asignarFormula(feedbackId: string, formula: string) {
    await adminWrite("feedback", "update", { formula_asignada: formula }, [{ column: "id", value: feedbackId }]);
    setItems((prev) => prev.map((i) => i.id === feedbackId ? { ...i, formula_asignada: formula } : i));
  }

  if (loading) return <Loader />;

  function matchFormula(fb: Feedback): { nombre: string; color: string } | null {
    if (fb.formula_asignada) {
      const slug = fb.formula_asignada.toLowerCase();
      return { nombre: fb.formula_asignada, color: FORMULA_COLORS[slug] ?? "#8A8A8A" };
    }
    let best: ClienteConFormula | null = null;
    let bestScore = 0;
    for (const c of clientes) {
      const s = similarity(fb.nombre, c.nombre);
      if (s > bestScore) { bestScore = s; best = c; }
    }
    if (best && bestScore >= 0.5) {
      return { nombre: best.formula_nombre, color: best.formula_color };
    }
    return null;
  }

  type MatchedFeedback = Feedback & { matchedFormula: { nombre: string; color: string } | null };
  const matched: MatchedFeedback[] = items.map((fb) => ({ ...fb, matchedFormula: matchFormula(fb) }));

  const formulaNames = Array.from(new Set(clientes.map((c) => c.formula_nombre))).sort();
  const pendientes = matched.filter((fb) => !fb.matchedFormula);
  const byFormula = formulaNames.map((name) => ({
    nombre: name,
    color: clientes.find((c) => c.formula_nombre === name)?.formula_color ?? "#8A8A8A",
    items: matched.filter((fb) => fb.matchedFormula?.nombre === name),
  })).filter((g) => g.items.length > 0);

  const total = items.length;
  const avgSabor = total > 0 ? items.reduce((s, i) => s + i.sabor_rating, 0) / total : 0;
  const avgFrescura = total > 0 ? items.reduce((s, i) => s + i.frescura_rating, 0) / total : 0;

  const tabs = [
    { id: "todos", label: "Todos", count: total },
    ...byFormula.map((g) => ({ id: g.nombre, label: g.nombre, count: g.items.length })),
    ...(pendientes.length > 0 ? [{ id: "pendiente", label: "Pendiente", count: pendientes.length }] : []),
  ];

  const visibleItems = activeTab === "todos"
    ? matched
    : activeTab === "pendiente"
    ? pendientes
    : matched.filter((fb) => fb.matchedFormula?.nombre === activeTab);

  const visibleAvgSabor = visibleItems.length > 0 ? visibleItems.reduce((s, i) => s + i.sabor_rating, 0) / visibleItems.length : 0;
  const visibleAvgFrescura = visibleItems.length > 0 ? visibleItems.reduce((s, i) => s + i.frescura_rating, 0) / visibleItems.length : 0;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#4A5E3A" }}>Feedback</p>
        <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2rem" }}>
          {total} respuesta{total !== 1 ? "s" : ""}
        </h1>
      </div>

      {/* Tabs */}
      {total > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            const tabColor = tab.id === "pendiente" ? "#B8860B"
              : tab.id === "todos" ? "#4A5E3A"
              : byFormula.find((g) => g.nombre === tab.id)?.color ?? "#4A5E3A";
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="rounded-full px-4 py-2 font-inter text-xs whitespace-nowrap transition-all shrink-0"
                style={{
                  background: active ? `${tabColor}20` : "rgba(255,255,255,0.04)",
                  border: active ? `1px solid ${tabColor}60` : "1px solid rgba(255,255,255,0.07)",
                  color: active ? tabColor : "#8A8A8A",
                  fontWeight: active ? 500 : 400,
                }}>
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>
      )}

      {/* Metrics for visible items */}
      {visibleItems.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <MetricCard label="Respuestas" value={String(visibleItems.length)} />
          <MetricCard label="Sabor" value={`${visibleAvgSabor.toFixed(1)} / 5`} />
          <MetricCard label="Frescura" value={`${visibleAvgFrescura.toFixed(1)} / 5`} />
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
          <p className="font-cormorant text-2xl mb-2" style={{ color: "#F5F0E8" }}>Sin feedback aún</p>
          <p className="font-inter text-sm" style={{ color: "#555" }}>Los resultados aparecerán aquí cuando alguien responda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visibleItems.map((fb) => (
            <FeedbackCard
              key={fb.id}
              fb={fb}
              matchedFormula={fb.matchedFormula}
              formulaNames={formulaNames}
              onAsignar={asignarFormula}
              showPendiente={activeTab === "pendiente" || (activeTab === "todos" && !fb.matchedFormula)}
            />
          ))}
          {visibleItems.length === 0 && (
            <p className="font-inter text-sm py-4 text-center" style={{ color: "#555" }}>Sin respuestas en esta categoría.</p>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="font-inter text-xs uppercase tracking-widest" style={{ color: "#555" }}>{label}</p>
      <p className="font-cormorant font-light" style={{ fontSize: "1.6rem", color: "#F5F0E8" }}>{value}</p>
    </div>
  );
}

function FeedbackCard({ fb, matchedFormula, formulaNames, onAsignar, showPendiente }: {
  fb: Feedback;
  matchedFormula: { nombre: string; color: string } | null;
  formulaNames: string[];
  onAsignar: (id: string, formula: string) => void;
  showPendiente: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const pills = [
    fb.sensacion_sabor,
    fb.experiencia_lumo,
    ...(fb.recomendacion ? fb.recomendacion.split(" | ") : []),
    fb.precio_justo,
    ...(fb.razon_adopcion ? fb.razon_adopcion.split(" | ") : []),
  ].filter(Boolean);

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: matchedFormula ? `1px solid ${matchedFormula.color}30` : "1px solid rgba(255,255,255,0.07)",
      }}>
      {/* Top: name, formula badge, date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-inter text-sm font-medium truncate" style={{ color: "#F5F0E8" }}>{fb.nombre}</span>
          {fb.numero_pedido && (
            <span className="font-inter text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#8A8A8A" }}>#{fb.numero_pedido}</span>
          )}
          {matchedFormula && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 font-inter text-xs px-2 py-0.5 rounded-full shrink-0 transition-all group"
              style={{ background: `${matchedFormula.color}20`, color: matchedFormula.color, border: `1px solid ${matchedFormula.color}40` }}
              title="Cambiar fórmula"
            >
              {matchedFormula.nombre}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-40 group-hover:opacity-100 transition-opacity">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>
        <span className="font-inter text-xs shrink-0" style={{ color: "#555" }}>{fb.submitted_at}</span>
      </div>

      {/* Formula selector: shown when pending or editing */}
      {(editing || (showPendiente && !matchedFormula)) && (
        <div className="flex items-center gap-2">
          <span className="font-inter text-xs" style={{ color: "#B8860B" }}>
            {matchedFormula ? "Cambiar fórmula:" : "Sin fórmula asignada:"}
          </span>
          <div className="flex gap-1.5">
            {formulaNames.map((name) => (
              <button key={name} onClick={() => { onAsignar(fb.id, name); setEditing(false); }}
                className="font-inter text-xs px-2.5 py-1 rounded-lg transition-all"
                style={{
                  background: matchedFormula?.nombre === name ? `${matchedFormula.color}20` : "rgba(255,255,255,0.06)",
                  color: matchedFormula?.nombre === name ? matchedFormula.color : "#8A8A8A",
                  border: matchedFormula?.nombre === name ? `1px solid ${matchedFormula.color}40` : "1px solid rgba(255,255,255,0.1)",
                }}>
                {name}
              </button>
            ))}
          </div>
          {editing && (
            <button onClick={() => setEditing(false)}
              className="font-inter text-xs px-2 py-1 rounded-lg transition-all"
              style={{ color: "#555" }}>
              ✕
            </button>
          )}
        </div>
      )}

      {/* Ratings */}
      <div className="flex items-center gap-4">
        <span className="font-inter text-xs" style={{ color: "#8A8A8A" }}>
          Sabor: <span style={{ color: ratingColor(fb.sabor_rating), fontWeight: 500 }}>{fb.sabor_rating}/5</span>
        </span>
        <span className="font-inter text-xs" style={{ color: "#8A8A8A" }}>
          Frescura: <span style={{ color: ratingColor(fb.frescura_rating), fontWeight: 500 }}>{fb.frescura_rating}/5</span>
        </span>
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-1.5">
        {pills.map((p, i) => (
          <span key={i} className="font-inter text-xs px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.06)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}>
            {p}
          </span>
        ))}
      </div>

      {/* Mejora abierta */}
      {fb.mejora_abierta && (
        <p className="font-inter text-sm italic" style={{ color: "#555" }}>&ldquo;{fb.mejora_abierta}&rdquo;</p>
      )}
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
