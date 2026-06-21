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
  es_sorpresa: boolean;
  ingredientes_excluidos: string[] | null;
  preferencia_sorpresa: string | null;
  formula_id: string;
  token: string | null;
  hora_preparado: string | null;
  clientes: { nombre: string; telefono: string | null } | null;
  formulas: { nombre: string; slug: string; color_acento: string } | null;
};

type Receta = {
  formula_id: string;
  gramos: number;
  ingredientes: { nombre: string; unidad: string } | null;
};

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function fmt(g: number) {
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  return `${Math.round(g)} g`;
}

export default function AdminHoy() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fecha = today();
  const fechaLabel = new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long",
  });

  async function load() {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("pedidos").select("*, clientes(nombre, telefono), formulas(nombre, slug, color_acento)").eq("dia_entrega", fecha).order("created_at"),
      supabase.from("recetas").select("formula_id, gramos, ingredientes(nombre, unidad)"),
    ]);
    setPedidos(p ?? []);
    setRecetas((r ?? []) as unknown as Receta[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleEstado(id: string, estadoActual: string) {
    const siguiente =
      estadoActual === "pendiente" ? "preparado"
      : estadoActual === "preparado" ? "entregado"
      : "pendiente";
    setUpdating(id);
    const updateData: Record<string, unknown> = { estado: siguiente };
    if (siguiente === "preparado") {
      updateData.hora_preparado = new Date().toISOString();
    }
    if (siguiente === "pendiente") {
      updateData.hora_preparado = null;
    }
    await supabase.from("pedidos").update(updateData).eq("id", id);
    await load();
    setUpdating(null);
  }

  async function marcarTodoEntregado() {
    const ids = pedidos.filter((p) => p.estado !== "entregado").map((p) => p.id);
    if (!ids.length) return;
    await supabase.from("pedidos").update({ estado: "entregado" }).in("id", ids);
    await load();
  }

  // Per-formula totals
  const resumen = pedidos.reduce<Record<string, { nombre: string; color: string; total: number }>>(
    (acc, p) => {
      const slug = p.formulas?.slug ?? "?";
      if (!acc[slug]) acc[slug] = { nombre: p.formulas?.nombre ?? slug, color: p.formulas?.color_acento ?? "#888", total: 0 };
      acc[slug].total += p.cantidad;
      return acc;
    }, {}
  );

  // Ingredient gram breakdown, skipping excluded ingredients
  const desglose: Record<string, { gramos: number; unidad: string }> = {};
  for (const p of pedidos) {
    const excluidos = p.ingredientes_excluidos ?? [];
    const recetasFormula = recetas.filter((r) => r.formula_id === p.formula_id);
    for (const r of recetasFormula) {
      if (!r.ingredientes) continue;
      const { nombre, unidad } = r.ingredientes;
      if (excluidos.includes(nombre)) continue;
      if (!desglose[nombre]) desglose[nombre] = { gramos: 0, unidad };
      desglose[nombre].gramos += r.gramos * p.cantidad;
    }
  }

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

          {/* Para preparar hoy */}
          {Object.keys(desglose).length > 0 && (
            <div
              className="rounded-2xl p-6 mb-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="font-inter text-xs uppercase tracking-widest mb-4" style={{ color: "#8A8A8A" }}>
                Para preparar hoy
              </p>
              <div className="flex flex-col gap-2">
                {Object.entries(desglose)
                  .sort((a, b) => b[1].gramos - a[1].gramos)
                  .map(([nombre, { gramos }]) => (
                    <div key={nombre} className="flex items-center justify-between">
                      <span className="font-inter text-sm" style={{ color: "#C0B8AE" }}>{nombre}</span>
                      <span className="font-inter text-sm font-medium" style={{ color: "#F5F0E8" }}>{fmt(gramos)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Lista de pedidos */}
          <div className="flex flex-col gap-2 mb-6">
            <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#555" }}>
              Pedidos
            </p>
            {pedidos.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between rounded-xl px-4 py-3.5 transition-all"
                style={{
                  background: p.estado === "entregado"
                    ? "rgba(74,94,58,0.08)"
                    : "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  opacity: p.estado === "entregado" ? 0.6 : 1,
                }}
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-inter text-sm font-medium" style={{ color: "#F5F0E8" }}>
                      {p.clientes?.nombre ?? "Sin nombre"}
                    </p>
                    {p.es_sorpresa && (
                      <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(184,134,11,0.2)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.3)" }}>🎲 Sorpresa</span>
                    )}
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
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleEstado(p.id, p.estado)}
                    disabled={updating === p.id}
                    className="flex items-center gap-2 rounded-full px-3 py-1.5 font-inter text-xs transition-all"
                    style={estadoBadgeStyle(p.estado)}
                  >
                    {updating === p.id ? "..." : estadoLabel(p.estado)}
                  </button>
                  {p.estado === "preparado" && p.clientes?.telefono && p.hora_preparado && (
                    <button
                      onClick={() => {
                        const hora = new Date(p.hora_preparado!).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Mexico_City" });
                        const msg = `Hola ${p.clientes!.nombre} ☀️\n\nTu LUMO ${p.formulas?.nombre ?? ""} está listo.\nEnvasado hoy a las ${hora}.\n\nSigue tu pedido aquí:\nhttps://lumo-three-beta.vercel.app/mi-pedido/${p.token}`;
                        window.open(buildWhatsAppUrl(p.clientes!.telefono!, msg), "_blank");
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                      style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)" }}
                      title="Enviar WhatsApp - Listo"
                    >
                      <WhatsAppIcon />
                    </button>
                  )}
                  {p.estado === "entregado" && p.clientes?.telefono && (
                    <button
                      onClick={() => {
                        const msg = `Hola ${p.clientes!.nombre} ☀️\n\nTu LUMO ${p.formulas?.nombre ?? ""} ha sido entregado.\n¡Esperamos que lo disfrutes!\n\nCuéntanos tu experiencia:\nhttps://lumo-three-beta.vercel.app/feedback`;
                        window.open(buildWhatsAppUrl(p.clientes!.telefono!, msg), "_blank");
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                      style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)" }}
                      title="Enviar WhatsApp - Entregado"
                    >
                      <WhatsAppIcon />
                    </button>
                  )}
                </div>
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

          {pedidos.filter((p) => p.estado === "preparado" && p.clientes?.telefono && p.hora_preparado).length > 0 && (
            <button
              onClick={() => {
                const listos = pedidos.filter((p) => p.estado === "preparado" && p.clientes?.telefono && p.hora_preparado);
                listos.forEach((p, i) => {
                  setTimeout(() => {
                    const hora = new Date(p.hora_preparado!).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "America/Mexico_City" });
                    const msg = `Hola ${p.clientes!.nombre} ☀️\n\nTu LUMO ${p.formulas?.nombre ?? ""} está listo.\nEnvasado hoy a las ${hora}.\n\nSigue tu pedido aquí:\nhttps://lumo-three-beta.vercel.app/mi-pedido/${p.token}`;
                    window.open(buildWhatsAppUrl(p.clientes!.telefono!, msg), "_blank");
                  }, i * 500);
                });
              }}
              className="w-full rounded-xl py-3.5 font-inter text-sm font-medium transition-opacity flex items-center justify-center gap-2 mt-3"
              style={{ background: "rgba(37,211,102,0.15)", color: "#25D366", border: "1px solid rgba(37,211,102,0.3)" }}
            >
              <WhatsAppIcon />
              Notificar listos por WhatsApp
            </button>
          )}
        </>
      )}
    </div>
  );
}

function cleanPhone(tel: string): string {
  const cleaned = tel.replace(/[\s\-()]/g, "");
  if (!/^\+/.test(cleaned) && !/^52/.test(cleaned)) return "52" + cleaned;
  return cleaned.replace(/^\+/, "");
}

function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(message)}`;
}

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function estadoLabel(estado: string) {
  if (estado === "pendiente") return "Pendiente";
  if (estado === "preparado") return "Preparado";
  return "Entregado ✓";
}

function estadoBadgeStyle(estado: string): React.CSSProperties {
  if (estado === "pendiente") return { background: "rgba(255,255,255,0.1)", color: "#C0B8AE", border: "1px solid rgba(255,255,255,0.15)" };
  if (estado === "preparado") return { background: "rgba(184,134,11,0.25)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.4)" };
  return { background: "rgba(74,94,58,0.25)", color: "#6DBF67", border: "1px solid rgba(74,94,58,0.4)" };
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
