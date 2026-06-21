import { supabaseAdmin } from "@/lib/supabase";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

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
  numero_pedido?: number | null;
  estado: string;
  cantidad: number;
  dia_entrega: string;
  created_at?: string | null;
  hora_preparado?: string | null;
  hora_entrega_estimada?: string | null;
  ingredientes_excluidos?: string[] | null;
  notas?: string | null;
  clientes: { nombre: string; telefono: string };
  formulas: { nombre: string; slug: string; color_acento: string };
}

/* ---------- estado badge ---------- */

function EstadoBadge({ estado }: { estado: string }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    pendiente:  { label: "Recibido", bg: "rgba(138,133,128,0.12)", color: "#8A8580" },
    confirmado: { label: "Confirmado", bg: "rgba(74,94,58,0.12)", color: "#4A5E3A" },
    preparado:  { label: "Listo para ti", bg: "rgba(74,94,58,0.18)", color: "#4A5E3A" },
    entregado:  { label: "Entregado", bg: "rgba(74,94,58,0.10)", color: "#6A6A6A" },
  };
  const c = config[estado] ?? config.pendiente;

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
        <path d="M5 13l4 4L19 7" />
      </svg>
      <span className="font-inter" style={{ fontSize: 13, fontWeight: 600, color: c.color, letterSpacing: "0.02em" }}>
        {c.label}
      </span>
    </div>
  );
}

/* ---------- timeline ---------- */

function formatCreatedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  });
}

function Timeline({ estado, hora_preparado, hora_entrega_estimada, created_at, accentColor }: {
  estado: string;
  hora_preparado?: string | null;
  hora_entrega_estimada?: string | null;
  created_at?: string | null;
  accentColor: string;
}) {
  const createdSub = created_at
    ? `Recibido el ${formatCreatedDate(created_at)}`
    : "Estamos organizando tu entrega";
  const steps = [
    { key: "pendiente",  label: "Pedido recibido", sub: createdSub },
    { key: "confirmado", label: "Confirmado", sub: "Tu pedido ha sido confirmado" },
    { key: "preparado",  label: "Envasado", sub: null },
    { key: "entregado",  label: "Entregado", sub: null },
  ];

  const stateOrder = ["pendiente", "confirmado", "preparado", "entregado"];
  const activeIndex = stateOrder.indexOf(estado);

  const baseDelay = 0.8;

  return (
    <div style={{ padding: "20px 0 8px" }}>
      {steps.map((step, i) => {
        const isActive = i <= activeIndex;
        const isCurrent = i === activeIndex;
        const isLast = i === steps.length - 1;
        const showTimestamp = step.key === "preparado" && isActive && hora_preparado;
        const showDeliveryRange = step.key === "entregado" && !isActive && estado === "preparado" && hora_entrega_estimada;
        const showDeliveredSub = step.key === "entregado" && isActive;
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
                    minHeight: 32,
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
                paddingBottom: isLast ? 0 : 20,
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

              {showDeliveryRange && (
                <div
                  className="font-inter"
                  style={{ fontSize: 13, color: "#9A9A9A", marginTop: 2, display: "flex", alignItems: "center", gap: 5 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9A9A9A" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Estimado: {hora_entrega_estimada}
                </div>
              )}

              {showDeliveredSub && (
                <div className="font-inter" style={{ fontSize: 13, color: "#9A9A9A", marginTop: 2 }}>
                  Que lo disfrutes
                </div>
              )}

              {!showTimestamp && !showDeliveryRange && !showDeliveredSub && step.sub && isActive && (
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
      "*, created_at, numero_pedido, clientes(nombre, telefono), formulas(nombre, slug, color_acento)"
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
  const lumoWhatsApp = "5215542779362";
  const orderLabel = p.numero_pedido ? `#${p.numero_pedido}` : p.token.slice(0, 8).toUpperCase();

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
            {formula?.nombre ?? "Formula"}
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
            flexWrap: "wrap",
          }}
        >
          <span>{p.cantidad ?? 1} botella{(p.cantidad ?? 1) !== 1 ? "s" : ""}</span>
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
        <Timeline
          estado={p.estado}
          hora_preparado={p.hora_preparado}
          hora_entrega_estimada={p.hora_entrega_estimada}
          created_at={p.created_at}
          accentColor={accentColor}
        />

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

      {/* Freshness note */}
      <div
        className="font-inter"
        style={{
          maxWidth: 380,
          textAlign: "center",
          marginTop: 24,
          padding: "14px 20px",
          borderRadius: 16,
          background: "rgba(74,94,58,0.06)",
          border: "1px solid rgba(74,94,58,0.10)",
          animation: "pedidoFadeUp 0.6s ease 1.5s both",
        }}
      >
        <p style={{ fontSize: 13, color: "#6A6A5A", lineHeight: 1.5 }}>
          Para conservar su frescura y nutrientes, te recomendamos consumirlo dentro de las primeras 4 horas.
        </p>
      </div>

      {/* Feedback button (only when entregado) */}
      {p.estado === "entregado" && (
        <a
          href={`/feedback?pedido=${p.token}`}
          className="font-inter"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: 20,
            padding: "12px 24px",
            borderRadius: 100,
            background: "#0D0D0D",
            color: "#F4EFE7",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            animation: "pedidoFadeUp 0.6s ease 1.55s both",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Compartir mi experiencia
        </a>
      )}

      {/* WhatsApp contact button */}
      <a
        href={`https://wa.me/${lumoWhatsApp}?text=${encodeURIComponent(`Hola LUMO, tengo una consulta sobre mi pedido ${orderLabel}.`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-inter"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginTop: p.estado === "entregado" ? 10 : 20,
          padding: "10px 20px",
          borderRadius: 100,
          background: "rgba(37,211,102,0.08)",
          border: "1px solid rgba(37,211,102,0.18)",
          color: "#25D366",
          fontSize: 13,
          fontWeight: 500,
          textDecoration: "none",
          animation: "pedidoFadeUp 0.6s ease 1.6s both",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Contactar a LUMO
      </a>

      {/* Subtle order number */}
      <p
        className="font-inter"
        style={{
          color: "#C8C0B4",
          fontSize: 11,
          marginTop: 24,
          letterSpacing: "0.04em",
          animation: "footerIn 0.8s ease 1.7s both",
          userSelect: "all",
        }}
      >
        Pedido {orderLabel}
      </p>

      {/* Footer */}
      <p
        className="font-inter"
        style={{
          color: "#B8B0A4",
          fontSize: 12,
          marginTop: 8,
          letterSpacing: "0.06em",
          animation: "footerIn 0.8s ease 1.8s both",
        }}
      >
        Hecho con intencion · LUMO
      </p>
    </main>
  );
}
