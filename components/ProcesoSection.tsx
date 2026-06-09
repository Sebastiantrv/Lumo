"use client";

import { useState } from "react";

const steps = [
  { num: "01", label: "Seleccionamos ingredientes" },
  { num: "02", label: "Prensamos en frío" },
  { num: "03", label: "Embotellamos cada mañana" },
  { num: "04", label: "Entregamos lotes limitados" },
];

export default function ProcesoSection() {
  const [imgError, setImgError] = useState(false);

  return (
    <section
      id="proceso"
      className="relative overflow-hidden"
      style={{ minHeight: "calc(100svh - 68px)" }}
    >
      {/* ── Image — wrapper centers vertically, inner img animates ── */}
      <div
        className="absolute pointer-events-none"
        style={{ top: "50%", right: "0", transform: "translateY(-50%)", width: "48%" }}
      >
        {!imgError ? (
          <img
            src="/bottle-proceso.png"
            alt="LUMO Verde — proceso de prensado en frío"
            onError={() => setImgError(true)}
            fetchPriority="high"
            style={{
              width: "100%",
              display: "block",
              filter: "brightness(1.18) contrast(1.03)",
              animation: "springInRight 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              animationDelay: "0.08s",
            }}
          />
        ) : (
          <div className="w-full h-[60vh] rounded-l-[40px] glass-verde" />
        )}
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-56 h-56 bg-[#4A5E3A]/14 rounded-full blur-3xl pointer-events-none" />

      {/* Gradient — keeps left text readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to right, #0D0D0D 48%, rgba(13,13,13,0.5) 60%, rgba(13,13,13,0) 74%)",
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative z-10 flex flex-col justify-center px-6 py-10 gap-9"
        style={{ minHeight: "calc(100svh - 68px)", maxWidth: "56%" }}
      >
        <h2
          className="font-cormorant font-light text-[#F5F0E8] leading-tight spring-in"
          style={{ fontSize: "clamp(2.2rem, 9vw, 4.5rem)", lineHeight: 1.05, animationDelay: "0.04s" }}
        >
          Hecho con intención
        </h2>

        {/* Steps — just number + label, no box */}
        <div className="flex flex-col gap-5">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="flex items-start gap-4 spring-in"
              style={{ animationDelay: `${0.14 + i * 0.07}s` }}
            >
              <span className="font-cormorant text-2xl font-light text-[#4A5E3A] leading-none pt-0.5">
                {step.num}
              </span>
              <p className="font-inter text-[#F5F0E8] font-light leading-snug" style={{ fontSize: "clamp(0.9rem, 3.8vw, 1.1rem)" }}>
                {step.label}
              </p>
            </div>
          ))}
        </div>

        <a
          href="/piloto"
          className="inline-flex items-center justify-between bg-[#F5F0E8] text-[#0D0D0D] font-inter font-medium rounded-full spring-press self-start spring-in"
          style={{ fontSize: "clamp(0.85rem, 3.4vw, 1rem)", padding: "0.85rem 1.4rem", animationDelay: "0.42s" }}
        >
          Unirme al piloto <span aria-hidden="true" className="ml-3">→</span>
        </a>
      </div>
    </section>
  );
}
