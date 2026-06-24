"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const isDark = theme === "dark";

  function openMenu() {
    setMenuOpen(true);
    setClosing(false);
  }

  function closeMenu() {
    setClosing(true);
  }

  function handleAnimationEnd() {
    if (closing) {
      setMenuOpen(false);
      setClosing(false);
    }
  }

  const navLinks = [
    { href: "/formulas", label: "Fórmulas", num: "01" },
    { href: "/proceso",  label: "Proceso",  num: "02" },
    { href: "/piloto",   label: "Únete al piloto", num: "03" },
  ];

  return (
    <>
      <style>{`
        @keyframes menuOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes menuOverlayOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes menuLinkIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes menuAccentLine {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
      `}</style>

      <nav
        className="fixed top-0 left-0 right-0 md:top-4 md:left-5 md:right-5 z-40 flex items-center justify-between px-6 py-[18px] md:px-7 md:py-4 md:rounded-2xl"
        style={{
          animation: "navbarDrop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          background: isDark ? "rgba(255,255,255,0.06)" : "rgba(244,239,231,0.85)",
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <Link
          href="/"
          className="font-cormorant text-lg md:text-xl tracking-[0.35em] font-semibold spring-press"
          style={{ color: isDark ? "#F5F0E8" : "#1A1A1A" }}
          aria-label="LUMO inicio"
        >
          L U M O
        </Link>

        <button
          onClick={openMenu}
          className="flex flex-col gap-[5px] p-2 spring-press rounded-lg"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          <span className="block w-5 h-[1.5px]" style={{ backgroundColor: isDark ? "#F5F0E8" : "#1A1A1A" }} />
          <span className="block w-5 h-[1.5px]" style={{ backgroundColor: isDark ? "#F5F0E8" : "#1A1A1A" }} />
        </button>
      </nav>

      <div className="h-[68px] md:h-[88px]" />

      {menuOpen && (
        <div
          className="fixed z-50 flex flex-col"
          style={{
            inset: 0,
            background: "#F4EFE7",
            animation: `${closing ? "menuOverlayOut" : "menuOverlayIn"} ${closing ? "0.35s" : "0.3s"} ease both`,
          }}
          onAnimationEnd={handleAnimationEnd}
          role="dialog"
          aria-modal="true"
        >
          {/* Accent line */}
          <div style={{
            position: "absolute",
            left: 28,
            top: 100,
            bottom: 100,
            width: 1.5,
            background: "linear-gradient(180deg, transparent, #4A5E3A 30%, #4A5E3A 70%, transparent)",
            opacity: 0.18,
            transformOrigin: "top",
            animation: "menuAccentLine 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both",
          }} />

          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-5 md:px-12">
            <Link
              href="/"
              onClick={closeMenu}
              className="font-cormorant text-xl tracking-[0.35em] font-semibold spring-press"
              style={{ color: "#1A1A1A" }}
            >
              L U M O
            </Link>
            <button
              onClick={closeMenu}
              className="p-2 spring-press rounded-full"
              style={{ color: "#1A1A1A" }}
              aria-label="Cerrar menú"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Nav links — left aligned, editorial */}
          <nav className="flex flex-col justify-center flex-1 px-12 md:px-20 gap-1">
            {navLinks.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className="group flex items-baseline gap-4 py-3 spring-press"
                style={{
                  animation: `menuLinkIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                  animationDelay: `${0.08 + i * 0.07}s`,
                  textDecoration: "none",
                }}
              >
                <span
                  className="font-inter"
                  style={{ fontSize: 12, color: "#C8C2B8", fontWeight: 400, minWidth: 20 }}
                >
                  {item.num}
                </span>
                <span
                  className="font-cormorant"
                  style={{ fontSize: 36, fontWeight: 300, color: "#1A1A1A", lineHeight: 1.15, letterSpacing: "-0.01em" }}
                >
                  {item.label}
                </span>
              </Link>
            ))}

            {/* Divider */}
            <div style={{
              height: 1,
              background: "linear-gradient(90deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.06) 60%, transparent)",
              margin: "16px 0 16px 36px",
              animation: "menuLinkIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              animationDelay: "0.32s",
            }} />

            {/* Mi LUMO — profile section */}
            <Link
              href="/mi-lumo"
              onClick={closeMenu}
              className="flex items-center gap-4 py-3 spring-press"
              style={{
                animation: "menuLinkIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
                animationDelay: "0.36s",
                textDecoration: "none",
                marginLeft: 36,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "rgba(74,94,58,0.08)",
                border: "1px solid rgba(74,94,58,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <span className="font-cormorant" style={{ fontSize: 20, fontWeight: 300, color: "#1A1A1A", display: "block", lineHeight: 1.2 }}>
                  Mi LUMO
                </span>
                <span className="font-inter" style={{ fontSize: 11, color: "#9A9490", display: "block", marginTop: 1 }}>
                  Tu perfil y pedidos
                </span>
              </div>
            </Link>
          </nav>

          {/* Footer tagline */}
          <div
            className="px-12 py-8"
            style={{
              animation: "menuLinkIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              animationDelay: "0.42s",
            }}
          >
            <p className="font-inter" style={{ fontSize: 12, color: "#B8B0A4", letterSpacing: "0.04em" }}>
              Prensado en frío · Cada mañana
            </p>
          </div>
        </div>
      )}
    </>
  );
}
