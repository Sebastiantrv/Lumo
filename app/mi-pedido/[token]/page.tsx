"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { LUMO_WHATSAPP, POLL_INTERVAL_MS } from "@/lib/constants";
import { formatDateLabel, formatHora, formatCreatedDate, capitalize, isCutoffPassed } from "@/lib/dates";

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

/* ---------- timeline ---------- */

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

  return (
    <div style={{ padding: "20px 0 8px" }}>
      {steps.map((step, i) => {
        const isActive = i <= activeIndex;
        const isCurrent = i === activeIndex;
        const isLast = i === steps.length - 1;
        const showTimestamp = step.key === "preparado" && isActive && hora_preparado;
        const showDeliveryRange = step.key === "entregado" && !isActive && estado === "preparado" && hora_entrega_estimada;
        const showDeliveredSub = step.key === "entregado" && isActive;

        return (
          <div key={step.key} style={{ display: "flex", gap: 16 }}>
            {/* Circle + connector line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 20 }}>
              <div
                style={{
                  position: "relative",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  border: isActive ? "none" : "1.5px solid #D4D0C8",
                  background: isActive ? accentColor : "transparent",
                  flexShrink: 0,
                  transition: "all 0.5s ease",
                }}
              >
                {isCurrent && (
                  <div style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: "50%",
                    background: accentColor,
                    opacity: 0.25,
                    animation: "accentPulse 2.5s ease-in-out infinite",
                  }} />
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
                    transition: "all 0.5s ease",
                  }}
                />
              )}
            </div>

            {/* Text content */}
            <div style={{ paddingBottom: isLast ? 0 : 20 }}>
              <span
                className="font-inter"
                style={{
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#1A1A1A" : "#A0A0A0",
                  display: "block",
                  transition: "all 0.5s ease",
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

/* ---------- Ficha LUMO data ---------- */

const FICHA_DATA: Record<string, {
  ingredientes: string;
  nutricion: { label: string; value: string }[];
  micronutrientes: string[];
}> = {
  "verde": {
    ingredientes: "Pepino, piña, manzana verde, apio, espinaca, jengibre y limón.",
    nutricion: [
      { label: "Energía", value: "XX kcal" },
      { label: "Carbohidratos", value: "XX g" },
      { label: "Azúcares naturales", value: "XX g" },
      { label: "Proteína", value: "XX g" },
      { label: "Grasas", value: "XX g" },
      { label: "Fibra estimada", value: "XX g" },
    ],
    micronutrientes: ["Vitamina C", "Potasio", "Folato", "Antioxidantes"],
  },
  "rojo": {
    ingredientes: "Betabel, zanahoria, manzana roja, pepino, limón y jengibre.",
    nutricion: [
      { label: "Energía", value: "XX kcal" },
      { label: "Carbohidratos", value: "XX g" },
      { label: "Azúcares naturales", value: "XX g" },
      { label: "Proteína", value: "XX g" },
      { label: "Grasas", value: "XX g" },
      { label: "Fibra estimada", value: "XX g" },
    ],
    micronutrientes: ["Vitamina A", "Hierro", "Potasio", "Antioxidantes"],
  },
  "tropical": {
    ingredientes: "Piña, pepino, manzana verde, limón y jengibre.",
    nutricion: [
      { label: "Energía", value: "XX kcal" },
      { label: "Carbohidratos", value: "XX g" },
      { label: "Azúcares naturales", value: "XX g" },
      { label: "Proteína", value: "XX g" },
      { label: "Grasas", value: "XX g" },
      { label: "Fibra estimada", value: "XX g" },
    ],
    micronutrientes: ["Vitamina C", "Bromelina", "Potasio", "Antioxidantes"],
  },
};

function getFichaKey(slug: string): string | null {
  if (slug.includes("verde")) return "verde";
  if (slug.includes("rojo")) return "rojo";
  if (slug.includes("tropical")) return "tropical";
  return null;
}

const INGREDIENT_IMAGES: Record<string, string> = {
  verde: "/icon-verde.png",
  rojo: "/icon-rojo.png",
  tropical: "/icon-tropical.png",
};

/* ---------- Ficha LUMO bottom sheet ---------- */

function FichaLumoSheet({ formulaNombre, formulaSlug, accentColor, horaPreparado, diaEntrega, onClose }: {
  formulaNombre: string;
  formulaSlug: string;
  accentColor: string;
  horaPreparado?: string | null;
  diaEntrega?: string;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 350);
  }, [onClose]);

  const fichaKey = getFichaKey(formulaSlug);
  const data = fichaKey ? FICHA_DATA[fichaKey] : null;
  const ingredientImg = fichaKey ? INGREDIENT_IMAGES[fichaKey] : null;

  if (!data) return null;

  const prepHora = horaPreparado ? formatHora(horaPreparado) : "6:15 AM";

  return (
    <>
      <style>{`
        @keyframes sheetOverlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sheetOverlayOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes sheetSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes sheetSlideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
        @keyframes fichaStagger { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Overlay */}
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 200,
          animation: `${closing ? "sheetOverlayOut" : "sheetOverlayIn"} ${closing ? "300ms" : "250ms"} ease both`,
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: "88svh",
          background: "#FDFBF7",
          borderRadius: "28px 28px 0 0",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.08)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          animation: `${closing ? "sheetSlideDown" : "sheetSlideUp"} 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.1)" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "8px 24px 16px" }}>
          <div>
            <h2 className="font-cormorant" style={{ fontSize: 26, fontWeight: 300, color: "#1A1A1A", lineHeight: 1.2 }}>
              Ficha LUMO
            </h2>
            <p className="font-inter" style={{ fontSize: 13, color: "#9A9490", marginTop: 4 }}>
              {formulaNombre} · 250 ml
            </p>
          </div>
          <button
            onClick={close}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.04)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              marginTop: 4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9490" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 32px", WebkitOverflowScrolling: "touch" }}>

          {/* Ingredientes */}
          <div style={{ animation: "fichaStagger 0.4s ease 0.05s both" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c4-4 8-7.5 8-12a8 8 0 10-16 0c0 4.5 4 8 8 12z" />
                  </svg>
                  <span className="font-inter" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>Ingredientes</span>
                </div>
                <p className="font-inter" style={{ fontSize: 13, color: "#6A6A6A", lineHeight: 1.6 }}>
                  {data.ingredientes}
                </p>
              </div>
              {ingredientImg && (
                <img src={ingredientImg} alt="Ingredientes" style={{ width: 72, height: 72, objectFit: "contain", borderRadius: 12, flexShrink: 0, opacity: 0.9 }} />
              )}
            </div>
          </div>

          {/* Perfil nutricional */}
          <div style={{ animation: "fichaStagger 0.4s ease 0.12s both" }}>
            <div style={{ marginBottom: 24 }}>
              <span className="font-inter" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 2 }}>
                Perfil nutricional estimado
              </span>
              <span className="font-inter" style={{ fontSize: 12, color: "#9A9490", display: "block", marginBottom: 12 }}>
                por 250 ml
              </span>
              <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: 16, border: "1px solid rgba(0,0,0,0.05)", overflow: "hidden" }}>
                {data.nutricion.map((row, i) => (
                  <div key={row.label} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "11px 16px",
                    borderTop: i > 0 ? "1px solid rgba(0,0,0,0.04)" : "none",
                  }}>
                    <span className="font-inter" style={{ fontSize: 13, color: "#4A4A4A" }}>{row.label}</span>
                    <span className="font-inter" style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Micronutrientes */}
          <div style={{ animation: "fichaStagger 0.4s ease 0.19s both" }}>
            <div style={{ marginBottom: 24 }}>
              <span className="font-inter" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 10 }}>
                Micronutrientes destacados
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.micronutrientes.map((m) => (
                  <span key={m} className="font-inter" style={{
                    fontSize: 12,
                    color: "#5A6A4A",
                    padding: "6px 14px",
                    borderRadius: 100,
                    background: "rgba(74,94,58,0.06)",
                    border: "1px solid rgba(74,94,58,0.12)",
                  }}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Notas importantes */}
          <div style={{ animation: "fichaStagger 0.4s ease 0.26s both" }}>
            <div style={{ marginBottom: 24 }}>
              <span className="font-inter" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 8 }}>
                Notas importantes
              </span>
              <p className="font-inter" style={{ fontSize: 12, color: "#8A8580", lineHeight: 1.7 }}>
                Información estimada con base en ingredientes pesados antes del prensado. Los valores pueden variar por madurez, origen y rendimiento de extracción. No sustituye una recomendación médica o nutricional individualizada.
              </p>
            </div>
          </div>

          {/* Trazabilidad */}
          <div style={{ animation: "fichaStagger 0.4s ease 0.33s both" }}>
            <div style={{ marginBottom: 28 }}>
              <span className="font-inter" style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A", display: "block", marginBottom: 10 }}>
                Trazabilidad
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Preparación estimada", value: prepHora },
                  { label: "Método", value: "Prensado en frío" },
                  { label: "Conservación", value: "Refrigerado" },
                ].map((row) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="font-inter" style={{ fontSize: 13, color: "#8A8580" }}>{row.label}</span>
                    <span className="font-inter" style={{ fontSize: 13, color: "#4A4A4A", fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compartir ficha */}
          <div style={{ animation: "fichaStagger 0.4s ease 0.4s both" }}>
            <button
              onClick={() => {
                const text = `Ficha LUMO — ${formulaNombre} (250 ml)\n\nIngredientes: ${data.ingredientes}\n\nPerfil nutricional estimado (por 250 ml):\n${data.nutricion.map((r) => `${r.label}: ${r.value}`).join("\n")}\n\nMicronutrientes: ${data.micronutrientes.join(", ")}\n\nMétodo: Prensado en frío · Conservación: Refrigerado`;
                if (navigator.share) {
                  navigator.share({ title: `Ficha LUMO — ${formulaNombre}`, text }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(text).then(() => alert("Ficha copiada al portapapeles"));
                }
              }}
              className="font-inter spring-press"
              style={{
                width: "100%",
                padding: "14px 24px",
                borderRadius: 100,
                background: "#1A1A1A",
                color: "#F4EFE7",
                border: "none",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              Compartir ficha
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- page ---------- */

export default function MiPedidoPage({
  params,
}: {
  params: { token: string } | Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustStep, setAdjustStep] = useState<"choose" | "date" | "credit" | "sent">("choose");
  const [adjustDate, setAdjustDate] = useState("");
  const [adjustSending, setAdjustSending] = useState(false);
  const [adjustSent, setAdjustSent] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [showFicha, setShowFicha] = useState(false);

  useEffect(() => {
    document.documentElement.style.backgroundColor = "#F4EFE7";
    document.body.style.backgroundColor = "#F4EFE7";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    if (params instanceof Promise) {
      params.then((p) => setToken(p.token));
    } else {
      setToken((params as { token: string }).token);
    }
  }, [params]);

  useEffect(() => {
    if (!token) return;

    async function fetchPedidos() {
      const { data, error } = await supabase
        .from("pedidos")
        .select(
          "*, created_at, numero_pedido, clientes(nombre, telefono), formulas(nombre, slug, color_acento)"
        )
        .eq("token", token)
        .neq("estado", "eliminado");

      if (error || !data || data.length === 0) {
        setNotFound(true);
        return;
      }
      setPedidos(data as unknown as Pedido[]);
    }

    async function checkFeedback() {
      const { data } = await supabase
        .from("feedback")
        .select("id")
        .eq("pedido_token", token)
        .limit(1);
      if (data && data.length > 0) setHasFeedback(true);
    }

    fetchPedidos();
    checkFeedback();
    const interval = setInterval(fetchPedidos, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token]);

  if (notFound) {
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

  if (!pedidos) {
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
        <div
          className="font-cormorant"
          style={{
            fontSize: 14,
            letterSpacing: "0.45em",
            color: "#9A9490",
            animation: "accentPulse 2s ease-in-out infinite",
          }}
        >
          L U M O
        </div>
      </main>
    );
  }

  const stateOrder = ["pendiente", "confirmado", "preparado", "entregado"];
  const p = pedidos[0];
  const nombre = p.clientes?.nombre ?? "amigo";
  const multiFormula = pedidos.length > 1;
  const accentColor = multiFormula ? "#4A5E3A" : (p.formulas?.color_acento ?? "#4A5E3A");
  const lumoWhatsApp = LUMO_WHATSAPP;
  const orderLabel = p.numero_pedido ? `#${p.numero_pedido}` : p.token.slice(0, 8).toUpperCase();
  const isCancelado = pedidos.some((ped) => ped.estado === "cancelado");
  const globalEstado = isCancelado ? "cancelado" : pedidos.reduce((worst, ped) => {
    const idx = stateOrder.indexOf(ped.estado);
    return idx < stateOrder.indexOf(worst) ? ped.estado : worst;
  }, "entregado");

  const canAdjust = !isCancelado && globalEstado !== "entregado" && globalEstado !== "preparado";
  const cutoffPassed = !p.dia_entrega || isCutoffPassed(p.dia_entrega);

  return (
    <main
      style={{
        background: "#F4EFE7",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 20px 40px",
        maxWidth: 640,
        margin: "0 auto",
        width: "100%",
      }}
    >
      {/* Back + Logo */}
      <div style={{ width: "100%", maxWidth: 440, marginBottom: 32, animation: "pedidoFadeUp 0.7s ease 0s both" }}>
        <button
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else window.location.href = "/mi-lumo";
          }}
          className="font-inter spring-press flex items-center gap-1.5 mb-4"
          style={{ fontSize: 13, color: "#9A9490" }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Regresar
        </button>
        <div className="text-center">
          <span className="font-cormorant" style={{ fontSize: 14, letterSpacing: "0.45em", color: "#9A9490" }}>
            L U M O
          </span>
        </div>
      </div>

      {/* Greeting */}
      <h1
        className="font-cormorant"
        style={{
          fontSize: 34,
          fontWeight: 300,
          color: "#1A1A1A",
          margin: 0,
          textAlign: "center",
          letterSpacing: "-0.01em",
          animation: "pedidoFadeUp 0.7s ease 0.1s both",
        }}
      >
        Hola, {nombre}
      </h1>
      <p
        className="font-inter"
        style={{
          color: "#9A9490",
          fontSize: 13,
          marginTop: 8,
          marginBottom: 28,
          letterSpacing: "0.02em",
          animation: "pedidoFadeUp 0.7s ease 0.2s both",
        }}
      >
        Tu jugo de hoy · {orderLabel}
      </p>

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
        {/* Formula lines (grouped) */}
        {(() => {
          const bottleMap: Record<string, string> = {
            "verde-fresco": "/bottle-verde.png",
            "rojo-vital": "/bottle-rojo.png",
            "tropical-hydrate": "/bottle-tropical.png",
          };
          function getBottle(slug: string): string | null {
            if (bottleMap[slug]) return bottleMap[slug];
            for (const [key, val] of Object.entries(bottleMap)) {
              if (slug.includes(key.split("-")[0])) return val;
            }
            return null;
          }

          const grouped = pedidos.reduce<{ nombre: string; color: string; cantidad: number; slug: string }[]>((acc, ped) => {
            const name = ped.formulas?.nombre ?? "Formula";
            const existing = acc.find((g) => g.nombre === name);
            if (existing) {
              existing.cantidad += ped.cantidad ?? 1;
            } else {
              acc.push({ nombre: name, color: ped.formulas?.color_acento ?? "#4A5E3A", cantidad: ped.cantidad ?? 1, slug: ped.formulas?.slug ?? "" });
            }
            return acc;
          }, []);
          const isSingle = grouped.length === 1;

          return grouped.map((g, idx) => {
            const bottleImg = getBottle(g.slug);
            return (
              <div key={g.nombre} style={{ marginBottom: idx < grouped.length - 1 ? 12 : 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 2 }}>
                  {bottleImg ? (
                    <div style={{ position: "relative", width: 36, flexShrink: 0 }}>
                      <img src={bottleImg} alt={g.nombre} style={{ position: "relative", width: 36, height: 52, objectFit: "contain", opacity: 0.92 }} />
                    </div>
                  ) : (
                    <div style={{ position: "relative", width: 12, height: 12, flexShrink: 0 }}>
                      <div style={{ position: "relative", width: 12, height: 12, borderRadius: "50%", background: g.color, boxShadow: `0 0 8px ${g.color}44` }} />
                    </div>
                  )}
                  <div>
                    <span className="font-cormorant" style={{ fontSize: isSingle ? 24 : 20, fontWeight: 300, color: "#1A1A1A", display: "block" }}>
                      {g.nombre}
                    </span>
                    {(!isSingle || g.cantidad > 1) && (
                      <span className="font-inter" style={{ fontSize: 12, color: "#9A9490" }}>
                        {g.cantidad} {g.cantidad === 1 ? "botella" : "botellas"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          });
        })()}

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
          <span>{pedidos.reduce((s, ped) => s + (ped.cantidad ?? 1), 0)} botella{pedidos.reduce((s, ped) => s + (ped.cantidad ?? 1), 0) !== 1 ? "s" : ""}</span>
          {p.dia_entrega && (
            <>
              <span style={{ color: "#D4D0C8" }}>·</span>
              <span>{capitalize(formatDateLabel(p.dia_entrega))}</span>
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

        {/* Ficha LUMO CTA */}
        {globalEstado !== "cancelado" && (
          <div
            onClick={globalEstado !== "pendiente" ? () => setShowFicha(true) : undefined}
            style={{
              background: "rgba(74,94,58,0.06)",
              borderRadius: 14,
              padding: "14px 16px",
              marginBottom: 4,
              cursor: globalEstado !== "pendiente" ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "background 0.2s",
            }}
          >
            <div>
              <div className="font-cormorant" style={{ fontSize: 16, fontWeight: 300, color: "#1A1A1A", letterSpacing: "0.01em" }}>
                Ficha LUMO
              </div>
              <div className="font-inter" style={{ fontSize: 12, color: "#8C8475", marginTop: 2 }}>
                {globalEstado === "pendiente" ? "Disponible pronto" : "Ingredientes, perfil nutricional y más"}
              </div>
            </div>
            {globalEstado !== "pendiente" && (
              <span className="font-inter" style={{ fontSize: 12, color: accentColor, fontWeight: 500 }}>
                Ver ficha →
              </span>
            )}
          </div>
        )}

        {/* Timeline */}
        <Timeline
          estado={globalEstado}
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

      {/* Actions footer — consolidated */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          animation: "pedidoFadeUp 0.6s ease 1.5s both",
        }}
      >
        {/* Cancelado banner */}
        {isCancelado && (
          <div
            className="font-inter"
            style={{
              padding: "14px 20px",
              borderRadius: 16,
              background: "rgba(122,32,48,0.06)",
              border: "1px solid rgba(122,32,48,0.12)",
              fontSize: 13,
              color: "#7A2030",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Este pedido ha sido cancelado. Si tienes dudas,{" "}
            <a
              href={`https://wa.me/${lumoWhatsApp}?text=${encodeURIComponent(`Hola LUMO, tengo una consulta sobre mi pedido cancelado ${orderLabel}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#25D366", textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              contactanos
            </a>
            .
          </div>
        )}

        {/* Cutoff banner */}
        {canAdjust && cutoffPassed && (
          <div
            className="font-inter"
            style={{
              padding: "12px 18px",
              borderRadius: 16,
              background: "rgba(184,134,11,0.06)",
              border: "1px solid rgba(184,134,11,0.12)",
              fontSize: 13,
              color: "#8A8070",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Lote confirmado — cambios ya no disponibles.{" "}
            <a
              href={`https://wa.me/${lumoWhatsApp}?text=${encodeURIComponent(`Hola LUMO, necesito ayuda con mi pedido ${orderLabel}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#25D366", textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              Contactar
            </a>
          </div>
        )}

        {/* Compact action row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            flexWrap: "wrap",
            padding: "8px 0",
          }}
        >
          {/* Freshness tip */}
          {!isCancelado && (
            <span className="font-inter" style={{ fontSize: 12, color: "#9A9490", textAlign: "center" }}>
              Consumir en las primeras 4 hrs para mayor frescura
            </span>
          )}
        </div>

        {/* Buttons row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            flexWrap: "wrap",
            padding: "8px 0",
          }}
        >
          {/* Feedback (entregado) */}
          {globalEstado === "entregado" && (
            <a
              href={`/feedback?pedido=${p.token}`}
              className="font-inter"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 20px",
                borderRadius: 100,
                background: hasFeedback ? "rgba(74,94,58,0.08)" : "#1A1A1A",
                color: hasFeedback ? "#4A5E3A" : "#F4EFE7",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {hasFeedback ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Retroalimentación enviada
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  Mi experiencia
                </>
              )}
            </a>
          )}

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${lumoWhatsApp}?text=${encodeURIComponent(`Hola LUMO, tengo una consulta sobre mi pedido ${orderLabel}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-inter"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              borderRadius: 100,
              background: "rgba(37,211,102,0.08)",
              border: "1px solid rgba(37,211,102,0.18)",
              color: "#25D366",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contactar
          </a>

          {/* Adjust button */}
          {canAdjust && !cutoffPassed && (
            <button
              onClick={() => { setShowAdjustModal(true); setAdjustStep("choose"); }}
              className="font-inter"
              style={{
                padding: "10px 20px",
                borderRadius: 100,
                background: "rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.08)",
                color: "#7A7570",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {adjustSent ? "Cambiar solicitud" : "Ajustar pedido"}
            </button>
          )}
        </div>
      </div>

      {/* Adjustment Modal */}
      {showAdjustModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 20,
          }}
          onClick={() => setShowAdjustModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#F4EFE7",
              borderRadius: 24,
              padding: "32px 28px",
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              animation: "pedidoCardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            {adjustStep === "choose" && (
              <>
                <h2 className="font-cormorant" style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", marginBottom: 6 }}>
                  Ajustar pedido
                </h2>
                <p className="font-inter" style={{ fontSize: 13, color: "#8A8580", marginBottom: 24 }}>
                  Selecciona una opcion:
                </p>
                <button
                  onClick={() => setAdjustStep("date")}
                  className="font-inter"
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 16,
                    background: "rgba(74,94,58,0.06)",
                    border: "1px solid rgba(74,94,58,0.15)",
                    textAlign: "left",
                    cursor: "pointer",
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", display: "block" }}>
                    Cambiar fecha de entrega
                  </span>
                  <span style={{ fontSize: 13, color: "#8A8580", marginTop: 4, display: "block" }}>
                    Recibir tu pedido en otra fecha
                  </span>
                </button>
                <button
                  onClick={() => setAdjustStep("credit")}
                  className="font-inter"
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    borderRadius: 16,
                    background: "rgba(184,134,11,0.06)",
                    border: "1px solid rgba(184,134,11,0.12)",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1A1A1A", display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c0 0-8 9.27-8 13a8 8 0 0 0 16 0c0-3.73-8-13-8-13z"/></svg>
                    Convertir en Balance LUMO
                  </span>
                  <span style={{ fontSize: 13, color: "#8A8580", marginTop: 4, display: "block" }}>
                    Guarda el valor de tu pedido para usarlo en un próximo lote
                  </span>
                </button>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="font-inter"
                  style={{ width: "100%", marginTop: 16, padding: 10, background: "none", border: "none", color: "#9A9490", fontSize: 13, cursor: "pointer" }}
                >
                  Volver
                </button>
              </>
            )}

            {adjustStep === "date" && (
              <>
                <h2 className="font-cormorant" style={{ fontSize: 24, fontWeight: 300, color: "#1A1A1A", marginBottom: 6 }}>
                  Nueva fecha
                </h2>
                <p className="font-inter" style={{ fontSize: 13, color: "#8A8580", marginBottom: 20 }}>
                  Selecciona la fecha en la que te gustaria recibir tu pedido:
                </p>
                <input
                  type="date"
                  value={adjustDate}
                  onChange={(e) => setAdjustDate(e.target.value)}
                  min={(() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 2);
                    return d.toISOString().split("T")[0];
                  })()}
                  className="font-inter"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.1)",
                    background: "rgba(255,255,255,0.6)",
                    fontSize: 15,
                    color: "#1A1A1A",
                    marginBottom: 20,
                  }}
                />
                <button
                  onClick={async () => {
                    if (!adjustDate) return;
                    setAdjustSending(true);
                    await fetch("/api/ajuste", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        pedido_id: p.id,
                        token: p.token,
                        adjustment_type: "date_change",
                        requested_date: adjustDate,
                      }),
                    });
                    setAdjustSending(false);
                    setAdjustSent(true);
                    setAdjustStep("sent");
                  }}
                  disabled={!adjustDate || adjustSending}
                  className="font-inter"
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 100,
                    background: adjustDate ? "#4A5E3A" : "rgba(74,94,58,0.3)",
                    color: "#F4EFE7",
                    border: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: adjustDate ? "pointer" : "default",
                  }}
                >
                  {adjustSending ? "Enviando..." : "Confirmar cambio"}
                </button>
                <button
                  onClick={() => setAdjustStep("choose")}
                  className="font-inter"
                  style={{ width: "100%", marginTop: 12, padding: 10, background: "none", border: "none", color: "#9A9490", fontSize: 13, cursor: "pointer" }}
                >
                  Volver
                </button>
              </>
            )}

            {adjustStep === "credit" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c0 0-8 9.27-8 13a8 8 0 0 0 16 0c0-3.73-8-13-8-13z"/></svg>
                  <h2 className="font-cormorant" style={{ fontSize: 24, color: "#1A1A1A" }}>
                    Balance LUMO
                  </h2>
                </div>
                <p className="font-inter" style={{ fontSize: 13, color: "#8A8580", marginBottom: 20, lineHeight: 1.5 }}>
                  Guarda el valor de tu pedido para usarlo en un próximo lote disponible.
                </p>
                <button
                  onClick={async () => {
                    setAdjustSending(true);
                    await fetch("/api/ajuste", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        pedido_id: p.id,
                        token: p.token,
                        adjustment_type: "credit_request",
                        credit_validity_days: 30,
                      }),
                    });
                    setAdjustSending(false);
                    setAdjustSent(true);
                    setAdjustStep("sent");
                  }}
                  disabled={adjustSending}
                  className="font-inter"
                  style={{
                    width: "100%",
                    padding: "14px 20px",
                    borderRadius: 100,
                    background: "#4A5E3A",
                    color: "#F4EFE7",
                    border: "none",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {adjustSending ? "Enviando..." : "Convertir en Balance LUMO"}
                </button>
                <button
                  onClick={() => setAdjustStep("choose")}
                  className="font-inter"
                  style={{ width: "100%", marginTop: 12, padding: 10, background: "none", border: "none", color: "#9A9490", fontSize: 13, cursor: "pointer" }}
                >
                  Volver
                </button>
              </>
            )}

            {adjustStep === "sent" && (
              <>
                <div style={{ textAlign: "center", padding: "20px 0 8px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: "rgba(74,94,58,0.10)", marginBottom: 16, animation: "checkCirclePulse 0.6s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                    <svg
                      width="28" height="28" viewBox="0 0 24 24" fill="none"
                      stroke="#4A5E3A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ animation: "checkDraw 0.6s cubic-bezier(0.65,0,0.35,1) 0.2s both" }}
                    >
                      <path d="M5 13l4 4L19 7" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: "checkStroke 0.5s cubic-bezier(0.65,0,0.35,1) 0.3s forwards" }} />
                    </svg>
                  </div>
                  <h2 className="font-cormorant" style={{ fontSize: 24, color: "#1A1A1A", marginBottom: 8 }}>
                    Solicitud recibida
                  </h2>
                  <p className="font-inter" style={{ fontSize: 13, color: "#8A8580", lineHeight: 1.5 }}>
                    Tu solicitud está en revisión. Te confirmaremos pronto.
                  </p>
                </div>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="font-inter"
                  style={{
                    width: "100%",
                    marginTop: 20,
                    padding: "14px 20px",
                    borderRadius: 100,
                    background: "#1A1A1A",
                    color: "#F4EFE7",
                    border: "none",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <p
        className="font-inter"
        style={{
          color: "#B8B0A4",
          fontSize: 12,
          marginTop: 24,
          letterSpacing: "0.06em",
          animation: "footerIn 0.8s ease 1.8s both",
        }}
      >
        Hecho con intencion · LUMO
      </p>

      {showFicha && (
        <FichaLumoSheet
          formulaNombre={p.formulas.nombre}
          formulaSlug={p.formulas.slug}
          accentColor={accentColor}
          horaPreparado={p.hora_preparado ?? undefined}
          diaEntrega={p.dia_entrega}
          onClose={() => setShowFicha(false)}
        />
      )}
    </main>
  );
}
