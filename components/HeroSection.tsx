"use client";

import Image from "next/image";
import { useState } from "react";

export default function HeroSection() {
  const [imgError, setImgError] = useState(false);

  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      style={{ minHeight: "calc(100svh - 68px)" }}
    >
      {/* ── Bottle — right edge, full bleed ── */}
      <div
        className="absolute right-0 pointer-events-none"
        style={{
          top: "-10%",
          bottom: "10%",
          width: "65%",
          animation: "springInRight 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both",
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
            className="object-contain"
            style={{ objectPosition: "right center", filter: "brightness(1.08) contrast(1.04)" }}
            sizes="65vw"
          />
        )}
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#7A2030]/12 rounded-full blur-3xl" />
      </div>

      {/* Gradient — left text stays fully readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to right, #0D0D0D 38%, rgba(13,13,13,0.75) 60%, rgba(13,13,13,0.1) 100%)",
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative z-10 flex flex-col justify-between px-6 py-8 gap-10"
        style={{ minHeight: "calc(100svh - 68px)" }}
      >
        {/* Top: heading + divider + body */}
        <div className="flex flex-col gap-5">
          <h1
            className="font-cormorant font-light text-[#F5F0E8] spring-in"
            style={{
              fontSize: "clamp(3rem, 11.5vw, 5.5rem)",
              lineHeight: 1.08,
              animationDelay: "0.06s",
              maxWidth: "58%",
            }}
          >
            Prensados en<br />frío.<br /><br />Hechos cada<br />mañana.
          </h1>

          <div
            className="flex items-center gap-3 spring-in"
            style={{ animationDelay: "0.14s" }}
          >
            <div className="h-px w-10 bg-[#F5F0E8]/25" />
            <LeafIcon />
          </div>

          <p
            className="font-inter text-[#8A8A8A] leading-relaxed spring-in"
            style={{
              fontSize: "clamp(0.9rem, 3.5vw, 1.1rem)",
              maxWidth: "60%",
              animationDelay: "0.22s",
            }}
          >
            Jugos naturales preparados en lotes limitados y entregados cada mañana.
          </p>
        </div>

        {/* Bottom: buttons + lock */}
        <div
          className="flex flex-col gap-4 spring-in"
          style={{ animationDelay: "0.30s" }}
        >
          <div className="flex flex-col gap-3">
            <a
              href="/piloto"
              className="inline-flex items-center justify-between bg-[#F5F0E8] text-[#0D0D0D] font-inter font-medium rounded-full spring-press"
              style={{
                fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)",
                padding: "0.9rem 1.5rem",
              }}
            >
              Unirme al piloto <span aria-hidden="true">→</span>
            </a>
            <a
              href="/formulas"
              className="inline-flex items-center justify-between font-inter font-medium rounded-full spring-press text-[#F5F0E8]"
              style={{
                fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)",
                padding: "0.9rem 1.5rem",
                border: "1.5px solid #4A5E3A",
              }}
            >
              Ver fórmulas <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="flex items-start gap-2">
            <LockIcon />
            <p
              className="font-inter leading-snug"
              style={{
                fontSize: "clamp(0.7rem, 2.8vw, 0.85rem)",
                color: "#4A5E3A",
              }}
            >
              Acceso exclusivo para un número limitado de personas cada semana.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── SVG bottle illustration ── */
function BottleIllustration() {
  return (
    <div className="absolute inset-0 flex items-center justify-end" style={{ paddingBottom: "10%" }}>
      <svg
        viewBox="0 0 260 500"
        className="h-[88%] w-auto"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#1a0a0c" />
            <stop offset="35%"  stopColor="#2d0f14" />
            <stop offset="65%"  stopColor="#3a1019" />
            <stop offset="100%" stopColor="#150608" />
          </linearGradient>
          <linearGradient id="bJuice" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#5c0f1a" stopOpacity="0.9" />
            <stop offset="50%"  stopColor="#8b1425" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#4a0c14" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="bHL" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="white" stopOpacity="0" />
            <stop offset="20%"  stopColor="white" stopOpacity="0.12" />
            <stop offset="30%"  stopColor="white" stopOpacity="0.04" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bCap" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#111" />
          </linearGradient>
          <radialGradient id="bGlow" cx="50%" cy="80%" r="60%">
            <stop offset="0%"   stopColor="#3a1019" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0d0d0d" stopOpacity="0" />
          </radialGradient>
          <clipPath id="bClip">
            <path d="M88 108 Q82 128 79 150 L74 408 Q74 432 98 432 L162 432 Q186 432 186 408 L181 150 Q178 128 172 108 Z" />
          </clipPath>
        </defs>

        <ellipse cx="130" cy="400" rx="110" ry="80" fill="url(#bGlow)" />

        <g opacity="0.8">
          <ellipse cx="195" cy="65"  rx="36" ry="14" fill="#2d4a1e" transform="rotate(-38,195,65)" />
          <ellipse cx="215" cy="38"  rx="30" ry="12" fill="#3a5c26" transform="rotate(-42,215,38)" />
          <ellipse cx="178" cy="108" rx="26" ry="10" fill="#253d18" transform="rotate(-30,178,108)" />
          <line x1="195" y1="65"  x2="200" y2="10"  stroke="#1e3010" strokeWidth="2" />
          <line x1="215" y1="38"  x2="222" y2="-5"  stroke="#1e3010" strokeWidth="1.5" />
          <line x1="178" y1="108" x2="172" y2="50"  stroke="#1e3010" strokeWidth="1.5" />
        </g>

        <rect x="104" y="68" width="52" height="10" rx="3" fill="url(#bCap)" />
        <rect x="100" y="76" width="60" height="34" rx="4" fill="url(#bCap)" />
        <path d="M108 108 Q106 128 104 150 L102 154 L158 154 L156 150 Q154 128 152 108 Z" fill="url(#bBody)" />
        <path d="M74 152 L74 408 Q74 432 98 432 L162 432 Q186 432 186 408 L186 152 Z" fill="url(#bBody)" />

        <g clipPath="url(#bClip)">
          <rect x="74" y="192" width="112" height="240" fill="url(#bJuice)" />
          <ellipse cx="130" cy="194" rx="52" ry="5" fill="#9b2030" opacity="0.6" />
        </g>

        <path d="M74 152 L74 408 Q74 432 98 432 L162 432 Q186 432 186 408 L186 152 Z" fill="url(#bHL)" />

        <rect x="83" y="254" width="94" height="106" rx="5" fill="#0d0d0d" opacity="0.93" />
        <rect x="84" y="255" width="92" height="104" rx="4.5" fill="none" stroke="#222" strokeWidth="0.8" />
        <text x="130" y="275" textAnchor="middle" fill="#F5F0E8" fontFamily="Georgia,serif" fontSize="9.5" fontWeight="600" letterSpacing="4">LUMO</text>
        <rect x="103" y="280" width="54" height="0.8" fill="#7A2030" opacity="0.7" />
        <text x="130" y="297" textAnchor="middle" fill="#F5F0E8" fontFamily="Georgia,serif" fontSize="8.5" fontWeight="700" letterSpacing="2">ROJO</text>
        <text x="130" y="309" textAnchor="middle" fill="#F5F0E8" fontFamily="Georgia,serif" fontSize="8.5" fontWeight="700" letterSpacing="2">VITAL</text>
        <rect x="103" y="314" width="54" height="0.6" fill="#333" />
        <text x="130" y="326" textAnchor="middle" fill="#777" fontFamily="Arial,sans-serif" fontSize="5.2">Prensados en frío.</text>
        <text x="130" y="336" textAnchor="middle" fill="#777" fontFamily="Arial,sans-serif" fontSize="5.2">Hechos cada mañana.</text>
        <text x="130" y="350" textAnchor="middle" fill="#444" fontFamily="Arial,sans-serif" fontSize="4.8">250 ml</text>

        <ellipse cx="130" cy="431" rx="56" ry="6" fill="#0a0305" opacity="0.7" />
        <ellipse cx="130" cy="433" rx="42" ry="8" fill="#150608" opacity="0.4" />

        <ellipse cx="62" cy="330" rx="28" ry="10" fill="#2d4a1e" transform="rotate(22,62,330)" opacity="0.55" />
        <line x1="62" y1="330" x2="48" y2="378" stroke="#1e3010" strokeWidth="1.5" opacity="0.7" />
      </svg>
    </div>
  );
}

function LeafIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-0.5 flex-shrink-0">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
