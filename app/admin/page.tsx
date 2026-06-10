"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Pedido = {
  id: string;
  cantidad: number;
  estado: string;
  dia_entrega: string;
  clientes: { nombre: string } | null;
  formulas: { nombre: string; slug: string; color_acento: string } | null;
};

function today() {
  return new Date().toISOString().split("T")[0];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function getWeekRange(offset = 0) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  return { inicio: monday.toISOString().split("T")[0], fin: saturday.toISOString().split("T")[0] };
}

export default function AdminInicio() {
  const [pedidosHoy, setPedidosHoy] = useState<Pedido[]>([]);
  const [pedidosSemana, setPedidosSemana] = useState<Pedido[]>([]);
  const [compras, setCompras] = useState<{ ingrediente: string; gramos: number; unidad: string }[]>([]);
  const [numClientes, setNumClientes] = useState(0);
  const [loading, setLoading] = useState(true);

  const fecha = today();
  const fechaLabel = new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const { inicio, fin } = getWeekRange(0);

  async function load() {
    const [hoyRes, semanaRes, clientesRes, recetasRes] = await Promise.all([
      supabase.from("pedidos").select("*, clientes(nombre), formulas(nombre, slug, color_acento)").eq("dia_entrega", fecha).order("created_at"),
      supabase.from("pedidos").select("*, clientes(nombre), formulas(nombre, slug, color_acento)").gte("dia_entrega", inicio).lte("dia_entrega", fin).order("dia_entrega"),
      supabase.from("clientes").select("id", { count: "exact", head: true }),
      supabase.from("recetas").select("formula_id, gramos, ingredientes(nombre, unidad)"),
    ]);

    setPedidosHoy(hoyRes.data ?? []);
    setPedidosSemana(semanaRes.data ?? []);
    setNumClientes(clientesRes.count ?? 0);

    // Calcular compras de la semana
    const totales: Record<string, { gramos: number; unidad: string }> = {};
    for (const pedido of semanaRes.data ?? []) {
      for (const r of (recetasRes.data ?? []).filter((r) => r.formula_id === (pedido as any).formula_id)) {
        const ing = r.ingredientes as any;
        if (!totales[ing.nombre]) totales[ing.nombre] = { gramos: 0, unidad: ing.unidad };
        totales[ing.nombre].gramos += r.gramos * pedido.cantidad;
      }
    }
    setCompras(Object.entries(totales).map(([ingrediente, v]) => ({ ingrediente, ...v })).sort((a, b) => b.gramos - a.gramos));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <PageLoader />;

  const botellasHoy = pedidosHoy.reduce((s, p) => s + p.cantidad, 0);
  const pendientesHoy = pedidosHoy.filter((p) => p.estado !== "entregado").length;
  const botellasSemana = pedidosSemana.reduce((s, p) => s + p.cantidad, 0);

  const resumenHoy = pedidosHoy.reduce<Record<string, { nombre: string; color: string; total: number }>>((acc, p) => {
    const slug = p.formulas?.slug ?? "?";
    if (!acc[slug]) acc[slug] = { nombre: p.formulas?.nombre ?? slug, color: p.formulas?.color_acento ?? "#888", total: 0 };
    acc[slug].total += p.cantidad;
    return acc;
  }, {});

  // Próxima entrega (día futuro más cercano con pedidos, distinto de hoy)
  const proximos = pedidosSemana
    .filter((p) => p.dia_entrega > fecha)
    .sort((a, b) => a.dia_entrega.localeCompare(b.dia_entrega));
  const proximaFecha = proximos[0]?.dia_entrega;
  const proximaEntrega = proximaFecha
    ? { fecha: proximaFecha, pedidos: proximos.filter((p) => p.dia_entrega === proximaFecha) }
    : null;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <p className="font-inter text-sm mb-1" style={{ color: "#4A5E3A", letterSpacing: "0.1em" }}>{greeting()}, Sebastián</p>
        <h1 className="font-cormorant font-light text-[#F5F0E8] capitalize" style={{ fontSize: "2.2rem" }}>{fechaLabel}</h1>
      </div>

      {/* Tres métricas principales */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <MetricCard label="Hoy" value={botellasHoy} unit="botellas" accent="#4A5E3A"
          sub={pendientesHoy > 0 ? `${pendientesHoy} pendiente${pendientesHoy > 1 ? "s" : ""}` : botellasHoy > 0 ? "Todo entregado" : "Sin pedidos"} href="/admin/hoy" />
        <MetricCard label="Esta semana" value={botellasSemana} unit="botellas" accent="#B8860B"
          sub={`${pedidosSemana.length} pedido${pedidosSemana.length !== 1 ? "s" : ""}`} href="/admin/semana" />
        <MetricCard label="Clientes" value={numClientes} unit="registrados" accent="#7A2030"
          sub="Ver todos" href="/admin/clientes" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Producción de hoy */}
        <Panel title="Producción de hoy" href="/admin/hoy" linkLabel="Gestionar">
          {botellasHoy === 0 ? (
            <Empty texto="No hay pedidos para hoy" />
          ) : (
            <div className="flex flex-col gap-3">
              {Object.entries(resumenHoy).map(([slug, { nombre, color, total }]) => (
                <div key={slug} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-inter text-sm" style={{ color: "#F5F0E8" }}>{nombre}</span>
                  </div>
                  <span className="font-cormorant text-lg" style={{ color }}>{total} bot.</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Próxima entrega */}
        <Panel title="Próxima entrega" href="/admin/semana" linkLabel="Ver semana">
          {!proximaEntrega ? (
            <Empty texto="Sin entregas próximas esta semana" />
          ) : (
            <div>
              <p className="font-inter text-xs uppercase tracking-widest mb-3 capitalize" style={{ color: "#B8860B" }}>
                {new Date(proximaEntrega.fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <div className="flex flex-col gap-2">
                {proximaEntrega.pedidos.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="font-inter text-sm" style={{ color: "#F5F0E8" }}>{p.clientes?.nombre ?? "—"}</span>
                    <span className="font-inter text-xs" style={{ color: p.formulas?.color_acento ?? "#8A8A8A" }}>{p.formulas?.nombre} ×{p.cantidad}</span>
                  </div>
                ))}
                {proximaEntrega.pedidos.length > 4 && (
                  <p className="font-inter text-xs mt-1" style={{ color: "#555" }}>+{proximaEntrega.pedidos.length - 4} más</p>
                )}
              </div>
            </div>
          )}
        </Panel>

        {/* Lista de compras (resumen) */}
        <Panel title="Compras de la semana" href="/admin/compras" linkLabel="Ver lista">
          {compras.length === 0 ? (
            <Empty texto="Sin ingredientes por comprar aún" />
          ) : (
            <div className="flex flex-col gap-2.5">
              {compras.slice(0, 5).map((c) => (
                <div key={c.ingrediente} className="flex items-center justify-between">
                  <span className="font-inter text-sm" style={{ color: "#F5F0E8" }}>{c.ingrediente}</span>
                  <span className="font-cormorant text-base" style={{ color: "#4A5E3A" }}>{fmt(c.gramos, c.unidad)}</span>
                </div>
              ))}
              {compras.length > 5 && <p className="font-inter text-xs mt-1" style={{ color: "#555" }}>+{compras.length - 5} ingredientes más</p>}
            </div>
          )}
        </Panel>

        {/* Accesos rápidos */}
        <Panel title="Accesos rápidos">
          <div className="grid grid-cols-2 gap-2.5">
            <QuickAction href="/admin/clientes" label="Nuevo pedido" color="#4A5E3A" />
            <QuickAction href="/admin/clientes" label="Nuevo cliente" color="#7A2030" />
            <QuickAction href="/admin/compras" label="Lista de compras" color="#B8860B" />
            <QuickAction href="/admin/recetas" label="Editar recetas" color="#8A8A8A" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function fmt(g: number, u: string) {
  if (u === "g") return g >= 1000 ? `${(g / 1000).toFixed(1)} kg` : `${g} g`;
  return `${g} ${u}`;
}

function MetricCard({ label, value, unit, sub, accent, href }: { label: string; value: number; unit: string; sub: string; accent: string; href: string }) {
  return (
    <Link href={href} className="rounded-2xl p-5 transition-all block"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p className="font-inter text-xs uppercase tracking-widest mb-2" style={{ color: "#8A8A8A" }}>{label}</p>
      <p className="font-cormorant font-light" style={{ fontSize: "2.6rem", color: "#F5F0E8", lineHeight: 1 }}>
        {value}<span className="font-inter text-xs ml-1.5" style={{ color: "#555" }}>{unit}</span>
      </p>
      <p className="font-inter text-xs mt-2" style={{ color: accent }}>{sub}</p>
    </Link>
  );
}

function Panel({ title, href, linkLabel, children }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-inter text-xs uppercase tracking-widest" style={{ color: "#8A8A8A" }}>{title}</h2>
        {href && linkLabel && (
          <Link href={href} className="font-inter text-xs flex items-center gap-1" style={{ color: "#4A5E3A" }}>
            {linkLabel} →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function QuickAction({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <Link href={href} className="rounded-xl px-4 py-3.5 font-inter text-sm transition-all flex items-center gap-2"
      style={{ background: `${color}14`, border: `1px solid ${color}30`, color: "#F5F0E8" }}>
      <span style={{ color }}>+</span> {label}
    </Link>
  );
}

function Empty({ texto }: { texto: string }) {
  return <p className="font-inter text-sm py-2" style={{ color: "#555" }}>{texto}</p>;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#4A5E3A", borderTopColor: "transparent" }} />
    </div>
  );
}
