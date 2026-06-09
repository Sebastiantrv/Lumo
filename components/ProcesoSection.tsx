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
      {/* ── Image — flush right, top half only (mirrors homepage) ── */}
      {!imgError ? (
        <img
          src="/bottle-proceso.png"
          alt="LUMO Verde — proceso de prensado en frío"
          onError={() => setImgError(true)}
          className="absolute pointer-events-none"
          style={{
            top: "-2%",
            right: "0",
            width: "46%",
            maxWidth: "none",
            filter: "brightness(1.18) contrast(1.03)",
            animation: "springInRight 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both",
            animationDelay: "0.08s",
          }}
        />
      ) : (
        <div className="absolute right-0 top-[4%] w-[44%] h-[55%] rounded-l-[40px] glass-verde" />
      )}
      <div className="absolute top-[20%] right-0 w-60 h-60 bg-[#4A5E3A]/14 rounded-full blur-3xl pointer-events-none" />

      {/* Gradient — keeps left text readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to right, #0D0D0D 42%, rgba(13,13,13,0.5) 56%, rgba(13,13,13,0) 72%)",
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative z-10 flex flex-col justify-between px-6 py-8 gap-8"
        style={{ minHeight: "calc(100svh - 68px)" }}
      >
        {/* Top: heading constrained to left of the image */}
        <h2
          className="font-cormorant font-light text-[#F5F0E8] leading-tight spring-in"
          style={{ fontSize: "clamp(2.4rem, 9.5vw, 4.5rem)", lineHeight: 1.05, animationDelay: "0.04s", maxWidth: "52%" }}
        >
          Hecho con intención
        </h2>

        {/* Bottom: full-width steps + note + button (below the image) */}
        <div className="flex flex-col gap-6">
          <div
            className="flex flex-col rounded-2xl overflow-hidden glass spring-in"
            style={{ animationDelay: "0.14s" }}
          >
            {steps.map((step, i) => (
              <div
                key={step.num}
                className="flex items-center gap-5 px-6 py-4 spring-press"
                style={{ borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
              >
                <span className="font-cormorant text-2xl font-light text-[#4A5E3A] min-w-[2.25rem]">
                  {step.num}
                </span>
                <p className="font-inter text-[#F5F0E8] font-light" style={{ fontSize: "clamp(0.9rem, 3.6vw, 1.05rem)" }}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-5 spring-in" style={{ animationDelay: "0.28s" }}>
            <div className="flex items-start gap-3">
              <LeafIcon />
              <p className="font-inter text-[#8A8A8A] leading-relaxed" style={{ fontSize: "clamp(0.78rem, 3vw, 0.95rem)" }}>
                Cada lote se prepara por la mañana para conservar frescura, sabor y nutrientes.
              </p>
            </div>

            <a
              href="/piloto"
              className="inline-flex items-center justify-between bg-[#F5F0E8] text-[#0D0D0D] font-inter font-medium rounded-full spring-press"
              style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)", padding: "0.9rem 1.6rem" }}
            >
              Unirme al piloto <span aria-hidden="true" className="ml-3">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}
