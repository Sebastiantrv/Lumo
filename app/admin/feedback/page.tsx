"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Feedback = {
  id: string;
  nombre: string;
  sabor_rating: number;
  sensacion_sabor: string;
  frescura_rating: number;
  experiencia_lumo: string;
  recomendacion: string;
  precio_justo: string;
  razon_adopcion: string;
  mejora_abierta: string | null;
  submitted_at: string;
  created_at: string;
};

function ratingColor(n: number): string {
  if (n <= 2) return "#E05070";
  if (n === 3) return "#E6A800";
  return "#6DBF67";
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <Loader />;

  const total = items.length;
  const avgSabor = total > 0 ? items.reduce((s, i) => s + i.sabor_rating, 0) / total : 0;
  const avgFrescura = total > 0 ? items.reduce((s, i) => s + i.frescura_rating, 0) / total : 0;

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#4A5E3A" }}>
          Feedback
        </p>
        <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "2rem" }}>
          {total} respuesta{total !== 1 ? "s" : ""}
        </h1>
      </div>

      {/* Summary metrics */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <MetricCard label="Respuestas" value={String(total)} />
          <MetricCard label="Sabor promedio" value={`${avgSabor.toFixed(1)} / 5`} />
          <MetricCard label="Frescura promedio" value={`${avgFrescura.toFixed(1)} / 5`} />
        </div>
      )}

      {total === 0 ? (
        <div className="rounded-2xl p-10 text-center" style={{ border: "1px dashed rgba(255,255,255,0.08)" }}>
          <p className="font-cormorant text-2xl mb-2" style={{ color: "#F5F0E8" }}>Sin feedback aún</p>
          <p className="font-inter text-sm" style={{ color: "#555" }}>Los resultados aparecerán aquí cuando alguien responda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((fb) => (
            <FeedbackCard key={fb.id} fb={fb} />
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <p className="font-inter text-xs uppercase tracking-widest" style={{ color: "#555" }}>
        {label}
      </p>
      <p className="font-cormorant font-light" style={{ fontSize: "1.6rem", color: "#F5F0E8" }}>
        {value}
      </p>
    </div>
  );
}

function FeedbackCard({ fb }: { fb: Feedback }) {
  const pills = [
    { label: "Sensación", value: fb.sensacion_sabor },
    { label: "Experiencia", value: fb.experiencia_lumo },
    { label: "Recomendación", value: fb.recomendacion },
    { label: "Precio", value: fb.precio_justo },
    { label: "Razón", value: fb.razon_adopcion },
  ];

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Top row: nombre + date */}
      <div className="flex items-center justify-between">
        <span className="font-inter text-sm font-medium" style={{ color: "#F5F0E8" }}>
          {fb.nombre}
        </span>
        <span className="font-inter text-xs" style={{ color: "#555" }}>
          {fb.submitted_at}
        </span>
      </div>

      {/* Ratings */}
      <div className="flex items-center gap-4">
        <span className="font-inter text-xs" style={{ color: "#8A8A8A" }}>
          Sabor:{" "}
          <span style={{ color: ratingColor(fb.sabor_rating), fontWeight: 500 }}>
            {fb.sabor_rating}/5
          </span>
        </span>
        <span className="font-inter text-xs" style={{ color: "#8A8A8A" }}>
          Frescura:{" "}
          <span style={{ color: ratingColor(fb.frescura_rating), fontWeight: 500 }}>
            {fb.frescura_rating}/5
          </span>
        </span>
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-2">
        {pills.map((p) => (
          <span
            key={p.label}
            className="font-inter text-xs px-3 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.06)", color: "#8A8A8A", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {p.value}
          </span>
        ))}
      </div>

      {/* Mejora abierta */}
      {fb.mejora_abierta && (
        <p className="font-inter text-sm italic" style={{ color: "#555" }}>
          &ldquo;{fb.mejora_abierta}&rdquo;
        </p>
      )}
    </div>
  );
}

function Loader() {
  return (
    <div className="flex justify-center py-16">
      <div
        className="w-5 h-5 rounded-full border-2 animate-spin"
        style={{ borderColor: "#4A5E3A", borderTopColor: "transparent" }}
      />
    </div>
  );
}
