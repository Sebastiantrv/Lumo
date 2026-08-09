"use client";

import { useEffect, useState } from "react";
import { EASE } from "./Reveal";

/**
 * Relative, qualitative comparison. Deliberately unnumbered —
 * we are describing how two extraction methods differ, not publishing
 * measurements we have taken, so bar length carries the claim and nothing more.
 */
const metricas = [
  { label: "Calor generado al extraer", tradicional: 0.85, frio: 0.15, mejorEs: "menos" },
  { label: "Oxidación durante el proceso", tradicional: 0.75, frio: 0.28, mejorEs: "menos" },
  { label: "Conservación del sabor", tradicional: 0.45, frio: 0.9, mejorEs: "más" },
  { label: "Aprovechamiento del ingrediente", tradicional: 0.55, frio: 0.85, mejorEs: "más" },
] as const;

export default function PrensadoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  // Lock scroll and wire Escape only while open.
  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    // One frame later so the entry transition has a starting state to move from.
    const raf = requestAnimationFrame(() => setMounted(true));

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(raf);
      setMounted(false);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Qué significa prensado en frío"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0"
        style={{
          background: "rgba(6,6,6,0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          opacity: mounted ? 1 : 0,
          transition: `opacity 0.4s ${EASE}`,
        }}
      />

      <div
        className="relative w-full sm:max-w-xl max-h-[88svh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{
          background: "#111111",
          border: "1px solid rgba(245,240,232,0.10)",
          padding: "clamp(1.75rem, 5vw, 2.5rem)",
          opacity: mounted ? 1 : 0,
          transform: mounted ? "none" : "translateY(24px) scale(0.985)",
          transition: `opacity 0.5s ${EASE}, transform 0.5s ${EASE}`,
        }}
      >
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <p className="font-inter uppercase" style={{ fontSize: 10, letterSpacing: "0.22em", color: "#4A5E3A" }}>
              Método de extracción
            </p>
            <h3
              className="font-cormorant font-light"
              style={{ fontSize: "clamp(1.35rem, 4.4vw, 1.75rem)", color: "#F5F0E8", lineHeight: 1.25 }}
            >
              Prensado tradicional
              <span style={{ color: "#5A5A5A" }}> vs </span>
              prensado en frío
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="spring-press rounded-full flex-shrink-0"
            style={{ color: "#8A8A8A", padding: 6, background: "none", border: "none" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-8">
          <LegendDot color="#5A5A5A" label="Tradicional" />
          <LegendDot color="#4A5E3A" label="En frío" />
        </div>

        <div className="flex flex-col gap-7">
          {metricas.map((m, i) => (
            <div key={m.label} className="flex flex-col gap-3">
              <p className="font-inter" style={{ fontSize: "0.82rem", color: "#F5F0E8", fontWeight: 400 }}>
                {m.label}
              </p>
              <Bar value={m.tradicional} color="#5A5A5A" delay={0.15 + i * 0.09} mounted={mounted} />
              <Bar value={m.frio} color="#4A5E3A" delay={0.2 + i * 0.09} mounted={mounted} />
            </div>
          ))}
        </div>

        <p
          className="font-inter"
          style={{
            fontSize: "0.72rem",
            lineHeight: 1.7,
            color: "#6A6A6A",
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(245,240,232,0.07)",
          }}
        >
          Comparación general entre métodos de extracción. Las proporciones son ilustrativas
          y buscan explicar la diferencia entre ambos procesos.
        </p>
      </div>
    </div>
  );
}

function Bar({ value, color, delay, mounted }: { value: number; color: string; delay: number; mounted: boolean }) {
  return (
    <div style={{ height: 4, borderRadius: 999, background: "rgba(245,240,232,0.06)", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          borderRadius: 999,
          background: color,
          transformOrigin: "left",
          transform: `scaleX(${mounted ? value : 0})`,
          width: "100%",
          transition: `transform 1.1s ${EASE} ${delay}s`,
        }}
      />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ width: 7, height: 7, borderRadius: 999, background: color, display: "block" }} />
      <span className="font-inter" style={{ fontSize: "0.75rem", color: "#8A8A8A" }}>
        {label}
      </span>
    </div>
  );
}
