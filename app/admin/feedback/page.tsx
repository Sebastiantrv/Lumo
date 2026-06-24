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
  archivado: boolean;
};

const VERDE = "#4A5E3A";
const ROJO = "#7A2030";
const TROPICAL = "#B8860B";

const FORMULA_COLORS: Record<string, string> = {
  verde: VERDE,
  rojo: ROJO,
  tropical: TROPICAL,
};

function ratingColor(n: number): string {
  if (n <= 2) return "#E05070";
  if (n === 3) return "#E6A800";
  return "#6DBF67";
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"activos" | "archivados">("activos");
  const [formulaFilter, setFormulaFilter] = useState<string>("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    const { data: fb } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(fb ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function archivar(id: string) {
    await adminWrite("feedback", "update", { archivado: true }, [{ column: "id", value: id }]);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, archivado: true } : i));
  }

  async function desarchivar(id: string) {
    await adminWrite("feedback", "update", { archivado: false }, [{ column: "id", value: id }]);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, archivado: false } : i));
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: VERDE, borderTopColor: "transparent" }} />
    </div>
  );

  const activos = items.filter((i) => !i.archivado);
  const archivados = items.filter((i) => i.archivado);
  const pool = view === "activos" ? activos : archivados;

  const formulasPresentes = Array.from(new Set(
    activos
      .map((fb) => fb.formula_asignada)
      .filter(Boolean) as string[]
  )).sort();

  const filtered = formulaFilter === "todos"
    ? pool
    : pool.filter((fb) => fb.formula_asignada === formulaFilter);

  // Metrics (from activos only)
  const n = activos.length;
  const avgSabor = n > 0 ? activos.reduce((s, i) => s + i.sabor_rating, 0) / n : 0;
  const avgFrescura = n > 0 ? activos.reduce((s, i) => s + i.frescura_rating, 0) / n : 0;

  const precioMap: Record<string, number> = {};
  for (const fb of activos) {
    if (fb.precio_justo) precioMap[fb.precio_justo] = (precioMap[fb.precio_justo] ?? 0) + 1;
  }
  const precioModa = Object.entries(precioMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const expMap: Record<string, number> = {};
  for (const fb of activos) {
    if (fb.experiencia_lumo) expMap[fb.experiencia_lumo] = (expMap[fb.experiencia_lumo] ?? 0) + 1;
  }
  const expModa = Object.entries(expMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const conMejora = activos.filter((fb) => fb.mejora_abierta).length;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: VERDE }}>Feedback</p>
        <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2rem" }}>
          Retroalimentación
        </h1>
      </div>

      {/* Metrics row */}
      {n > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Respuestas" value={String(n)} accent={VERDE} />
          <MetricCard label="Sabor" value={`${avgSabor.toFixed(1)}`} sub="/ 5" accent={ratingColor(Math.round(avgSabor))} />
          <MetricCard label="Frescura" value={`${avgFrescura.toFixed(1)}`} sub="/ 5" accent={ratingColor(Math.round(avgFrescura))} />
          <MetricCard label="Precio percibido" value={precioModa} accent={TROPICAL} />
        </div>
      )}

      {/* Secondary insights */}
      {n > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-inter text-[0.65rem] uppercase tracking-widest mb-1" style={{ color: "#555" }}>Experiencia más común</p>
            <p className="font-inter text-sm" style={{ color: "#F5F0E8" }}>{expModa}</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-inter text-[0.65rem] uppercase tracking-widest mb-1" style={{ color: "#555" }}>Con comentarios</p>
            <p className="font-inter text-sm" style={{ color: "#F5F0E8" }}>{conMejora} de {n}</p>
          </div>
        </div>
      )}

      {/* View toggle + formula filter */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
          <button
            onClick={() => { setView("activos"); setFormulaFilter("todos"); }}
            className="rounded-lg px-3 py-1.5 font-inter text-xs transition-all"
            style={{
              background: view === "activos" ? "rgba(255,255,255,0.08)" : "transparent",
              color: view === "activos" ? "#F5F0E8" : "#666",
              fontWeight: view === "activos" ? 500 : 400,
            }}
          >
            Activos ({activos.length})
          </button>
          <button
            onClick={() => { setView("archivados"); setFormulaFilter("todos"); }}
            className="rounded-lg px-3 py-1.5 font-inter text-xs transition-all"
            style={{
              background: view === "archivados" ? "rgba(255,255,255,0.08)" : "transparent",
              color: view === "archivados" ? "#F5F0E8" : "#666",
              fontWeight: view === "archivados" ? 500 : 400,
            }}
          >
            Archivados ({archivados.length})
          </button>
        </div>

        {/* Formula filter pills */}
        {view === "activos" && formulasPresentes.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => setFormulaFilter("todos")}
              className="rounded-full px-3 py-1 font-inter text-xs shrink-0 transition-all"
              style={{
                background: formulaFilter === "todos" ? `${VERDE}20` : "rgba(255,255,255,0.04)",
                border: formulaFilter === "todos" ? `1px solid ${VERDE}60` : "1px solid rgba(255,255,255,0.07)",
                color: formulaFilter === "todos" ? VERDE : "#8A8A8A",
              }}
            >
              Todos
            </button>
            {formulasPresentes.map((name) => {
              const color = FORMULA_COLORS[name.toLowerCase().split(" ")[0]] ?? "#8A8A8A";
              const active = formulaFilter === name;
              return (
                <button key={name} onClick={() => setFormulaFilter(name)}
                  className="rounded-full px-3 py-1 font-inter text-xs shrink-0 transition-all"
                  style={{
                    background: active ? `${color}20` : "rgba(255,255,255,0.04)",
                    border: active ? `1px solid ${color}60` : "1px solid rgba(255,255,255,0.07)",
                    color: active ? color : "#8A8A8A",
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
          <p className="font-cormorant text-2xl mb-2" style={{ color: "#F5F0E8" }}>
            {items.length === 0 ? "Sin feedback aún" : view === "archivados" ? "Sin archivados" : "Sin resultados"}
          </p>
          <p className="font-inter text-sm" style={{ color: "#555" }}>
            {items.length === 0 ? "Los resultados aparecerán aquí cuando alguien responda." : ""}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((fb) => (
            <FeedbackCard
              key={fb.id}
              fb={fb}
              expanded={expandedId === fb.id}
              onToggle={() => setExpandedId(expandedId === fb.id ? null : fb.id)}
              onArchivar={() => archivar(fb.id)}
              onDesarchivar={() => desarchivar(fb.id)}
              isArchived={view === "archivados"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Metric card ── */
function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="rounded-xl p-4 flex flex-col gap-1"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <p className="font-inter text-[0.65rem] uppercase tracking-widest" style={{ color: "#555" }}>{label}</p>
      <p className="font-cormorant font-light" style={{ fontSize: "1.5rem", color: accent }}>
        {value}{sub && <span className="text-sm" style={{ color: "#555" }}> {sub}</span>}
      </p>
    </div>
  );
}

/* ── Rating bar ── */
function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-inter text-xs w-16 shrink-0" style={{ color: "#8A8A8A" }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(value / 5) * 100}%`, background: ratingColor(value) }} />
      </div>
      <span className="font-inter text-xs font-medium w-8 text-right" style={{ color: ratingColor(value) }}>{value}/5</span>
    </div>
  );
}

/* ── Feedback card ── */
function FeedbackCard({ fb, expanded, onToggle, onArchivar, onDesarchivar, isArchived }: {
  fb: Feedback;
  expanded: boolean;
  onToggle: () => void;
  onArchivar: () => void;
  onDesarchivar: () => void;
  isArchived: boolean;
}) {
  const formulaColor = fb.formula_asignada
    ? FORMULA_COLORS[fb.formula_asignada.toLowerCase().split(" ")[0]] ?? "#8A8A8A"
    : null;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: formulaColor ? `1px solid ${formulaColor}25` : "1px solid rgba(255,255,255,0.07)",
        opacity: isArchived ? 0.6 : 1,
      }}
    >
      {/* Header — always visible, clickable */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-3 text-left transition-all group"
        style={{ background: expanded ? "rgba(255,255,255,0.02)" : "transparent" }}
      >
        {/* Formula dot */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: formulaColor ?? "#555" }} />

        {/* Name + pedido */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="font-inter text-sm font-medium truncate" style={{ color: "#F5F0E8" }}>{fb.nombre}</span>
          {fb.numero_pedido && (
            <span className="font-inter text-[0.65rem] px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#666" }}>
              #{fb.numero_pedido}
            </span>
          )}
        </div>

        {/* Ratings preview */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-inter text-xs" style={{ color: ratingColor(fb.sabor_rating) }}>
            {fb.sabor_rating}
          </span>
          <span className="font-inter text-[0.6rem]" style={{ color: "#333" }}>/</span>
          <span className="font-inter text-xs" style={{ color: ratingColor(fb.frescura_rating) }}>
            {fb.frescura_rating}
          </span>
        </div>

        {/* Date */}
        <span className="font-inter text-[0.65rem] shrink-0" style={{ color: "#444" }}>
          {fb.submitted_at}
        </span>

        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"
          className="shrink-0 transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 flex flex-col gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>

          {/* Ratings */}
          <div className="flex flex-col gap-2 pt-3">
            <RatingBar label="Sabor" value={fb.sabor_rating} />
            <RatingBar label="Frescura" value={fb.frescura_rating} />
          </div>

          {/* Sensación + Experiencia */}
          <div className="grid grid-cols-2 gap-3">
            <DetailBlock label="Sensación" value={fb.sensacion_sabor} />
            <DetailBlock label="Experiencia" value={fb.experiencia_lumo} />
          </div>

          {/* Precio + Fórmula */}
          <div className="grid grid-cols-2 gap-3">
            <DetailBlock label="Precio justo" value={fb.precio_justo} accent={TROPICAL} />
            {fb.formula_asignada && (
              <DetailBlock label="Fórmula" value={fb.formula_asignada} accent={formulaColor ?? undefined} />
            )}
          </div>

          {/* Recomendación */}
          {fb.recomendacion && (
            <div>
              <p className="font-inter text-[0.65rem] uppercase tracking-widest mb-1.5" style={{ color: "#555" }}>Recomendaría a</p>
              <div className="flex flex-wrap gap-1.5">
                {fb.recomendacion.split(" | ").map((r, i) => (
                  <span key={i} className="font-inter text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#999", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Razón adopción */}
          {fb.razon_adopcion && (
            <div>
              <p className="font-inter text-[0.65rem] uppercase tracking-widest mb-1.5" style={{ color: "#555" }}>Razón de adopción</p>
              <div className="flex flex-wrap gap-1.5">
                {fb.razon_adopcion.split(" | ").map((r, i) => (
                  <span key={i} className="font-inter text-xs px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.05)", color: "#999", border: "1px solid rgba(255,255,255,0.07)" }}>
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comentario abierto */}
          {fb.mejora_abierta && (
            <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="font-inter text-[0.65rem] uppercase tracking-widest mb-1.5" style={{ color: "#555" }}>Comentario</p>
              <p className="font-inter text-sm leading-relaxed" style={{ color: "#CCC" }}>
                &ldquo;{fb.mejora_abierta}&rdquo;
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            {isArchived ? (
              <button onClick={onDesarchivar}
                className="font-inter text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ background: "rgba(255,255,255,0.06)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}>
                Restaurar
              </button>
            ) : (
              <button onClick={onArchivar}
                className="font-inter text-xs px-3 py-1.5 rounded-lg transition-all group"
                style={{ background: "rgba(255,255,255,0.04)", color: "#666", border: "1px solid rgba(255,255,255,0.07)" }}>
                Archivar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Detail block ── */
function DetailBlock({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <p className="font-inter text-[0.65rem] uppercase tracking-widest mb-1" style={{ color: "#555" }}>{label}</p>
      <p className="font-inter text-sm" style={{ color: accent ?? "#CCC" }}>{value}</p>
    </div>
  );
}
