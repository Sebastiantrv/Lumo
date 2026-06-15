"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Pedido = {
  id: string;
  cantidad: number;
  estado: string;
  notas: string | null;
  dia_entrega: string;
  tipo_pedido: string | null;
  clientes: { nombre: string } | null;
  formulas: { nombre: string; slug: string; color_acento: string } | null;
};

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function today() {
  return new Date().toISOString().split("T")[0];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function AdminHoy() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fecha = today();
  const fechaLabel = new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  async function load() {
    const { data } = await supabase
      .from("pedidos")
      .select("*, clientes(nombre), formulas(nombre, slug, color_acento)")
      .eq("dia_entrega", fecha)
      .order("created_at");
    setPedidos(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleEstado(id: string, estadoActual: string) {
    const siguiente =
      estadoActual === "pendiente" ? "preparado"
      : estadoActual === "preparado" ? "entregado"
      : "pendiente";
    setUpdating(id);
    await supabase.from("pedidos").update({ estado: siguiente }).eq("id", id);
    await load();
    setUpdating(null);
  }

  async function marcarTodoEntregado() {
    const ids = pedidos.filter((p) => p.estado !== "entregado").map((p) => p.id);
    if (!ids.length) return;
    await supabase.from("pedidos").update({ estado: "entregado" }).in("id", ids);
    await load();
  }

  // Agrupar por fórmula
  const resumen = pedidos.reduce<Record<string, { nombre: string; color: string; total: number }>>(
    (acc, p) => {
      const slug = p.formulas?.slug ?? "?";
      if (!acc[slug]) acc[slug] = { nombre: p.formulas?.nombre ?? slug, color: p.formulas?.color_acento ?? "#888", total: 0 };
      acc[slug].total += p.cantidad;
      return acc;
    }, {}
  );

  const totalBotellas = pedidos.reduce((s, p) => s + p.cantidad, 0);
  const pendientes = pedidos.filter((p) => p.estado !== "entregado").length;

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <p className="font-inter text-sm mb-1" style={{ color: "#4A5E3A", letterSpacing: "0.1em" }}>
          {greeting()}
        </p>
        <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2.2rem" }}>
          {fechaLabel}
        </h1>
      </div>

      {totalBotellas === 0 ? (
        <EmptyDay />
      ) : (
        <>
          {/* Resumen de producción */}
          <div
            className="rounded-2xl p-6 mb-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8A8A" }}>
                  Producción de hoy
                </p>
                <p className="font-cormorant font-light" style={{ fontSize: "2.8rem", color: "#F5F0E8", lineHeight: 1 }}>
                  {totalBotellas}
                  <span className="font-inter text-sm ml-2" style={{ color: "#8A8A8A" }}>botellas</span>
                </p>
              </div>
              {pendientes === 0 ? (
                <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(74,94,58,0.2)" }}>
                  <CheckIcon />
                  <span className="font-inter text-xs" style={{ color: "#4A5E3A" }}>Todo entregado</span>
                </div>
              ) : (
                <div className="rounded-full px-3 py-1.5" style={{ background: "rgba(184,134,11,0.15)" }}>
                  <span className="font-inter text-xs" style={{ color: "#B8860B" }}>{pendientes} pendiente{pendientes > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {Object.entries(resumen).map(([slug, { nombre, color, total }]) => (
                <div key={slug} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-inter text-sm" style={{ color: "#F5F0E8" }}>{nombre}</span>
                  </div>
                  <span className="font-cormorant text-lg" style={{ color }}>{total} bot.</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de pedidos */}
          <div className="flex flex-col gap-2 mb-6">
            <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#555" }}>
              Pedidos
            </p>
            {pedidos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 transition-all"
                style={{
                  background: p.estado === "entregado"
                    ? "rgba(74,94,58,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  opacity: p.estado === "entregado" ? 0.6 : 1,
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-inter text-sm font-medium" style={{ color: "#F5F0E8" }}>
                      {p.clientes?.nombre ?? "Sin nombre"}
                    </p>
                    {p.tipo_pedido === "domingo" && (
                      <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(184,134,11,0.15)", color: "#B8860B" }}>Domingo</span>
                    )}
                    {p.tipo_pedido === "extra" && (
                      <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(122,32,48,0.15)", color: "#7A2030" }}>Extra</span>
                    )}
                  </div>
                  <p className="font-inter text-xs mt-0.5" style={{ color: p.formulas?.color_acento ?? "#8A8A8A" }}>
                    {p.formulas?.nombre} × {p.cantidad}
                    {p.notas ? ` · ${p.notas}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => toggleEstado(p.id, p.estado)}
                  disabled={updating === p.id}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 font-inter text-xs transition-all"
                  style={estadoBadgeStyle(p.estado)}
                >
                  {updating === p.id ? "..." : estadoLabel(p.estado)}
                </button>
              </div>
            ))}
          </div>

          {pendientes > 0 && (
            <button
              onClick={marcarTodoEntregado}
              className="w-full rounded-xl py-3.5 font-inter text-sm font-medium transition-opacity"
              style={{ background: "#F5F0E8", color: "#0D0D0D" }}
            >
              Marcar todo como entregado
            </button>
          )}
        </>
      )}
    </div>
  );
}

function estadoLabel(estado: string) {
  if (estado === "pendiente") return "Pendiente";
  if (estado === "preparado") return "Preparado";
  return "Entregado ✓";
}

function estadoBadgeStyle(estado: string): React.CSSProperties {
  if (estado === "pendiente") return { background: "rgba(184,134,11,0.15)", color: "#B8860B" };
  if (estado === "preparado") return { background: "rgba(74,94,58,0.2)", color: "#4A5E3A" };
  return { background: "rgba(74,94,58,0.1)", color: "#4A5E3A" };
}

function EmptyDay() {
  return (
    <div
      className="rounded-2xl p-10 text-center"
      style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
    >
      <p className="font-cormorant text-2xl mb-2" style={{ color: "#F5F0E8" }}>Sin pedidos hoy</p>
      <p className="font-inter text-sm" style={{ color: "#555" }}>Agrega pedidos desde la sección Clientes.</p>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#4A5E3A", borderTopColor: "transparent" }} />
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
