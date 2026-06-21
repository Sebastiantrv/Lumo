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

/* ---------- timeline ---------- */

function Timeline({ estado, hora_preparado }: { estado: string; hora_preparado?: string | null }) {
  const steps = [
    { key: "confirmado", label: "Pedido confirmado" },
    { key: "preparado", label: "Envasado" },
    { key: "entregado", label: "Entregado" },
  ];

  const activeIndex =
    estado === "entregado" ? 2 : estado === "preparado" ? 1 : 0;

  return (
    <div style={{ padding: "24px 0" }}>
      {steps.map((step, i) => {
        const isActive = i <= activeIndex;
        const isLast = i === steps.length - 1;
        const showTimestamp = step.key === "preparado" && isActive && hora_preparado;

        return (
          <div key={step.key} style={{ display: "flex", gap: 14 }}>
            {/* Column: circle + line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: isActive ? "none" : "2px solid #C4C4C4",
                  background: isActive ? "#4A5E3A" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {!isLast && (
                <div
                  style={{
                    width: 2,
                    flexGrow: 1,
                    minHeight: 32,
                    background: i < activeIndex ? "#4A5E3A" : "transparent",
                    borderLeft: i < activeIndex ? "none" : "2px dashed #C4C4C4",
                  }}
                />
              )}
            </div>

            {/* Column: text */}
            <div style={{ paddingBottom: isLast ? 0 : 20 }}>
              <span
                className="font-inter"
                style={{
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#1A1A1A" : "#6A6A6A",
                }}
              >
                {step.label}
              </span>
              {showTimestamp && (
                <div
                  className="font-inter"
                  style={{ fontSize: 13, color: "#6A6A6A", marginTop: 2 }}
                >
                  Hoy a las {formatHora(hora_preparado as string)}
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
        <div style={{ textAlign: "center", padding: 32 }}>
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
        padding: "48px 20px 32px",
      }}
    >
      {/* Logo */}
      <div
        className="font-cormorant"
        style={{
          fontSize: 14,
          letterSpacing: "0.45em",
          color: "#6A6A6A",
          marginBottom: 40,
        }}
      >
        L U M O
      </div>

      {/* Greeting */}
      <h1
        className="font-cormorant"
        style={{
          fontSize: 36,
          fontWeight: 400,
          color: "#1A1A1A",
          margin: 0,
          textAlign: "center",
        }}
      >
        Hola, {nombre}
      </h1>
      <p
        className="font-inter"
        style={{
          color: "#6A6A6A",
          fontSize: 15,
          marginTop: 6,
          marginBottom: 32,
        }}
      >
        Tu jugo de hoy
      </p>

      {/* Main card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.6)",
          padding: "28px 24px",
        }}
      >
        {/* Formula */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: accentColor,
              flexShrink: 0,
            }}
          />
          <span
            className="font-cormorant"
            style={{ fontSize: 24, fontWeight: 600, color: "#1A1A1A" }}
          >
            {formula?.nombre ?? "Fórmula"}
          </span>
        </div>

        {/* Quantity */}
        <p
          className="font-inter"
          style={{ color: "#6A6A6A", fontSize: 14, margin: "0 0 4px 20px" }}
        >
          × {p.cantidad ?? 1} botella{(p.cantidad ?? 1) !== 1 ? "s" : ""}
        </p>

        {/* Delivery date */}
        {p.dia_entrega && (
          <p
            className="font-inter"
            style={{ color: "#6A6A6A", fontSize: 14, margin: "0 0 0 20px" }}
          >
            {capitalize(formatDeliveryDate(p.dia_entrega))}
          </p>
        )}

        {/* Timeline */}
        <div style={{ marginTop: 20 }}>
          <Timeline estado={p.estado} hora_preparado={p.hora_preparado} />
        </div>

        {/* Exclusions */}
        {p.ingredientes_excluidos && p.ingredientes_excluidos.length > 0 && (
          <p
            className="font-inter"
            style={{
              fontSize: 13,
              color: "#6A6A6A",
              borderTop: "1px solid rgba(0,0,0,0.06)",
              paddingTop: 16,
              margin: "8px 0 0",
            }}
          >
            Personalizado sin: {p.ingredientes_excluidos.join(", ")}
          </p>
        )}

        {/* Notes */}
        {p.notas && (
          <p
            className="font-inter"
            style={{
              fontSize: 13,
              color: "#6A6A6A",
              marginTop: 8,
              fontStyle: "italic",
            }}
          >
            {p.notas}
          </p>
        )}
      </div>

      {/* Footer */}
      <p
        className="font-inter"
        style={{
          color: "#B0A898",
          fontSize: 12,
          marginTop: 48,
          letterSpacing: "0.04em",
        }}
      >
        Hecho con intención · LUMO
      </p>
    </main>
  );
}
