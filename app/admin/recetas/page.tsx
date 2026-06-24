"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { adminWrite } from "@/lib/admin-api";

type Receta = {
  id: string;
  gramos: number;
  ingredientes: { id: string; nombre: string; unidad: string };
  formula_id: string;
};

type Formula = {
  id: string;
  nombre: string;
  slug: string;
  color_acento: string;
  recetas: Receta[];
};

export default function RecetasPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function load() {
    const { data: fList } = await supabase.from("formulas").select("*").order("nombre");
    const { data: rList } = await supabase
      .from("recetas")
      .select("id, gramos, formula_id, ingredientes(id, nombre, unidad)");

    const result = (fList ?? []).map((f) => ({
      ...f,
      recetas: (rList ?? [])
        .filter((r) => r.formula_id === f.id)
        .map((r) => ({ ...r, ingredientes: r.ingredientes as unknown as { id: string; nombre: string; unidad: string } }))
        .sort((a, b) => (b.gramos - a.gramos)),
    }));

    setFormulas(result);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateGramos(recetaId: string, nuevoGramos: number) {
    setSaving(recetaId);
    await adminWrite("recetas", "update", { gramos: nuevoGramos, updated_at: new Date().toISOString() }, [{ column: "id", value: recetaId }]);
    setSaving(null);
    setSaved(recetaId);
    setTimeout(() => setSaved(null), 1500);
    load();
  }

  if (loading) return <Loader />;

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#4A5E3A" }}>
          Recetas
        </p>
        <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2rem" }}>
          Gramaje por botella
        </h1>
        <p className="font-inter text-sm mt-1" style={{ color: "#555" }}>
          Edita los gramos de cada ingrediente. Los cambios afectan la lista de compras automáticamente.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {formulas.map((f) => (
          <div
            key={f.id}
            className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${f.color_acento}25` }}
          >
            {/* Header */}
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{ background: `${f.color_acento}12`, borderBottom: `1px solid ${f.color_acento}20` }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color_acento }} />
              <h2 className="font-inter text-sm font-semibold uppercase tracking-widest" style={{ color: "#F5F0E8" }}>
                {f.nombre}
              </h2>
              <span className="ml-auto font-cormorant text-lg" style={{ color: f.color_acento }}>
                {f.recetas.reduce((s, r) => s + r.gramos, 0)} g / botella
              </span>
            </div>

            {/* Ingredientes */}
            <div>
              {f.recetas.map((r, i) => (
                <RecetaRow
                  key={r.id}
                  receta={r}
                  isLast={i === f.recetas.length - 1}
                  saving={saving === r.id}
                  saved={saved === r.id}
                  onSave={(v) => updateGramos(r.id, v)}
                  accentColor={f.color_acento}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecetaRow({
  receta, isLast, saving, saved, onSave, accentColor,
}: {
  receta: Receta;
  isLast: boolean;
  saving: boolean;
  saved: boolean;
  onSave: (v: number) => void;
  accentColor: string;
}) {
  const [value, setValue] = useState(String(receta.gramos));
  const [editing, setEditing] = useState(false);

  function handleBlur() {
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0 && num !== receta.gramos) {
      onSave(num);
    }
    setEditing(false);
  }

  return (
    <div
      className="flex items-center justify-between px-5 py-3.5"
      style={{
        borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.04)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <span className="font-inter text-sm" style={{ color: "#F5F0E8" }}>
        {receta.ingredientes.nombre}
      </span>
      <div className="flex items-center gap-2">
        {saved && (
          <span className="font-inter text-xs" style={{ color: "#4A5E3A" }}>✓</span>
        )}
        <div
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 transition-all"
          style={{
            background: editing ? `${accentColor}15` : "rgba(255,255,255,0.05)",
            border: editing ? `1px solid ${accentColor}40` : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setEditing(true)}
            onBlur={handleBlur}
            className="w-14 bg-transparent font-inter text-sm text-right outline-none"
            style={{ color: editing ? "#F5F0E8" : "#8A8A8A" }}
          />
          <span className="font-inter text-xs" style={{ color: "#555" }}>
            {receta.ingredientes.unidad}
          </span>
        </div>
        {saving && (
          <div className="w-3 h-3 rounded-full border animate-spin" style={{ borderColor: accentColor, borderTopColor: "transparent" }} />
        )}
      </div>
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
