"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";

function AdminNav() {
  const path = usePathname();

  const links = [
    { href: "/admin", label: "Hoy", icon: SunIcon },
    { href: "/admin/semana", label: "Semana", icon: CalendarIcon },
    { href: "/admin/compras", label: "Compras", icon: CartIcon },
    { href: "/admin/recetas", label: "Recetas", icon: LeafIcon },
    { href: "/admin/clientes", label: "Clientes", icon: PeopleIcon },
  ];

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between py-6 px-3"
      style={{
        width: 220,
        background: "#111",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div>
        <div className="px-3 mb-8">
          <span
            className="font-cormorant tracking-[0.35em] font-semibold"
            style={{ fontSize: "1.3rem", color: "#F5F0E8" }}
          >
            L U M O
          </span>
          <p style={{ fontSize: "0.65rem", color: "#4A5E3A", letterSpacing: "0.15em", marginTop: 2 }}>
            ADMIN
          </p>
        </div>

        <nav className="flex flex-col gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-inter text-sm transition-all"
                style={{
                  background: active ? "rgba(74,94,58,0.18)" : "transparent",
                  color: active ? "#F5F0E8" : "#8A8A8A",
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon size={16} color={active ? "#4A5E3A" : "#555"} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-3">
        <div
          className="h-px mb-4"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-inter text-sm mb-1 transition-colors"
          style={{ color: "#555" }}
        >
          <ExternalIcon size={15} color="#555" />
          Ver sitio público
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-inter text-sm w-full text-left transition-colors"
          style={{ color: "#555" }}
        >
          <LogoutIcon size={15} color="#555" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div style={{ background: "#0D0D0D", minHeight: "100svh" }}>
        <AdminNav />
        <main style={{ marginLeft: 220, padding: "2rem 2.5rem", minHeight: "100svh" }}>
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}

/* ── Icons ── */
function SunIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function CalendarIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function CartIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function LeafIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}
function PeopleIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function ExternalIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
function LogoutIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
