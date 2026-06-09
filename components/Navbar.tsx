"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link
          href="/"
          className="font-cormorant text-xl tracking-[0.35em] font-semibold text-[#F5F0E8]"
          aria-label="LUMO inicio"
        >
          L U M O
        </Link>

        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col gap-[5px] p-2 group"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <span className="block w-6 h-[1.5px] bg-[#F5F0E8] transition-all group-hover:w-8" />
          <span className="block w-6 h-[1.5px] bg-[#F5F0E8] transition-all group-hover:w-8" />
        </button>
      </nav>

      <div className="mx-6 md:mx-12 h-px bg-[#F5F0E8]/15" />

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0D0D0D] flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal"
        >
          <div className="flex items-center justify-between px-6 py-5 md:px-12">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="font-cormorant text-xl tracking-[0.35em] font-semibold text-[#F5F0E8]"
            >
              L U M O
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 text-[#F5F0E8] hover:opacity-70 transition-opacity"
              aria-label="Cerrar menú"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col items-center justify-center flex-1 gap-10">
            {[
              { href: "/formulas", label: "Fórmulas" },
              { href: "/proceso", label: "Proceso" },
              { href: "/piloto", label: "Únete al piloto" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="font-cormorant text-4xl font-light text-[#F5F0E8] hover:text-[#8A8A8A] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="px-6 py-8 text-center">
            <p className="text-[#8A8A8A] text-sm font-inter">
              Jugos prensados en frío. Cada mañana.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
