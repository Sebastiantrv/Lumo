"use client";

import Image from "next/image";
import { useState } from "react";

export default function HeroSection() {
  const [imgError, setImgError] = useState(false);

  return (
    <section
      id="hero"
      className="relative overflow-hidden grid grid-cols-2 items-stretch min-h-[calc(100svh-72px)] md:min-h-[calc(100vh-88px)]"
    >
      {/* ── Left column ── */}
      <div className="flex flex-col justify-center gap-5 md:gap-7 pl-5 pr-3 md:pl-12 md:pr-6 py-10 md:py-16 z-10">
        <h1
          className="font-cormorant font-light text-[#F5F0E8] spring-in"
          style={{
            fontSize: "clamp(1.85rem, 6vw, 4.5rem)",
            lineHeight: 1.15,
            animationDelay: "0.05s",
          }}
        >
          Prensados<br />en frío.<br /><br />
          Hechos<br />cada<br />mañana.
        </h1>

        <div
          className="flex items-center gap-3 spring-in"
          style={{ animationDelay: "0.13s" }}
        >
          <div className="h-px w-10 bg-[#F5F0E8]/25" />
          <LeafIcon />
        </div>

        <p
          className="font-inter text-[#8A8A8A] leading-relaxed spring-in"
          style={{
            fontSize: "clamp(0.65rem, 1.8vw, 1.05rem)",
            animationDelay: "0.20s",
          }}
        >
          Jugos naturales preparados en lotes limitados y entregados cada mañana.
        </p>

        <div
          className="flex flex-col gap-2.5 spring-in"
          style={{ animationDelay: "0.28s" }}
        >
          <a
            href="/piloto"
            className="inline-flex items-center justify-center gap-1.5 bg-[#F5F0E8] text-[#0D0D0D] font-inter font-medium rounded-full spring-press shadow-lg whitespace-nowrap"
            style={{ fontSize: "clamp(0.62rem, 1.6vw, 0.875rem)", padding: "clamp(0.55rem, 1.5vw, 0.875rem) clamp(0.9rem, 2.5vw, 1.75rem)" }}
          >
            Unirme al piloto <span aria-hidden="true">→</span>
          </a>
          <a
            href="/formulas"
            className="inline-flex items-center justify-center gap-1.5 font-inter font-medium rounded-full spring-press glass text-[#F5F0E8] whitespace-nowrap"
            style={{ fontSize: "clamp(0.62rem, 1.6vw, 0.875rem)", padding: "clamp(0.55rem, 1.5vw, 0.875rem) clamp(0.9rem, 2.5vw, 1.75rem)" }}
          >
            Ver fórmulas <span aria-hidden="true">→</span>
          </a>
        </div>

        <div
          className="flex items-start gap-2 spring-in"
          style={{ animationDelay: "0.35s" }}
        >
          <LockIcon />
          <p
            className="font-inter text-[#8A8A8A] leading-relaxed"
            style={{ fontSize: "clamp(0.58rem, 1.4vw, 0.75rem)" }}
          >
            Acceso exclusivo para un número limitado de personas cada semana.
          </p>
        </div>
      </div>

      {/* ── Right column — image fills and bleeds to right edge ── */}
      <div
        className="relative self-stretch"
        style={{
          animation: "springInRight 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          animationDelay: "0.08s",
        }}
      >
        {imgError ? (
          <BottleIllustration />
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

        {/* Ambient glow */}
        <div className="absolute bottom-0 right-0 w-56 h-56 md:w-80 md:h-80 bg-[#7A2030]/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-[#7A2030]/08 rounded-full blur-2xl pointer-events-none" />
      </div>
    </section>
  );
}

/* SVG bottle illustration matching the dark moody reference style */
function BottleIllustration() {
  return (
    <div className="absolute inset-0 flex items-end justify-end">
      <svg
        viewBox="0 0 280 520"
        className="h-[85%] w-auto mr-0 drop-shadow-2xl"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bottleBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#1a0a0c" />
            <stop offset="30%"  stopColor="#2d0f14" />
            <stop offset="60%"  stopColor="#3a1019" />
            <stop offset="80%"  stopColor="#250c10" />
            <stop offset="100%" stopColor="#150608" />
          </linearGradient>
          <linearGradient id="juice" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#5c0f1a" stopOpacity="0.9" />
            <stop offset="40%"  stopColor="#8b1425" stopOpacity="0.95" />
            <stop offset="70%"  stopColor="#7a2030" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#4a0c14" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="highlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="white" stopOpacity="0" />
            <stop offset="15%"  stopColor="white" stopOpacity="0.06" />
            <stop offset="25%"  stopColor="white" stopOpacity="0.13" />
            <stop offset="35%"  stopColor="white" stopOpacity="0.04" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="capGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#111" />
          </linearGradient>
          <radialGradient id="stoneGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#3a1019" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0d0d0d" stopOpacity="0" />
          </radialGradient>
          <clipPath id="bottleClip">
            <path d="M95 110 Q88 130 85 155 L80 420 Q80 445 105 445 L175 445 Q200 445 200 420 L195 155 Q192 130 185 110 Z" />
          </clipPath>
          {/* Leaf shapes */}
          <filter id="leafBlur">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* Stone / surface suggestion */}
        <ellipse cx="140" cy="475" rx="120" ry="22" fill="url(#stoneGlow)" />
        <ellipse cx="140" cy="472" rx="90" ry="14" fill="#1a0a0a" opacity="0.5" />

        {/* Background leaves — behind bottle */}
        <g opacity="0.75">
          {/* Large leaf top right */}
          <ellipse cx="220" cy="80"  rx="38" ry="16" fill="#2d4a1e" transform="rotate(-35,220,80)" />
          <ellipse cx="240" cy="50"  rx="32" ry="13" fill="#3a5c26" transform="rotate(-40,240,50)" />
          <ellipse cx="200" cy="120" rx="28" ry="11" fill="#253d18" transform="rotate(-30,200,120)" />
          <line x1="220" y1="80"  x2="225" y2="20"  stroke="#1e3010" strokeWidth="2" opacity="0.8" />
          <line x1="240" y1="50"  x2="248" y2="5"   stroke="#1e3010" strokeWidth="1.5" opacity="0.8" />
          <line x1="200" y1="120" x2="195" y2="60"  stroke="#1e3010" strokeWidth="1.5" opacity="0.8" />
          {/* Vein lines on leaves */}
          <line x1="195" y1="76"  x2="245" y2="84"  stroke="#1e3010" strokeWidth="0.8" opacity="0.6" />
          <line x1="215" y1="46"  x2="265" y2="54"  stroke="#1e3010" strokeWidth="0.8" opacity="0.6" />
        </g>

        {/* ── Bottle cap ── */}
        <rect x="112" y="72" width="56" height="10" rx="3" fill="url(#capGrad)" />
        <rect x="108" y="80" width="64" height="32" rx="4" fill="url(#capGrad)" />
        <rect x="110" y="82" width="60" height="4" rx="2" fill="#3a3a3a" opacity="0.4" />

        {/* ── Bottle neck ── */}
        <path d="M115 112 Q112 130 110 155 L108 158 Q106 160 108 160 L172 160 Q174 160 172 158 L170 155 Q168 130 165 112 Z"
          fill="url(#bottleBody)" />

        {/* ── Bottle body ── */}
        <path d="M85 158 L80 420 Q80 448 105 448 L175 448 Q200 448 200 420 L195 158 Z"
          fill="url(#bottleBody)" />

        {/* Juice fill — shows through glass */}
        <g clipPath="url(#bottleClip)">
          <rect x="80" y="200" width="120" height="248" fill="url(#juice)" opacity="0.88" />
          {/* Liquid surface shimmer */}
          <ellipse cx="140" cy="202" rx="55" ry="5" fill="#9b2030" opacity="0.6" />
          <ellipse cx="140" cy="202" rx="40" ry="3" fill="#c04060" opacity="0.3" />
        </g>

        {/* Glass highlight overlay */}
        <path d="M85 158 L80 420 Q80 448 105 448 L175 448 Q200 448 200 420 L195 158 Z"
          fill="url(#highlight)" />

        {/* ── Label ── */}
        <rect x="90" y="260" width="100" height="110" rx="6" fill="#0d0d0d" opacity="0.92" />
        <rect x="91" y="261" width="98" height="108" rx="5.5" fill="none" stroke="#2a2a2a" strokeWidth="0.8" />

        {/* Label content */}
        <text x="140" y="283" textAnchor="middle" fill="#F5F0E8" fontFamily="Georgia, serif" fontSize="10" fontWeight="600" letterSpacing="4">LUMO</text>
        <rect x="110" y="288" width="60" height="0.8" fill="#7A2030" opacity="0.7" />
        <text x="140" y="306" textAnchor="middle" fill="#F5F0E8" fontFamily="Georgia, serif" fontSize="9" fontWeight="700" letterSpacing="2">ROJO</text>
        <text x="140" y="319" textAnchor="middle" fill="#F5F0E8" fontFamily="Georgia, serif" fontSize="9" fontWeight="700" letterSpacing="2">VITAL</text>
        <rect x="110" y="324" width="60" height="0.6" fill="#3a3a3a" opacity="0.8" />
        <text x="140" y="337" textAnchor="middle" fill="#8A8A8A" fontFamily="Arial, sans-serif" fontSize="5.5" letterSpacing="0.5">Prensados en frío.</text>
        <text x="140" y="347" textAnchor="middle" fill="#8A8A8A" fontFamily="Arial, sans-serif" fontSize="5.5" letterSpacing="0.5">Hechos cada mañana.</text>
        <text x="140" y="360" textAnchor="middle" fill="#555" fontFamily="Arial, sans-serif" fontSize="5" letterSpacing="0.5">250 ml</text>

        {/* Bottom base curve */}
        <ellipse cx="140" cy="447" rx="60" ry="7" fill="#0a0305" opacity="0.8" />

        {/* Front leaves — in front of bottle */}
        <g opacity="0.6">
          <ellipse cx="68" cy="340" rx="30" ry="12" fill="#2d4a1e" transform="rotate(20,68,340)" />
          <line x1="68" y1="340" x2="55" y2="390" stroke="#1e3010" strokeWidth="1.5" opacity="0.9" />
        </g>

        {/* Bottle reflection on surface */}
        <ellipse cx="140" cy="450" rx="45" ry="6" fill="#300a10" opacity="0.35" />
      </svg>
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
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 flex-shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
