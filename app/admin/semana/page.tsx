"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Pedido = {
  id: string;
  cantidad: number;
  estado: string;
  dia_entrega: string;
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

const LABELS: Record<string, string> = {
  "0": "Dom", "1": "Lun", "2": "Mar", "3": "Mié", "4": "Jue", "5": "Vie", "6": "Sáb",
};

export default function SemanaPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const totalSemana = pedidos.reduce((s, p) => s + p.cantidad, 0);
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
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A" }}
          >‹</button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 h-8 rounded-lg font-inter text-xs"
            style={{ background: weekOffset === 0 ? "rgba(74,94,58,0.2)" : "rgba(255,255,255,0.05)", color: weekOffset === 0 ? "#4A5E3A" : "#8A8A8A" }}
          >Hoy</button>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A" }}
          >›</button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="flex flex-col gap-3">
          {days.map((dia) => {
            const pedidosDia = pedidos.filter((p) => p.dia_entrega === dia);
            const total = pedidosDia.reduce((s, p) => s + p.cantidad, 0);
            const isToday = dia === today;
            const dateObj = new Date(dia + "T12:00:00");
            const dayName = dateObj.toLocaleDateString("es-MX", { weekday: "long" });
            const dayNum = dateObj.getDate();

            return (
              <div
                key={dia}
                className="rounded-2xl p-5"
                style={{
                  background: isToday ? "rgba(74,94,58,0.1)" : "rgba(255,255,255,0.03)",
                  border: isToday ? "1px solid rgba(74,94,58,0.3)" : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-cormorant text-lg font-semibold"
                      style={{
                        background: isToday ? "rgba(74,94,58,0.25)" : "rgba(255,255,255,0.05)",
                        color: isToday ? "#4A5E3A" : "#F5F0E8",
                      }}
                    >
                      {dayNum}
                    </div>
                    <div>
                      <p className="font-inter text-sm font-medium capitalize" style={{ color: isToday ? "#F5F0E8" : "#8A8A8A" }}>
                        {dayName}
                        {isToday && <span className="ml-2 text-xs" style={{ color: "#4A5E3A" }}>· hoy</span>}
                      </p>
                    </div>
                  </div>
                  <span className="font-cormorant text-xl" style={{ color: total > 0 ? "#F5F0E8" : "#333" }}>
                    {total > 0 ? `${total} bot.` : "—"}
                  </span>
                </div>

                {pedidosDia.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2 pl-12">
                    {pedidosDia.map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <span className="font-inter text-xs" style={{ color: "#8A8A8A" }}>
                          {p.clientes?.nombre ?? "—"} · {p.formulas?.nombre} ×{p.cantidad}
                        </span>
                        <span
                          className="font-inter text-xs px-2 py-0.5 rounded-full"
                          style={estadoBadge(p.estado)}
                        >
                          {p.estado}
                        </span>
                      </div>
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
