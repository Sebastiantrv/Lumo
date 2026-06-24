"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { adminWrite } from "@/lib/admin-api";
import { DELIVERY_RANGES, LUMO_DOMAIN, WHATSAPP_BATCH_DELAY_MS } from "@/lib/constants";
import { todayStr, localStr, formatDateLabel, formatHora, greeting } from "@/lib/dates";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { fmtGramos } from "@/lib/format";

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
  numero_pedido: number | null;
  hora_preparado: string | null;
  hora_entrega_estimada: string | null;
  clientes: { nombre: string; telefono: string | null } | null;
  formulas: { nombre: string; slug: string; color_acento: string } | null;
};

type Receta = {
  formula_id: string;
  gramos: number;
  ingredientes: { nombre: string; unidad: string } | null;
};

export default function AdminHoy() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showDeliveryPicker, setShowDeliveryPicker] = useState<string | null>(null);
  const [showMoverPicker, setShowMoverPicker] = useState<string | null>(null);

  const fecha = todayStr();
  const fechaLabel = formatDateLabel(fecha);

  async function load() {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("pedidos").select("*, numero_pedido, clientes(nombre, telefono), formulas(nombre, slug, color_acento)").eq("dia_entrega", fecha).order("created_at"),
      supabase.from("recetas").select("formula_id, gramos, ingredientes(nombre, unidad)"),
    ]);
    setPedidos(p ?? []);
    setRecetas((r ?? []) as unknown as Receta[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function reactivarGroup(ids: string[]) {
    if (!confirm("¿Reactivar este pedido? Se marcará como pendiente.")) return;
    setUpdating(ids[0]);
    await Promise.all(ids.map((id) => adminWrite("pedidos", "update", { estado: "pendiente", hora_preparado: null, hora_entrega_estimada: null }, [{ column: "id", value: id }])));
    await load();
    setUpdating(null);
  }

  async function moverFechaGroup(ids: string[], fecha: string) {
    setShowMoverPicker(null);
    setUpdating(ids[0]);
    await Promise.all(ids.map((id) => adminWrite("pedidos", "update", { dia_entrega: fecha }, [{ column: "id", value: id }])));
    await load();
    setUpdating(null);
  }

  const moverDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return localStr(d);
  });

  async function toggleEstadoGroup(ids: string[], estadoActual: string) {
    if (estadoActual === "cancelado") return;
    const siguiente =
      estadoActual === "pendiente" ? "confirmado"
      : estadoActual === "confirmado" ? "preparado"
      : estadoActual === "preparado" ? "entregado"
      : "pendiente";

    if (siguiente === "preparado") {
      setShowDeliveryPicker(ids[0]);
      return;
    }

    setUpdating(ids[0]);
    const updateData: Record<string, unknown> = { estado: siguiente };
    if (siguiente === "pendiente") {
      updateData.hora_preparado = null;
      updateData.hora_entrega_estimada = null;
    }
    await Promise.all(ids.map((id) => adminWrite("pedidos", "update", updateData, [{ column: "id", value: id }])));
    await load();
    setUpdating(null);
  }

  async function cancelarGroup(ids: string[]) {
    if (!confirm("¿Cancelar este pedido?")) return;
    setUpdating(ids[0]);
    await Promise.all(ids.map((id) => adminWrite("pedidos", "update", { estado: "cancelado" }, [{ column: "id", value: id }])));
    await load();
    setUpdating(null);
  }

  async function eliminarGroup(ids: string[]) {
    if (!confirm("¿Eliminar este pedido? El cliente ya no lo verá, pero se conservará en admin.")) return;
    setUpdating(ids[0]);
    await Promise.all(ids.map((id) => adminWrite("pedidos", "update", { estado: "eliminado" }, [{ column: "id", value: id }])));
    await load();
    setUpdating(null);
  }

  async function confirmarEnvasadoGroup(ids: string[], horaEntrega: string) {
    setShowDeliveryPicker(null);
    setUpdating(ids[0]);
    await Promise.all(ids.map((id) => adminWrite("pedidos", "update", {
      estado: "preparado",
      hora_preparado: new Date().toISOString(),
      hora_entrega_estimada: horaEntrega,
    }, [{ column: "id", value: id }])));
    await load();
    setUpdating(null);
  }

  async function marcarTodoEntregado() {
    const ids = pedidos.filter((p) => p.estado !== "entregado" && p.estado !== "cancelado" && p.estado !== "eliminado").map((p) => p.id);
    if (!ids.length) return;
    await Promise.all(ids.map((id) => adminWrite("pedidos", "update", { estado: "entregado" }, [{ column: "id", value: id }])));
    await load();
  }

  type PedidoGroup = { token: string; pedidos: Pedido[]; ids: string[]; estado: string; cliente: Pedido["clientes"]; totalBotellas: number };

  function groupByToken(pedidos: Pedido[]): PedidoGroup[] {
    const map = new Map<string, Pedido[]>();
    for (const p of pedidos) {
      const key = p.token ?? p.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).map(([token, peds]) => ({
      token,
      pedidos: peds,
      ids: peds.map((p) => p.id),
      estado: peds[0].estado,
      cliente: peds[0].clientes,
      totalBotellas: peds.reduce((s, p) => s + p.cantidad, 0),
    }));
  }

  const pedidosActivos = pedidos.filter((p) => p.estado !== "cancelado");

  const resumen = pedidosActivos.reduce<Record<string, { nombre: string; color: string; total: number }>>(
    (acc, p) => {
      const slug = p.formulas?.slug ?? "?";
      if (!acc[slug]) acc[slug] = { nombre: p.formulas?.nombre ?? slug, color: p.formulas?.color_acento ?? "#888", total: 0 };
      acc[slug].total += p.cantidad;
      return acc;
    }, {}
  );

  const desglose: Record<string, { gramos: number; unidad: string }> = {};
  for (const p of pedidosActivos) {
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

  const totalBotellas = pedidosActivos.reduce((s, p) => s + p.cantidad, 0);
  const pendientes = pedidosActivos.filter((p) => p.estado !== "entregado").length;

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
          {/* Resumen de produccion */}
          <div
            className="rounded-2xl p-6 mb-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#8A8A8A" }}>
                  Produccion de hoy
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
                      <span className="font-inter text-sm font-medium" style={{ color: "#F5F0E8" }}>{fmtGramos(gramos)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Lista de pedidos (agrupados por token) */}
          <div className="flex flex-col gap-2 mb-6">
            <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#555" }}>
              Pedidos
            </p>
            {groupByToken(pedidos).map((group) => {
              const firstPed = group.pedidos[0];
              const multiFormula = group.pedidos.length > 1;
              const formulaNames = group.pedidos.map((p) => p.formulas?.nombre ?? "?").join(" + ");

              return (
              <div key={group.token}>
                <div
                  className="flex items-start justify-between rounded-xl px-4 py-3.5 transition-all"
                  style={{
                    background: group.estado === "entregado"
                      ? "rgba(74,94,58,0.08)"
                      : group.estado === "cancelado"
                      ? "rgba(122,32,48,0.06)"
                      : group.estado === "eliminado"
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(255,255,255,0.04)",
                    border: group.estado === "cancelado" ? "1px solid rgba(122,32,48,0.15)" : group.estado === "eliminado" ? "1px dashed rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.06)",
                    opacity: group.estado === "entregado" || group.estado === "cancelado" || group.estado === "eliminado" ? 0.5 : 1,
                    textDecoration: group.estado === "cancelado" ? "line-through" : "none",
                    borderBottomLeftRadius: (showDeliveryPicker === firstPed.id || showMoverPicker === firstPed.id) ? 0 : undefined,
                    borderBottomRightRadius: (showDeliveryPicker === firstPed.id || showMoverPicker === firstPed.id) ? 0 : undefined,
                  }}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-inter text-sm font-medium" style={{ color: "#F5F0E8" }}>
                        {group.cliente?.nombre ?? "Sin nombre"}
                        {firstPed.numero_pedido && (
                          <span className="font-inter text-xs ml-2" style={{ color: "#8A8A8A", fontWeight: 400 }}>
                            #{firstPed.numero_pedido}
                          </span>
                        )}
                      </p>
                      {multiFormula && (
                        <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(74,94,58,0.15)", color: "#4A5E3A" }}>
                          {group.totalBotellas} bot.
                        </span>
                      )}
                      {firstPed.es_sorpresa && (
                        <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(184,134,11,0.2)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.3)" }}>Sorpresa</span>
                      )}
                      {firstPed.tipo_pedido === "domingo" && (
                        <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(184,134,11,0.15)", color: "#B8860B" }}>Domingo</span>
                      )}
                      {firstPed.tipo_pedido === "extra" && (
                        <span className="font-inter text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(122,32,48,0.15)", color: "#7A2030" }}>Extra</span>
                      )}
                    </div>
                    {group.pedidos.map((p) => (
                      <p key={p.id} className="font-inter text-xs mt-0.5" style={{ color: p.formulas?.color_acento ?? "#8A8A8A" }}>
                        {p.formulas?.nombre} x {p.cantidad}
                        {p.ingredientes_excluidos && p.ingredientes_excluidos.length > 0 && (
                          <span style={{ color: "#E05070" }}> · Sin: {p.ingredientes_excluidos.join(", ")}</span>
                        )}
                      </p>
                    ))}
                    {firstPed.notas && (
                      <p className="font-inter text-xs mt-0.5" style={{ color: "#8A8A8A" }}>
                        {firstPed.notas}
                      </p>
                    )}
                    {firstPed.preferencia_sorpresa && (
                      <p className="font-inter text-xs mt-0.5" style={{ color: "#B8860B" }}>
                        Prefiere: {firstPed.preferencia_sorpresa}
                      </p>
                    )}
                    {firstPed.hora_entrega_estimada && (firstPed.estado === "preparado" || firstPed.estado === "entregado") && (
                      <p className="font-inter text-xs mt-0.5" style={{ color: "#4A5E3A" }}>
                        Entrega estimada: {firstPed.hora_entrega_estimada}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleEstadoGroup(group.ids, group.estado)}
                      disabled={updating === firstPed.id}
                      className="flex items-center gap-2 rounded-full px-3 py-1.5 font-inter text-xs transition-all"
                      style={estadoBadgeStyle(group.estado)}
                    >
                      {updating === firstPed.id ? "..." : estadoLabel(group.estado)}
                    </button>
                    {group.estado === "confirmado" && group.cliente?.telefono && (
                      <button
                        onClick={() => {
                          const jugoLabel = multiFormula ? `pedido (${formulaNames})` : (firstPed.formulas?.nombre ?? "LUMO");
                          const msg = `Hola, ${group.cliente!.nombre}.\n\nTu ${jugoLabel} ha sido confirmado para el dia de manana.\n\nPuedes seguir tu entrega aqui:\n${LUMO_DOMAIN}/mi-pedido/${firstPed.token}`;
                          window.open(buildWhatsAppUrl(group.cliente!.telefono!, msg), "_blank");
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                        style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)" }}
                        title="Enviar WhatsApp - Confirmado"
                      >
                        <WhatsAppIcon />
                      </button>
                    )}
                    {group.estado === "preparado" && group.cliente?.telefono && firstPed.hora_preparado && (
                      <button
                        onClick={() => {
                          const hora = formatHora(firstPed.hora_preparado!);
                          const entregaLine = firstPed.hora_entrega_estimada ? `\nEntrega estimada: ${firstPed.hora_entrega_estimada}` : "";
                          const jugoLabel = multiFormula ? `pedido (${formulaNames})` : (firstPed.formulas?.nombre ?? "LUMO");
                          const msg = `Hola, ${group.cliente!.nombre}.\n\nTu ${jugoLabel} esta listo.\nHecho esta manana a las ${hora}.${entregaLine}\n\nPuedes seguir tu entrega aqui:\n${LUMO_DOMAIN}/mi-pedido/${firstPed.token}`;
                          window.open(buildWhatsAppUrl(group.cliente!.telefono!, msg), "_blank");
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                        style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)" }}
                        title="Enviar WhatsApp - Listo"
                      >
                        <WhatsAppIcon />
                      </button>
                    )}
                    {group.estado === "entregado" && group.cliente?.telefono && (
                      <button
                        onClick={() => {
                          const msg = `Hola, ${group.cliente!.nombre}.\n\nTu pedido LUMO ha sido entregado.\nEsperamos que lo disfrutes.\n\nCuentanos tu experiencia:\n${LUMO_DOMAIN}/feedback?pedido=${firstPed.token}`;
                          window.open(buildWhatsAppUrl(group.cliente!.telefono!, msg), "_blank");
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                        style={{ background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)" }}
                        title="Enviar WhatsApp - Entregado"
                      >
                        <WhatsAppIcon />
                      </button>
                    )}
                    {group.estado !== "entregado" && group.estado !== "cancelado" && (
                      <button
                        onClick={() => setShowMoverPicker(showMoverPicker === firstPed.id ? null : firstPed.id)}
                        className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                        style={{
                          background: showMoverPicker === firstPed.id ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.12)",
                        }}
                        title="Mover fecha"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#8A8A8A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="12" height="12" rx="2" />
                          <line x1="2" y1="7" x2="14" y2="7" />
                          <line x1="5" y1="1" x2="5" y2="4" />
                          <line x1="11" y1="1" x2="11" y2="4" />
                        </svg>
                      </button>
                    )}
                    {group.estado !== "entregado" && group.estado !== "cancelado" && (
                      <button
                        onClick={() => cancelarGroup(group.ids)}
                        className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                        style={{ background: "rgba(122,32,48,0.1)", border: "1px solid rgba(122,32,48,0.2)" }}
                        title="Cancelar pedido"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7A2030" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                    {group.estado !== "eliminado" && (
                      <button
                        onClick={() => eliminarGroup(group.ids)}
                        className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        title="Eliminar (ocultar al cliente)"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                      </button>
                    )}
                    {group.estado === "cancelado" && (
                      <button
                        onClick={() => reactivarGroup(group.ids)}
                        disabled={updating === firstPed.id}
                        className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                        style={{ background: "rgba(74,94,58,0.15)", border: "1px solid rgba(74,94,58,0.3)" }}
                        title="Reactivar pedido"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="1 4 1 10 7 10" />
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Delivery time picker */}
                {showDeliveryPicker === firstPed.id && (
                  <div
                    className="rounded-b-xl px-4 py-3"
                    style={{ background: "rgba(74,94,58,0.08)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none" }}
                  >
                    <p className="font-inter text-xs mb-2.5" style={{ color: "#8A8A8A" }}>Hora estimada de entrega:</p>
                    <div className="flex gap-2 flex-wrap">
                      {DELIVERY_RANGES.map((range) => (
                        <button
                          key={range}
                          onClick={() => confirmarEnvasadoGroup(group.ids, range)}
                          className="rounded-lg px-3 py-1.5 font-inter text-xs font-medium transition-all"
                          style={{ background: "rgba(74,94,58,0.25)", color: "#6DBF67", border: "1px solid rgba(74,94,58,0.4)" }}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowDeliveryPicker(null)}
                      className="font-inter text-xs mt-2"
                      style={{ color: "#555" }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {/* Mover fecha picker */}
                {showMoverPicker === firstPed.id && (
                  <div
                    className="rounded-b-xl px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none" }}
                  >
                    <p className="font-inter text-xs mb-2.5" style={{ color: "#8A8A8A" }}>Mover a:</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {moverDays.map((dia) => {
                        const d = new Date(dia + "T12:00:00");
                        const label = d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
                        return (
                          <button
                            key={dia}
                            onClick={() => moverFechaGroup(group.ids, dia)}
                            className="rounded-lg px-2.5 py-1.5 font-inter text-xs transition-all"
                            style={{ background: "rgba(255,255,255,0.07)", color: "#C0B8AE", border: "1px solid rgba(255,255,255,0.1)" }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setShowMoverPicker(null)}
                      className="font-inter text-xs mt-2"
                      style={{ color: "#555" }}
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
              );
            })}
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
                    const hora = formatHora(p.hora_preparado!);
                    const entregaLine = p.hora_entrega_estimada ? `\nEntrega estimada: ${p.hora_entrega_estimada}` : "";
                    const msg = `Hola, ${p.clientes!.nombre}.\n\nTu ${p.formulas?.nombre ?? "LUMO"} esta listo.\nHecho esta manana a las ${hora}.${entregaLine}\n\nPuedes seguir tu entrega aqui:\n${LUMO_DOMAIN}/mi-pedido/${p.token}`;
                    window.open(buildWhatsAppUrl(p.clientes!.telefono!, msg), "_blank");
                  }, i * WHATSAPP_BATCH_DELAY_MS);
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

function WhatsAppIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

function estadoLabel(estado: string) {
  if (estado === "pendiente") return "Pendiente";
  if (estado === "confirmado") return "Confirmado";
  if (estado === "preparado") return "Envasado";
  if (estado === "cancelado") return "Cancelado";
  if (estado === "eliminado") return "Eliminado";
  return "Entregado";
}

function estadoBadgeStyle(estado: string): React.CSSProperties {
  if (estado === "pendiente") return { background: "rgba(255,255,255,0.1)", color: "#C0B8AE", border: "1px solid rgba(255,255,255,0.15)" };
  if (estado === "confirmado") return { background: "rgba(74,94,58,0.15)", color: "#4A5E3A", border: "1px solid rgba(74,94,58,0.3)" };
  if (estado === "preparado") return { background: "rgba(184,134,11,0.25)", color: "#E6A800", border: "1px solid rgba(184,134,11,0.4)" };
  if (estado === "cancelado") return { background: "rgba(122,32,48,0.15)", color: "#7A2030", border: "1px solid rgba(122,32,48,0.3)", cursor: "default" };
  if (estado === "eliminado") return { background: "rgba(255,255,255,0.04)", color: "#555", border: "1px solid rgba(255,255,255,0.08)", textDecoration: "line-through" as const };
  return { background: "rgba(74,94,58,0.25)", color: "#6DBF67", border: "1px solid rgba(74,94,58,0.4)" };
}

function EmptyDay() {
  return (
    <div
      className="rounded-2xl p-10 text-center"
      style={{ border: "1px dashed rgba(255,255,255,0.08)" }}
    >
      <p className="font-cormorant text-2xl mb-2" style={{ color: "#F5F0E8" }}>Sin pedidos hoy</p>
      <p className="font-inter text-sm" style={{ color: "#555" }}>Agrega pedidos desde la seccion Clientes.</p>
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
