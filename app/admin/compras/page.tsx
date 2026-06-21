"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getWeekRange } from "@/lib/dates";
import { fmtGramos } from "@/lib/format";

type Item = {
  ingrediente: string;
  unidad: string;
  gramos: number;
};

export default function ComprasPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  const { inicio, fin, label } = getWeekRange(weekOffset);

  async function load() {
    setLoading(true);

    // Pedidos de la semana
    const { data: pedidos } = await supabase
      .from("pedidos")
      .select("formula_id, cantidad")
      .gte("dia_entrega", inicio)
      .lte("dia_entrega", fin);

    if (!pedidos?.length) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Recetas con ingredientes
    const { data: recetas } = await supabase
      .from("recetas")
      .select("formula_id, gramos, ingredientes(nombre, unidad)");

    // Calcular totales
    const totales: Record<string, { gramos: number; unidad: string }> = {};

    for (const pedido of pedidos) {
      const recetasFormula = recetas?.filter((r) => r.formula_id === pedido.formula_id) ?? [];
      for (const r of recetasFormula) {
        const ing = r.ingredientes as unknown as { nombre: string; unidad: string };
        const key = ing.nombre;
        if (!totales[key]) totales[key] = { gramos: 0, unidad: ing.unidad };
        totales[key].gramos += r.gramos * pedido.cantidad;
      }
    }

    const lista = Object.entries(totales)
      .map(([nombre, { gramos, unidad }]) => ({ ingrediente: nombre, gramos, unidad }))
      .sort((a, b) => b.gramos - a.gramos);

    setItems(lista);
    setLoading(false);
  }

  useEffect(() => { load(); }, [weekOffset]);

  function copiarLista() {
    const texto = `Lista de compras LUMO — ${label}\n\n` +
      items.map((i) => `${i.ingrediente}: ${fmtGramos(i.gramos, i.unidad)}`).join("\n");
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#4A5E3A" }}>
            Lista de compras
          </p>
          <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2rem" }}>
            {label}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A" }}>‹</button>
          <button onClick={() => setWeekOffset(0)} className="px-3 h-8 rounded-lg font-inter text-xs" style={{ background: weekOffset === 0 ? "rgba(74,94,58,0.2)" : "rgba(255,255,255,0.05)", color: weekOffset === 0 ? "#4A5E3A" : "#8A8A8A" }}>Esta semana</button>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", color: "#8A8A8A" }}>›</button>
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div
            className="rounded-2xl overflow-hidden mb-5"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {items.map((item, i) => (
              <div
                key={item.ingrediente}
                className="flex items-center justify-between px-5 py-4"
                style={{
                  borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
                }}
              >
                <span className="font-inter text-sm" style={{ color: "#F5F0E8" }}>
                  {item.ingrediente}
                </span>
                <span className="font-cormorant text-lg font-light" style={{ color: "#4A5E3A" }}>
                  {fmtGramos(item.gramos, item.unidad)}
                </span>
              </div>
            ))}
          </div>

          <div
            className="rounded-xl px-5 py-4 mb-5 flex items-start gap-3"
            style={{ background: "rgba(74,94,58,0.1)", border: "1px solid rgba(74,94,58,0.2)" }}
          >
            <InfoIcon />
            <p className="font-inter text-xs leading-relaxed" style={{ color: "#8A8A8A" }}>
              Cantidades calculadas automáticamente con base en los pedidos de la semana y las recetas actuales.
              Si modificas el gramaje en Recetas, esta lista se actualiza sola.
            </p>
          </div>

          <button
            onClick={copiarLista}
            className="w-full rounded-xl py-3.5 font-inter text-sm font-medium transition-all"
            style={{
              background: copiado ? "rgba(74,94,58,0.2)" : "#F5F0E8",
              color: copiado ? "#4A5E3A" : "#0D0D0D",
              border: copiado ? "1px solid rgba(74,94,58,0.3)" : "none",
            }}
          >
            {copiado ? "¡Copiado!" : "Copiar lista para WhatsApp"}
          </button>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
      <p className="font-cormorant text-2xl mb-2" style={{ color: "#F5F0E8" }}>Sin pedidos esta semana</p>
      <p className="font-inter text-sm" style={{ color: "#555" }}>Agrega pedidos para ver la lista de compras.</p>
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

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}
