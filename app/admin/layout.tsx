"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";

function AdminNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();

  const links = [
    { href: "/admin", label: "Inicio", icon: HomeIcon },
    { href: "/admin/hoy", label: "Hoy", icon: SunIcon },
    { href: "/admin/semana", label: "Semana", icon: CalendarIcon },
    { href: "/admin/compras", label: "Compras", icon: CartIcon },
    { href: "/admin/recetas", label: "Recetas", icon: LeafIcon },
    { href: "/admin/clientes", label: "Miembros", icon: PeopleIcon },
    { href: "/admin/finanzas", label: "Finanzas", icon: FinanzasIcon },
    { href: "/admin/feedback", label: "Feedback", icon: FeedbackIcon },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 flex flex-col justify-between py-6 px-3 transition-transform duration-300 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          width: 220,
          background: "#111",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          WebkitOverflowScrolling: "touch",
          overflowY: "auto",
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
                  onClick={onClose}
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
            onClick={onClose}
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
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SessionProvider>
      <div style={{ background: "#0D0D0D", minHeight: "100svh" }}>
        {/* Mobile top bar */}
        <div
          className="flex items-center justify-between px-4 md:hidden"
          style={{
            height: 56,
            background: "#111",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div>
            <span
              className="font-cormorant tracking-[0.35em] font-semibold"
              style={{ fontSize: "1.1rem", color: "#F5F0E8" }}
            >
              L U M O
            </span>
            <span
              style={{ fontSize: "0.55rem", color: "#4A5E3A", letterSpacing: "0.15em", marginLeft: 8 }}
            >
              ADMIN
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
            className="p-2"
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#F5F0E8" strokeWidth="1.8" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        <AdminNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          className="md:ml-[220px] md:p-[2rem_2.5rem] p-4 pt-2 pb-20 md:pb-[2rem] md:pt-[2rem]"
          style={{ minHeight: "100svh" }}
        >
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <MobileBottomNav onOpenFull={() => setSidebarOpen(true)} />
      </div>
    </SessionProvider>
  );
}

/* ── Mobile bottom nav ── */
function MobileBottomNav({ onOpenFull }: { onOpenFull: () => void }) {
  const path = usePathname();

  const tabs = [
    { href: "/admin", label: "Inicio", icon: HomeIcon },
    { href: "/admin/hoy", label: "Hoy", icon: SunIcon },
    { href: "/admin/semana", label: "Semana", icon: CalendarIcon },
    { href: "/admin/clientes", label: "Miembros", icon: PeopleIcon },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around md:hidden"
      style={{
        height: 64,
        background: "#111",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 py-1.5 px-2"
          >
            <Icon size={18} color={active ? "#4A5E3A" : "#555"} />
            <span
              className="font-inter"
              style={{ fontSize: "0.6rem", color: active ? "#F5F0E8" : "#555" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
      <button
        onClick={onOpenFull}
        className="flex flex-col items-center gap-1 py-1.5 px-2"
      >
        <MoreIcon size={18} color="#555" />
        <span className="font-inter" style={{ fontSize: "0.6rem", color: "#555" }}>
          Más
        </span>
      </button>
    </div>
  );
}

/* ── Icons ── */
function HomeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
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
function FinanzasIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function FeedbackIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
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
function MoreIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <circle cx="5" cy="12" r="1.5" fill={color} />
      <circle cx="19" cy="12" r="1.5" fill={color} />
    </svg>
  );
}
