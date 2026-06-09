"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Floating glass navbar */}
      <nav
        className="fixed top-3 left-3 right-3 md:top-4 md:left-5 md:right-5 z-40 flex items-center justify-between px-5 py-3 md:px-7 md:py-4 rounded-2xl glass-strong"
        style={{ animation: "navbarDrop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
      >
        <Link
          href="/"
          className="font-cormorant text-lg md:text-xl tracking-[0.35em] font-semibold text-[#F5F0E8] spring-press"
          aria-label="LUMO inicio"
        >
          L U M O
        </Link>

        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col gap-[5px] p-2 spring-press rounded-lg"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <span className="block w-5 h-[1.5px] bg-[#F5F0E8]" />
          <span className="block w-5 h-[1.5px] bg-[#F5F0E8]" />
        </button>
      </nav>

      {/* Spacer so content starts below navbar */}
      <div className="h-20 md:h-24" />

      {/* Full-screen glass overlay menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{
            background: "rgba(13, 13, 13, 0.85)",
            backdropFilter: "blur(40px) saturate(180%)",
            WebkitBackdropFilter: "blur(40px) saturate(180%)",
            animation: "overlayIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          }}
          role="dialog"
          aria-modal="true"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-5 md:px-12">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="font-cormorant text-xl tracking-[0.35em] font-semibold text-[#F5F0E8] spring-press"
            >
              L U M O
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 text-[#F5F0E8] spring-press rounded-full glass"
              aria-label="Cerrar menú"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Nav links with staggered spring */}
          <nav className="flex flex-col items-center justify-center flex-1 gap-8">
            {[
              { href: "/formulas", label: "Fórmulas" },
              { href: "/proceso", label: "Proceso" },
              { href: "/piloto",   label: "Únete al piloto" },
            ].map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="font-cormorant text-5xl md:text-6xl font-light text-[#F5F0E8] spring-press"
                style={{
                  animation: `menuItemIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                  animationDelay: `${0.06 + i * 0.08}s`,
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div
            className="px-6 py-8 text-center"
            style={{ animation: "menuItemIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both", animationDelay: "0.3s" }}
          >
            <p className="text-[#8A8A8A] text-sm font-inter">
              Jugos prensados en frío. Cada mañana.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
