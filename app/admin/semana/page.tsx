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
  clientes: { nombre: string } | null;
  formulas: { nombre: string; slug: string; color_acento: string } | null;
};

function getWeekDays(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 + offset * 7);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export default function SemanaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingExtra, setUpdatingExtra] = useState<string | null>(null);

  const days = getWeekDays(weekOffset);
  const monday = days[0];
  const saturday = days[5];

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("pedidos")
      .select("*, clientes(nombre), formulas(nombre, slug, color_acento)")
      .gte("dia_entrega", monday)
      .lte("dia_entrega", saturday)
      .order("dia_entrega");
    setPedidos(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [weekOffset]);

  async function setEstadoExtra(id: string, estado: string) {
    setUpdatingExtra(id);
    await supabase.from("pedidos").update({ estado_extra: estado }).eq("id", id);
    await load();
    setUpdatingExtra(null);
  }

  const totalSemana = pedidos
    .filter((p) => p.tipo_pedido !== "extra" || p.estado_extra === "aceptado")
    .reduce((s, p) => s + p.cantidad, 0);
  const today = new Date().toISOString().split("T")[0];

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
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A" }}>‹</button>
          <button onClick={() => setWeekOffset(0)}
            className="px-3 h-8 rounded-lg font-inter text-xs"
            style={{ background: weekOffset === 0 ? "rgba(74,94,58,0.2)" : "rgba(255,255,255,0.05)", color: weekOffset === 0 ? "#4A5E3A" : "#8A8A8A" }}>
            Hoy
          </button>
          <button onClick={() => setWeekOffset((w) => w + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
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
                    {pedidosDia.map((p) => (
                      <PedidoRow key={p.id} p={p} onSetExtra={setEstadoExtra} updating={updatingExtra === p.id} />
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

function PedidoRow({ p, onSetExtra, updating }: {
  p: Pedido;
  onSetExtra: (id: string, estado: string) => void;
  updating: boolean;
}) {
  const tipo = p.tipo_pedido ?? "normal";
  const rechazado = tipo === "extra" && p.estado_extra === "rechazado";
  const aplazado = tipo === "extra" && p.estado_extra === "aplazado";

  return (
    <div className="flex flex-col gap-1.5 rounded-xl px-3 py-2.5"
      style={{
        background: rechazado ? "rgba(122,32,48,0.08)" : aplazado ? "rgba(255,255,255,0.02)" : "transparent",
        opacity: rechazado || aplazado ? 0.55 : 1,
        border: tipo === "extra" ? "1px solid rgba(122,32,48,0.2)" : tipo === "domingo" ? "1px solid rgba(184,134,11,0.2)" : "none",
      }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-inter text-xs" style={{ color: "#8A8A8A" }}>
            {p.clientes?.nombre ?? "—"} · {p.formulas?.nombre} ×{p.cantidad}
          </span>
          <TipoBadge tipo={tipo} />
        </div>
        <span className="font-inter text-xs px-2 py-0.5 rounded-full shrink-0" style={estadoBadge(p.estado)}>
          {p.estado}
        </span>
      </div>

      {tipo === "extra" && !p.estado_extra && (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-inter text-xs mr-1" style={{ color: "#555" }}>¿Aceptar?</span>
          <button onClick={() => onSetExtra(p.id, "aceptado")} disabled={updating}
            className="rounded-lg px-2.5 py-1 font-inter text-xs"
            style={{ background: "rgba(74,94,58,0.2)", color: "#4A5E3A" }}>
            Aceptar
          </button>
          <button onClick={() => onSetExtra(p.id, "aplazado")} disabled={updating}
            className="rounded-lg px-2.5 py-1 font-inter text-xs"
            style={{ background: "rgba(184,134,11,0.15)", color: "#B8860B" }}>
            Aplazar
          </button>
          <button onClick={() => onSetExtra(p.id, "rechazado")} disabled={updating}
            className="rounded-lg px-2.5 py-1 font-inter text-xs"
            style={{ background: "rgba(122,32,48,0.15)", color: "#7A2030" }}>
            Rechazar
          </button>
        </div>
      )}

      {tipo === "extra" && p.estado_extra && (
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={extraDecisionStyle(p.estado_extra)}>
            {p.estado_extra}
          </span>
          <button onClick={() => onSetExtra(p.id, "")} disabled={updating}
            className="font-inter text-xs" style={{ color: "#444" }}>
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
      style={{ background: "rgba(184,134,11,0.15)", color: "#B8860B" }}>
      Domingo
    </span>
  );
  if (tipo === "extra") return (
    <span className="font-inter text-xs px-2 py-0.5 rounded-full"
      style={{ background: "rgba(122,32,48,0.15)", color: "#7A2030" }}>
      Extra
    </span>
  );
  return null;
}

function extraDecisionStyle(estado: string): React.CSSProperties {
  if (estado === "aceptado") return { background: "rgba(74,94,58,0.15)", color: "#4A5E3A" };
  if (estado === "aplazado") return { background: "rgba(184,134,11,0.12)", color: "#B8860B" };
  return { background: "rgba(122,32,48,0.12)", color: "#7A2030" };
}

function estadoBadge(estado: string): React.CSSProperties {
  if (estado === "entregado") return { background: "rgba(74,94,58,0.15)", color: "#4A5E3A" };
  if (estado === "preparado") return { background: "rgba(184,134,11,0.15)", color: "#B8860B" };
  return { background: "rgba(255,255,255,0.06)", color: "#555" };
}

function Loader() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "#4A5E3A", borderTopColor: "transparent" }} />
    </div>
  );
}
