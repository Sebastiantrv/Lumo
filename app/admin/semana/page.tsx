"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { adminWrite } from "@/lib/admin-api";
import { localStr, getWeekDays, formatDateShort } from "@/lib/dates";
import { DELIVERY_RANGES } from "@/lib/constants";

type Pedido = {
  id: string;
  cantidad: number;
  estado: string;
  dia_entrega: string;
  tipo_pedido: string | null;
  estado_extra: string | null;
  es_sorpresa: boolean;
  formula_id: string;
  token: string | null;
  ingredientes_excluidos: string[] | null;
  preferencia_sorpresa: string | null;
  notas: string | null;
  hora_preparado: string | null;
  hora_entrega_estimada: string | null;
  clientes: { nombre: string } | null;
  formulas: { id?: string; nombre: string; slug: string; color_acento: string } | null;
};

type Formula = { id: string; nombre: string; slug: string; color_acento: string };

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
    await adminWrite("pedidos", "update", { estado_extra: estado }, [{ column: "id", value: id }]);
    await load();
  }

  async function aplazar(ids: string[], fecha: string) {
    for (const id of ids) {
      await adminWrite("pedidos", "update", { dia_entrega: fecha, estado_extra: "aplazado" }, [{ column: "id", value: id }]);
    }
    setAplazarPickerFor(null);
    await load();
  }

  async function moverFecha(ids: string[], fecha: string) {
    for (const id of ids) {
      await adminWrite("pedidos", "update", { dia_entrega: fecha }, [{ column: "id", value: id }]);
    }
    setMoverPickerFor(null);
    await load();
  }

  async function avanzarEstado(ids: string[], estadoActual: string, horaEntrega?: string) {
    const siguiente =
      estadoActual === "pendiente" ? "confirmado"
      : estadoActual === "confirmado" ? "preparado"
      : estadoActual === "preparado" ? "entregado"
      : "pendiente";

    const payload: Record<string, string> = { estado: siguiente };
    if (siguiente === "preparado") payload.hora_preparado = new Date().toISOString();
    if (siguiente === "entregado" && horaEntrega) payload.hora_entrega_estimada = horaEntrega;

    await Promise.all(ids.map((id) => adminWrite("pedidos", "update", payload, [{ column: "id", value: id }])));
    await load();
  }

  async function cambiarFormula(id: string, formulaId: string) {
    await adminWrite("pedidos", "update", { formula_id: formulaId }, [{ column: "id", value: id }]);
    await load();
  }

  function groupByToken(list: Pedido[]) {
    const map = new Map<string, Pedido[]>();
    for (const p of list) {
      const key = p.token ?? p.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.values());
  }

  const totalSemana = pedidos
    .filter((p) => p.tipo_pedido !== "extra" || p.estado_extra === "aceptado")
    .reduce((s, p) => s + p.cantidad, 0);

  const today = localStr(new Date());

  const weekLabel = `${formatDateShort(monday)} – ${formatDateShort(saturday)}`;

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
            const isToday = dia === today;
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
                    {groupByToken(pedidosDia).map((group) => {
                      const first = group[0];
                      const groupKey = first.token ?? first.id;
                      const ids = group.map((p) => p.id);
                      return (
                        <PedidoRow
                          key={groupKey}
                          group={group}
                          formulas={formulas}
                          onSetExtra={setExtra}
                          onAplazar={(fecha) => aplazar(ids, fecha)}
                          onMoverFecha={(fecha) => moverFecha(ids, fecha)}
                          onCambiarFormula={cambiarFormula}
                          onAvanzarEstado={(hora) => avanzarEstado(ids, group[0].estado, hora)}
                          showAplazarPicker={aplazarPickerFor === groupKey}
                          onOpenAplazar={() => setAplazarPickerFor(groupKey)}
                          onCloseAplazar={() => setAplazarPickerFor(null)}
                          showMoverPicker={moverPickerFor === groupKey}
                          onOpenMover={() => setMoverPickerFor(groupKey)}
                          onCloseMover={() => setMoverPickerFor(null)}
                        />
                      );
                    })}
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
  group, formulas, onSetExtra, onAplazar, onMoverFecha, onCambiarFormula, onAvanzarEstado, showAplazarPicker, onOpenAplazar, onCloseAplazar, showMoverPicker, onOpenMover, onCloseMover,
}: {
  group: Pedido[];
  formulas: Formula[];
  onSetExtra: (id: string, estado: string) => void;
  onAplazar: (fecha: string) => void;
  onMoverFecha: (fecha: string) => void;
  onCambiarFormula: (id: string, formulaId: string) => void;
  onAvanzarEstado: (hora?: string) => void;
  showAplazarPicker: boolean;
  onOpenAplazar: () => void;
  onCloseAplazar: () => void;
  showMoverPicker: boolean;
  onOpenMover: () => void;
  onCloseMover: () => void;
}) {
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const first = group[0];
  const tipo = first.tipo_pedido ?? "normal";
  const rechazado = first.estado_extra === "rechazado";
  const aplazado = first.estado_extra === "aplazado";
  const multiFormula = group.length > 1;
  const acento = multiFormula ? "#4A5E3A" : (first.formulas?.color_acento ?? "#8A8A8A");
  const totalBotellas = group.reduce((s, p) => s + p.cantidad, 0);

  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return localStr(d);
  });

  const moverDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return localStr(d);
  });

  const showDecisionButtons = (tipo === "extra" || first.es_sorpresa) && !first.estado_extra && !showAplazarPicker;

  return (
    <div
      className="flex flex-col gap-1.5 rounded-xl px-3 py-2.5"
      style={{
        background: rechazado ? "rgba(122,32,48,0.08)" : aplazado ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
        opacity: rechazado || aplazado ? 0.5 : 1,
        border: `1px solid ${acento}44`,
        transition: "border-color 0.3s ease",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="w-1.5 h-5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: acento }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-inter text-xs font-medium" style={{ color: "#F5F0E8" }}>
                {first.clientes?.nombre ?? "—"}
              </span>
              {totalBotellas > 1 && (
                <span className="font-inter text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(74,94,58,0.15)", color: "#4A5E3A" }}>
                  {totalBotellas} bot.
                </span>
              )}
            </div>
            {group.map((p) => (
              <p key={p.id} className="font-inter text-xs mt-0.5" style={{ color: p.formulas?.color_acento ?? "#8A8A8A" }}>
                {p.formulas?.nombre} × {p.cantidad}
                {p.ingredientes_excluidos && p.ingredientes_excluidos.length > 0 && (
                  <span style={{ color: "#E05070" }}> · Sin: {p.ingredientes_excluidos.join(", ")}</span>
                )}
                {p.notas ? ` · ${p.notas}` : ""}
              </p>
            ))}
            {first.preferencia_sorpresa && (
              <p className="font-inter text-xs mt-0.5" style={{ color: "#B8860B" }}>
                Prefiere: {first.preferencia_sorpresa}
              </p>
            )}
          </div>
        </div>

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
          {first.es_sorpresa && (
            <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(184,134,11,0.2)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.3)" }}>🎲</span>
          )}
          <TipoBadge tipo={tipo} />
          {first.estado !== "entregado" && first.estado !== "cancelado" ? (
            <button
              onClick={() => {
                if (first.estado === "confirmado") {
                  setShowDeliveryPicker(!showDeliveryPicker);
                } else {
                  onAvanzarEstado();
                }
              }}
              className="font-inter text-xs px-2 py-0.5 rounded-full cursor-pointer transition-opacity hover:opacity-80"
              style={estadoBadge(first.estado)}
              title="Avanzar estado"
            >
              {first.estado} →
            </button>
          ) : (
            <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={estadoBadge(first.estado)}>
              {first.estado}
            </span>
          )}
        </div>
      </div>

      {first.es_sorpresa && !showAplazarPicker && group.map((p) => (
        <div key={p.id} className="flex items-center gap-2 pt-1">
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
      ))}

      {showDecisionButtons && (
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={() => group.forEach((p) => onSetExtra(p.id, "aceptado"))}
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
            onClick={() => group.forEach((p) => onSetExtra(p.id, "rechazado"))}
            className="rounded-lg px-3 py-1 font-inter text-xs font-semibold"
            style={{ background: "rgba(122,32,48,0.35)", color: "#E05070", border: "1px solid rgba(122,32,48,0.5)" }}
          >
            Rechazar
          </button>
        </div>
      )}

      {showAplazarPicker && (
        <div className="flex flex-col gap-2 mt-1">
          <p className="font-inter text-xs" style={{ color: "#8A8A8A" }}>Elegir nuevo día:</p>
          <div className="flex flex-wrap gap-1.5">
            {nextDays.map((dia) => {
              const d = new Date(dia + "T12:00:00");
              const label = d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
              return (
                <button key={dia} onClick={() => onAplazar(dia)}
                  className="rounded-lg px-2.5 py-1 font-inter text-xs"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#C0B8AE", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {label}
                </button>
              );
            })}
          </div>
          <button onClick={onCloseAplazar} className="font-inter text-xs text-left mt-0.5" style={{ color: "#555" }}>Cancelar</button>
        </div>
      )}

      {showMoverPicker && (
        <div className="flex flex-col gap-2 mt-1">
          <p className="font-inter text-xs" style={{ color: "#8A8A8A" }}>Mover a:</p>
          <div className="flex flex-wrap gap-1.5">
            {moverDays.map((dia) => {
              const d = new Date(dia + "T12:00:00");
              const label = d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
              return (
                <button key={dia} onClick={() => onMoverFecha(dia)}
                  className="rounded-lg px-2.5 py-1 font-inter text-xs"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#C0B8AE", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {label}
                </button>
              );
            })}
          </div>
          <button onClick={onCloseMover} className="font-inter text-xs text-left mt-0.5" style={{ color: "#555" }}>Cancelar</button>
        </div>
      )}

      {showDeliveryPicker && (
        <div className="flex flex-col gap-2 mt-1">
          <p className="font-inter text-xs" style={{ color: "#8A8A8A" }}>Hora de entrega estimada:</p>
          <div className="flex flex-wrap gap-1.5">
            {DELIVERY_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => { setShowDeliveryPicker(false); onAvanzarEstado(range); }}
                className="rounded-lg px-3 py-1.5 font-inter text-xs font-medium"
                style={{ background: "rgba(74,94,58,0.25)", color: "#6DBF67", border: "1px solid rgba(74,94,58,0.4)" }}
              >
                {range}
              </button>
            ))}
          </div>
          <button onClick={() => setShowDeliveryPicker(false)} className="font-inter text-xs text-left mt-0.5" style={{ color: "#555" }}>Cancelar</button>
        </div>
      )}

      {first.estado_extra && !showAplazarPicker && (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={extraDecisionStyle(first.estado_extra)}>
            {first.estado_extra}
          </span>
          <button
            onClick={() => group.forEach((p) => onSetExtra(p.id, ""))}
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
