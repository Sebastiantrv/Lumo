"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Pedido = {
  id: string;
  cantidad: number;
  estado: string;
  dia_entrega: string;
  tipo_pedido: string | null;
  estado_extra: string | null;
  es_sorpresa: boolean;
  formula_id: string;
  ingredientes_excluidos: string[] | null;
  preferencia_sorpresa: string | null;
  notas: string | null;
  clientes: { nombre: string } | null;
  formulas: { id?: string; nombre: string; slug: string; color_acento: string } | null;
};

type Formula = { id: string; nombre: string; slug: string; color_acento: string };

function localStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDays(offset = 0): string[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 + offset * 7);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return localStr(d);
  });
}

export default function SemanaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [aplazarPickerFor, setAplazarPickerFor] = useState<string | null>(null);
  const [moverPickerFor, setMoverPickerFor] = useState<string | null>(null);

  const days = getWeekDays(weekOffset);
  const monday = days[0];
  const saturday = days[5];

  async function load() {
    setLoading(true);
    const [{ data: p }, { data: f }] = await Promise.all([
      supabase.from("pedidos").select("*, clientes(nombre), formulas(nombre, slug, color_acento)").gte("dia_entrega", monday).lte("dia_entrega", saturday).order("dia_entrega"),
      supabase.from("formulas").select("*").order("nombre"),
    ]);
    setPedidos(p ?? []);
    setFormulas(f ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [weekOffset]);

  async function setExtra(id: string, estado: string) {
    await supabase.from("pedidos").update({ estado_extra: estado }).eq("id", id);
    await load();
  }

  async function aplazar(id: string, fecha: string) {
    await supabase.from("pedidos").update({ dia_entrega: fecha, estado_extra: "aplazado" }).eq("id", id);
    setAplazarPickerFor(null);
    await load();
  }

  async function moverFecha(id: string, fecha: string) {
    await supabase.from("pedidos").update({ dia_entrega: fecha }).eq("id", id);
    setMoverPickerFor(null);
    await load();
  }

  async function cambiarFormula(id: string, formulaId: string) {
    await supabase.from("pedidos").update({ formula_id: formulaId }).eq("id", id);
    await load();
  }

  const totalSemana = pedidos
    .filter((p) => p.tipo_pedido !== "extra" || p.estado_extra === "aceptado")
    .reduce((s, p) => s + p.cantidad, 0);

  const todayStr = localStr(new Date());

  // Week label
  const mondayLabel = new Date(monday + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  const saturdayLabel = new Date(saturday + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  const weekLabel = `${mondayLabel} – ${saturdayLabel}`;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#4A5E3A" }}>
            Vista semanal
          </p>
          <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2rem" }}>
            {totalSemana} botellas esta semana
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((w) => w - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-inter text-lg"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A" }}>‹</button>
          <span className="font-inter text-xs px-2" style={{ color: "#8A8A8A" }}>{weekLabel}</span>
          <button onClick={() => setWeekOffset((w) => w + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center font-inter text-lg"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A" }}>›</button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="flex flex-col gap-3">
          {days.map((dia) => {
            const pedidosDia = pedidos.filter((p) => p.dia_entrega === dia);
            const totalDia = pedidosDia
              .filter((p) => p.tipo_pedido !== "extra" || p.estado_extra === "aceptado")
              .reduce((s, p) => s + p.cantidad, 0);
            const isToday = dia === todayStr;
            const dateObj = new Date(dia + "T12:00:00");
            const dayName = dateObj.toLocaleDateString("es-MX", { weekday: "long" });
            const dayNum = dateObj.getDate();

            return (
              <div key={dia} className="rounded-2xl p-5"
                style={{
                  background: isToday ? "rgba(74,94,58,0.1)" : "rgba(255,255,255,0.03)",
                  border: isToday ? "1px solid rgba(74,94,58,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-cormorant text-lg font-semibold"
                      style={{
                        background: isToday ? "rgba(74,94,58,0.25)" : "rgba(255,255,255,0.05)",
                        color: isToday ? "#4A5E3A" : "#F5F0E8",
                      }}>
                      {dayNum}
                    </div>
                    <p className="font-inter text-sm font-medium capitalize" style={{ color: isToday ? "#F5F0E8" : "#8A8A8A" }}>
                      {dayName}
                      {isToday && <span className="ml-2 text-xs" style={{ color: "#4A5E3A" }}>· hoy</span>}
                    </p>
                  </div>
                  <span className="font-cormorant text-xl" style={{ color: totalDia > 0 ? "#F5F0E8" : "#333" }}>
                    {totalDia > 0 ? `${totalDia} bot.` : "—"}
                  </span>
                </div>

                {pedidosDia.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2 pl-12">
                    {pedidosDia.map((p) => (
                      <PedidoRow
                        key={p.id}
                        p={p}
                        formulas={formulas}
                        onSetExtra={setExtra}
                        onAplazar={aplazar}
                        onMoverFecha={moverFecha}
                        onCambiarFormula={cambiarFormula}
                        showAplazarPicker={aplazarPickerFor === p.id}
                        onOpenAplazar={() => setAplazarPickerFor(p.id)}
                        onCloseAplazar={() => setAplazarPickerFor(null)}
                        showMoverPicker={moverPickerFor === p.id}
                        onOpenMover={() => setMoverPickerFor(p.id)}
                        onCloseMover={() => setMoverPickerFor(null)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PedidoRow({
  p, formulas, onSetExtra, onAplazar, onMoverFecha, onCambiarFormula, showAplazarPicker, onOpenAplazar, onCloseAplazar, showMoverPicker, onOpenMover, onCloseMover,
}: {
  p: Pedido;
  formulas: Formula[];
  onSetExtra: (id: string, estado: string) => void;
  onAplazar: (id: string, fecha: string) => void;
  onMoverFecha: (id: string, fecha: string) => void;
  onCambiarFormula: (id: string, formulaId: string) => void;
  showAplazarPicker: boolean;
  onOpenAplazar: () => void;
  onCloseAplazar: () => void;
  showMoverPicker: boolean;
  onOpenMover: () => void;
  onCloseMover: () => void;
}) {
  const tipo = p.tipo_pedido ?? "normal";
  const rechazado = p.estado_extra === "rechazado";
  const aplazado = p.estado_extra === "aplazado";
  const acento = p.formulas?.color_acento ?? "#8A8A8A";

  function borderColor() { return `1px solid ${acento}44`; }

  // Next 7 days from tomorrow for aplazar picker
  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return localStr(d);
  });

  // Next 14 days from today for mover picker
  const moverDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return localStr(d);
  });

  const showDecisionButtons = (tipo === "extra" || p.es_sorpresa) && !p.estado_extra && !showAplazarPicker;

  return (
    <div
      className="flex flex-col gap-1.5 rounded-xl px-3 py-2.5"
      style={{
        background: rechazado ? "rgba(122,32,48,0.08)" : aplazado ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
        opacity: rechazado || aplazado ? 0.5 : 1,
        border: borderColor(),
        transition: "border-color 0.3s ease",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {/* Accent bar */}
          <div className="w-1.5 h-5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: acento }} />
          <div className="flex-1 min-w-0">
            <span className="font-inter text-xs font-medium" style={{ color: "#F5F0E8" }}>
              {p.clientes?.nombre ?? "—"}
            </span>
            <p className="font-inter text-xs mt-0.5" style={{ color: acento }}>
              {p.formulas?.nombre} × {p.cantidad}
              {p.notas ? ` · ${p.notas}` : ""}
            </p>
            {p.ingredientes_excluidos && p.ingredientes_excluidos.length > 0 && (
              <p className="font-inter text-xs mt-0.5" style={{ color: "#E05070" }}>
                Sin: {p.ingredientes_excluidos.join(", ")}
              </p>
            )}
            {p.preferencia_sorpresa && (
              <p className="font-inter text-xs mt-0.5" style={{ color: "#B8860B" }}>
                Prefiere: {p.preferencia_sorpresa}
              </p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={showMoverPicker ? onCloseMover : onOpenMover}
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", color: showMoverPicker ? "#F5F0E8" : "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}
            title="Mover fecha"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="12" height="12" rx="2" />
              <line x1="2" y1="7" x2="14" y2="7" />
              <line x1="5" y1="1" x2="5" y2="4" />
              <line x1="11" y1="1" x2="11" y2="4" />
            </svg>
          </button>
          {p.es_sorpresa && (
            <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(184,134,11,0.2)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.3)" }}>🎲</span>
          )}
          <TipoBadge tipo={tipo} />
          <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={estadoBadge(p.estado)}>
            {p.estado}
          </span>
        </div>
      </div>

      {/* Sorpresa formula selector */}
      {p.es_sorpresa && !showAplazarPicker && (
        <div className="flex items-center gap-2 pt-1">
          <span style={{ color: "#555", fontSize: "0.7rem" }}>Fórmula asignada:</span>
          <select
            value={p.formula_id}
            onChange={(e) => onCambiarFormula(p.id, e.target.value)}
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#F5F0E8", borderRadius: 8, padding: "2px 8px", fontSize: "0.75rem" }}
          >
            {formulas.map((f) => (
              <option key={f.id} value={f.id} style={{ background: "#1a1a1a" }}>{f.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {/* Decision buttons */}
      {showDecisionButtons && (
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={() => onSetExtra(p.id, "aceptado")}
            className="rounded-lg px-3 py-1 font-inter text-xs font-semibold"
            style={{ background: "rgba(74,94,58,0.35)", color: "#6DBF67", border: "1px solid rgba(74,94,58,0.5)" }}
          >
            Aceptar
          </button>
          <button
            onClick={onOpenAplazar}
            className="rounded-lg px-3 py-1 font-inter text-xs font-semibold"
            style={{ background: "rgba(184,134,11,0.3)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.5)" }}
          >
            Aplazar
          </button>
          <button
            onClick={() => onSetExtra(p.id, "rechazado")}
            className="rounded-lg px-3 py-1 font-inter text-xs font-semibold"
            style={{ background: "rgba(122,32,48,0.35)", color: "#E05070", border: "1px solid rgba(122,32,48,0.5)" }}
          >
            Rechazar
          </button>
        </div>
      )}

      {/* Aplazar date picker */}
      {showAplazarPicker && (
        <div className="flex flex-col gap-2 mt-1">
          <p className="font-inter text-xs" style={{ color: "#8A8A8A" }}>Elegir nuevo día:</p>
          <div className="flex flex-wrap gap-1.5">
            {nextDays.map((dia) => {
              const d = new Date(dia + "T12:00:00");
              const label = d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
              return (
                <button
                  key={dia}
                  onClick={() => onAplazar(p.id, dia)}
                  className="rounded-lg px-2.5 py-1 font-inter text-xs"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#C0B8AE", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button
            onClick={onCloseAplazar}
            className="font-inter text-xs text-left mt-0.5"
            style={{ color: "#555" }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Mover date picker */}
      {showMoverPicker && (
        <div className="flex flex-col gap-2 mt-1">
          <p className="font-inter text-xs" style={{ color: "#8A8A8A" }}>Mover a:</p>
          <div className="flex flex-wrap gap-1.5">
            {moverDays.map((dia) => {
              const d = new Date(dia + "T12:00:00");
              const label = d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
              return (
                <button
                  key={dia}
                  onClick={() => onMoverFecha(p.id, dia)}
                  className="rounded-lg px-2.5 py-1 font-inter text-xs"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#C0B8AE", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button
            onClick={onCloseMover}
            className="font-inter text-xs text-left mt-0.5"
            style={{ color: "#555" }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Estado extra badge when already decided */}
      {p.estado_extra && !showAplazarPicker && (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={extraDecisionStyle(p.estado_extra)}>
            {p.estado_extra}
          </span>
          <button
            onClick={() => onSetExtra(p.id, "")}
            className="font-inter text-xs"
            style={{ color: "#444" }}
          >
            cambiar
          </button>
        </div>
      )}
    </div>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  if (tipo === "domingo") return (
    <span className="font-inter text-xs px-2 py-0.5 rounded-full"
      style={{ background: "rgba(184,134,11,0.2)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.3)" }}>
      Domingo
    </span>
  );
  if (tipo === "extra") return (
    <span className="font-inter text-xs px-2 py-0.5 rounded-full"
      style={{ background: "rgba(122,32,48,0.2)", color: "#E05070", border: "1px solid rgba(122,32,48,0.35)" }}>
      Extra
    </span>
  );
  return null;
}

function estadoBadge(estado: string): React.CSSProperties {
  const base = { borderRadius: 20, padding: "2px 10px", fontSize: "0.7rem" } as React.CSSProperties;
  if (estado === "pendiente") return { ...base, background: "rgba(255,255,255,0.08)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.12)" };
  if (estado === "confirmado") return { ...base, background: "rgba(74,94,58,0.15)", color: "#4A5E3A", border: "1px solid rgba(74,94,58,0.3)" };
  if (estado === "preparado") return { ...base, background: "rgba(184,134,11,0.2)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.35)" };
  return { ...base, background: "rgba(74,94,58,0.2)", color: "#6DBF67", border: "1px solid rgba(74,94,58,0.35)" };
}

function extraDecisionStyle(estado: string): React.CSSProperties {
  if (estado === "aceptado") return { background: "rgba(74,94,58,0.15)", color: "#4A5E3A" };
  if (estado === "aplazado") return { background: "rgba(184,134,11,0.12)", color: "#B8860B" };
  return { background: "rgba(122,32,48,0.12)", color: "#7A2030" };
}

function Loader() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#4A5E3A", borderTopColor: "transparent" }} />
    </div>
  );
}
