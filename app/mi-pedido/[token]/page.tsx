import { supabaseAdmin } from "@/lib/supabase";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tu pedido · LUMO",
};

/* ---------- helpers ---------- */

function formatDeliveryDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Mexico_City",
  });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- types ---------- */

interface Pedido {
  id: number;
  token: string;
  estado: string;
  cantidad: number;
  dia_entrega: string;
  hora_preparado?: string | null;
  ingredientes_excluidos?: string[] | null;
  notas?: string | null;
  clientes: { nombre: string; telefono: string };
  formulas: { nombre: string; slug: string; color_acento: string };
}

/* ---------- estado badge ---------- */

function EstadoBadge({ estado }: { estado: string }) {
  const config: Record<string, { label: string; bg: string; color: string; icon: string }> = {
    confirmado: { label: "Confirmado", bg: "rgba(74,94,58,0.12)", color: "#4A5E3A", icon: "M5 13l4 4L19 7" },
    preparado:  { label: "Listo para ti", bg: "rgba(74,94,58,0.18)", color: "#4A5E3A", icon: "M5 13l4 4L19 7" },
    entregado:  { label: "Entregado", bg: "rgba(74,94,58,0.10)", color: "#6A6A6A", icon: "M5 13l4 4L19 7" },
  };
  const c = config[estado] ?? config.confirmado;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 100,
        background: c.bg,
        animation: "pedidoFadeUp 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.5s both",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={c.icon} />
      </svg>
      <span className="font-inter" style={{ fontSize: 13, fontWeight: 600, color: c.color, letterSpacing: "0.02em" }}>
        {c.label}
      </span>
    </div>
  );
}

/* ---------- timeline ---------- */

function Timeline({ estado, hora_preparado, accentColor }: { estado: string; hora_preparado?: string | null; accentColor: string }) {
  const steps = [
    { key: "confirmado", label: "Pedido confirmado", sub: "Recibimos tu pedido" },
    { key: "preparado",  label: "Envasado", sub: null },
    { key: "entregado",  label: "Entregado", sub: "Disfrútalo" },
  ];

  const activeIndex =
    estado === "entregado" ? 2 : estado === "preparado" ? 1 : 0;

  const baseDelay = 0.8;

  return (
    <div style={{ padding: "20px 0 8px" }}>
      {steps.map((step, i) => {
        const isActive = i <= activeIndex;
        const isCurrent = i === activeIndex;
        const isLast = i === steps.length - 1;
        const showTimestamp = step.key === "preparado" && isActive && hora_preparado;
        const delay = baseDelay + i * 0.15;

        return (
          <div key={step.key} style={{ display: "flex", gap: 16 }}>
            {/* Circle + connector line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: isActive ? "none" : "2px solid #D4D0C8",
                  background: isActive ? accentColor : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  animation: `timelineCircleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay}s both`,
                  boxShadow: isCurrent ? `0 0 0 4px ${accentColor}22` : "none",
                }}
              >
                {isActive && (
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="20"
                      style={{ animation: `checkDraw 0.4s ease ${delay + 0.3}s both` }}
                    />
                  </svg>
                )}
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flexGrow: 1,
                    minHeight: 36,
                    background: i < activeIndex ? accentColor : "transparent",
                    borderLeft: i < activeIndex ? "none" : "2px dashed #D4D0C8",
                    transformOrigin: "top",
                    animation: i < activeIndex
                      ? `timelineLineGrow 0.4s ease ${delay + 0.2}s both`
                      : `pedidoFadeUp 0.3s ease ${delay + 0.2}s both`,
                  }}
                />
              )}
            </div>

            {/* Text content */}
            <div
              style={{
                paddingBottom: isLast ? 0 : 22,
                animation: `timelineTextIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay + 0.1}s both`,
              }}
            >
              <span
                className="font-inter"
                style={{
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#1A1A1A" : "#A0A0A0",
                  display: "block",
                }}
              >
                {step.label}
              </span>

              {showTimestamp && (
                <div
                  className="font-inter"
                  style={{ fontSize: 13, color: "#6A6A6A", marginTop: 3, display: "flex", alignItems: "center", gap: 5 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6A6A6A" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Hoy a las {formatHora(hora_preparado as string)}
                </div>
              )}

              {!showTimestamp && step.sub && isActive && (
                <div
                  className="font-inter"
                  style={{ fontSize: 13, color: "#9A9A9A", marginTop: 2 }}
                >
                  {step.sub}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- decorative leaf ---------- */

function LeafDecoration({ color }: { color: string }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      style={{
        position: "absolute",
        top: -16,
        right: -12,
        opacity: 0.08,
        animation: "pedidoFadeUp 1s ease 1.5s both",
      }}
    >
      <path
        d="M24 4C24 4 38 10 38 26C38 34 32 42 24 44C16 42 10 34 10 26C10 10 24 4 24 4Z"
        fill={color}
      />
      <path d="M24 12V36" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <path d="M24 20L18 26M24 26L30 32" stroke={color} strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

/* ---------- page ---------- */

export default async function MiPedidoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const { data: pedido, error } = await supabaseAdmin
    .from("pedidos")
    .select(
      "*, clientes(nombre, telefono), formulas(nombre, slug, color_acento)"
    )
    .eq("token", token)
    .single();

  if (error || !pedido) {
    return (
      <main
        style={{
          background: "#F4EFE7",
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: 32, animation: "pedidoFadeUp 0.6s ease both" }}>
          <h1
            className="font-cormorant"
            style={{ fontSize: 28, color: "#1A1A1A", marginBottom: 8 }}
          >
            Pedido no encontrado
          </h1>
          <p className="font-inter" style={{ color: "#6A6A6A", fontSize: 15 }}>
            El enlace puede haber expirado o ser incorrecto.
          </p>
        </div>
      </main>
    );
  }

  const p = pedido as unknown as Pedido;
  const nombre = p.clientes?.nombre ?? "amigo";
  const formula = p.formulas;
  const accentColor = formula?.color_acento ?? "#4A5E3A";

  return (
    <main
      style={{
        background: "#F4EFE7",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 20px 40px",
      }}
    >
      {/* Logo */}
      <div
        className="font-cormorant"
        style={{
          fontSize: 14,
          letterSpacing: "0.45em",
          color: "#9A9490",
          marginBottom: 44,
          animation: "pedidoFadeUp 0.7s ease 0s both",
        }}
      >
        L U M O
      </div>

      {/* Greeting */}
      <h1
        className="font-cormorant"
        style={{
          fontSize: 38,
          fontWeight: 400,
          color: "#1A1A1A",
          margin: 0,
          textAlign: "center",
          animation: "pedidoFadeUp 0.7s ease 0.1s both",
        }}
      >
        Hola, {nombre}
      </h1>
      <p
        className="font-inter"
        style={{
          color: "#8A8580",
          fontSize: 15,
          marginTop: 8,
          marginBottom: 12,
          animation: "pedidoFadeUp 0.7s ease 0.2s both",
        }}
      >
        Tu jugo de hoy
      </p>

      {/* Estado badge */}
      <div style={{ marginBottom: 28 }}>
        <EstadoBadge estado={p.estado} />
      </div>

      {/* Main card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(20px) saturate(140%)",
          WebkitBackdropFilter: "blur(20px) saturate(140%)",
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.7)",
          padding: "32px 28px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.04), 0 1px 0 rgba(255,255,255,0.8) inset",
          position: "relative",
          overflow: "hidden",
          animation: "pedidoCardIn 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.35s both",
        }}
      >
        <LeafDecoration color={accentColor} />

        {/* Formula name with accent dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
            {/* Pulse ring */}
            <div
              style={{
                position: "absolute",
                inset: -3,
                borderRadius: "50%",
                background: accentColor,
                animation: "accentPulse 3s ease-in-out infinite",
                opacity: 0.3,
              }}
            />
            {/* Solid dot */}
            <div
              style={{
                position: "relative",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: accentColor,
                boxShadow: `0 0 8px ${accentColor}44`,
              }}
            />
          </div>
          <span
            className="font-cormorant"
            style={{ fontSize: 26, fontWeight: 600, color: "#1A1A1A" }}
          >
            {formula?.nombre ?? "Fórmula"}
          </span>
        </div>

        {/* Details row */}
        <div
          className="font-inter"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#7A7570",
            fontSize: 14,
            margin: "0 0 0 24px",
          }}
        >
          <span>× {p.cantidad ?? 1} botella{(p.cantidad ?? 1) !== 1 ? "s" : ""}</span>
          {p.dia_entrega && (
            <>
              <span style={{ color: "#D4D0C8" }}>·</span>
              <span>{capitalize(formatDeliveryDate(p.dia_entrega))}</span>
            </>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.06) 80%, transparent)",
            margin: "20px 0 4px",
          }}
        />

        {/* Timeline */}
        <Timeline estado={p.estado} hora_preparado={p.hora_preparado} accentColor={accentColor} />

        {/* Exclusions & notes */}
        {(p.ingredientes_excluidos?.length || p.notas) && (
          <div
            style={{
              borderTop: "1px solid rgba(0,0,0,0.05)",
              paddingTop: 16,
              marginTop: 8,
              animation: "pedidoFadeUp 0.5s ease 1.4s both",
            }}
          >
            {p.ingredientes_excluidos && p.ingredientes_excluidos.length > 0 && (
              <div
                className="font-inter"
                style={{
                  fontSize: 13,
                  color: "#8A8580",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A8580" strokeWidth="2" strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                <span>Sin: {p.ingredientes_excluidos.join(", ")}</span>
              </div>
            )}
            {p.notas && (
              <p
                className="font-inter"
                style={{
                  fontSize: 13,
                  color: "#8A8580",
                  marginTop: p.ingredientes_excluidos?.length ? 8 : 0,
                  fontStyle: "italic",
                }}
              >
                &ldquo;{p.notas}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <p
        className="font-inter"
        style={{
          color: "#B8B0A4",
          fontSize: 12,
          marginTop: 48,
          letterSpacing: "0.06em",
          animation: "footerIn 0.8s ease 1.6s both",
        }}
      >
        Hecho con intención · LUMO
      </p>
    </main>
  );
}
