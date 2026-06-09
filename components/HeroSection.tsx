"use client";

import Image from "next/image";
import { useState } from "react";

export default function HeroSection() {
  const [imgError, setImgError] = useState(false);

  return (
    <section
      id="hero"
      className="relative overflow-hidden grid grid-cols-2 items-center min-h-[calc(100svh-72px)] md:min-h-[calc(100vh-88px)]"
    >
      {/* ── Left column ── */}
      <div className="flex flex-col gap-4 md:gap-6 pl-4 pr-2 md:pl-10 py-8 md:py-12 z-10">
        <h1
          className="font-cormorant text-[2rem] leading-[1.15] md:text-6xl lg:text-7xl font-light text-[#F5F0E8] spring-in"
          style={{ animationDelay: "0.05s" }}
        >
          Prensados<br />en frío.<br />
          Hechos<br />cada<br />mañana.
        </h1>

        <div
          className="flex items-center gap-3 spring-in"
          style={{ animationDelay: "0.12s" }}
        >
          <div className="h-px w-8 md:w-12 bg-[#F5F0E8]/30" />
          <LeafIcon />
        </div>

        <p
          className="font-inter text-[#8A8A8A] text-[11px] md:text-lg leading-relaxed spring-in"
          style={{ animationDelay: "0.18s" }}
        >
          Jugos naturales preparados en lotes limitados y entregados cada mañana.
        </p>

        <div
          className="flex flex-col gap-2 spring-in"
          style={{ animationDelay: "0.25s" }}
        >
          <a
            href="/piloto"
            className="inline-flex items-center justify-center gap-1.5 bg-[#F5F0E8] text-[#0D0D0D] font-inter font-medium text-[11px] md:text-sm px-4 md:px-7 py-2.5 md:py-3.5 rounded-full spring-press shadow-lg whitespace-nowrap"
          >
            Unirme al piloto <span aria-hidden="true">→</span>
          </a>
          <a
            href="/formulas"
            className="inline-flex items-center justify-center gap-1.5 font-inter font-medium text-[11px] md:text-sm px-4 md:px-7 py-2.5 md:py-3.5 rounded-full spring-press glass text-[#F5F0E8] whitespace-nowrap"
          >
            Ver fórmulas <span aria-hidden="true">→</span>
          </a>
        </div>

        <div
          className="flex items-start gap-2 spring-in"
          style={{ animationDelay: "0.32s" }}
        >
          <LockIcon />
          <p className="font-inter text-[#8A8A8A] text-[10px] md:text-xs leading-relaxed">
            Acceso exclusivo para un número limitado de personas cada semana.
          </p>
        </div>
      </div>

      {/* ── Right column — image bleeds to right edge ── */}
      <div
        className="relative self-stretch"
        style={{
          animation: "springInRight 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          animationDelay: "0.1s",
        }}
      >
        {imgError ? (
          /* Placeholder when no image uploaded yet */
          <div className="absolute inset-0 flex items-center justify-end pr-0">
            <BottlePlaceholder />
          </div>
        ) : (
          <Image
            src="/bottle-hero.png"
            alt="LUMO Rojo Vital — jugo prensado en frío"
            fill
            priority
            onError={() => setImgError(true)}
            className="object-contain object-right-bottom md:object-right-center"
            sizes="(max-width: 768px) 50vw, 45vw"
          />
        )}

        {/* Red glow */}
        <div className="absolute bottom-0 right-0 w-48 h-48 md:w-72 md:h-72 bg-[#7A2030]/15 rounded-full blur-3xl pointer-events-none" />
      </div>
    </section>
  );
}

function BottlePlaceholder() {
  return (
    <div className="relative w-36 h-64 md:w-52 md:h-96 mr-0">
      <div
        className="w-full h-full rounded-[32px] glass-rojo flex flex-col items-center justify-center gap-3"
        style={{ boxShadow: "0 20px 60px rgba(122, 32, 48, 0.25), 0 1px 0 rgba(122, 32, 48, 0.25) inset" }}
      >
        <BeetIcon color="#7A2030" size={20} />
        <div className="text-center px-4">
          <p className="font-cormorant text-[#F5F0E8]/90 text-base font-semibold tracking-widest">LUMO</p>
          <div className="h-px w-10 bg-[#7A2030]/50 mx-auto my-2" />
          <p className="font-cormorant text-[#7A2030] text-xs font-medium tracking-wider italic">ROJO VITAL</p>
        </div>
        <p className="font-inter text-[#8A8A8A]/40 text-[9px] tracking-widest uppercase mt-2">250 ml</p>
      </div>
      <div className="absolute -inset-8 bg-[#7A2030]/10 rounded-full blur-3xl -z-10" />
    </div>
  );
}

function LeafIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 flex-shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function BeetIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="14" r="6" />
      <path d="M12 8V4" />
      <path d="M9 5c1 1 3 1 3 3" />
      <path d="M15 5c-1 1-3 1-3 3" />
    </svg>
  );
}
