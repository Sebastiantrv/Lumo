"use client";

import Reveal from "./Reveal";
import SectionMarker from "./SectionMarker";
import { PLANO, SEAM, PAD } from "./tokens";

export default function ExperienciaSection() {
  const pasos = [
    {
      num: "01",
      title: "Reserva",
      desc: "Eliges tu fórmula y el día en que quieres recibirla. Sin suscripciones forzadas, sin carrito.",
      mock: <MockReserva />,
    },
    {
      num: "02",
      title: "Preparamos tu pedido",
      desc: "Esa misma mañana tu botella entra al lote del día. Se prensa, se envasa y pasa a frío.",
      mock: <MockPreparacion />,
    },
    {
      num: "03",
      title: "Seguimiento",
      desc: "Puedes ver en qué punto va tu pedido y abrir la ficha completa de lo que estás por recibir.",
      mock: <MockSeguimiento />,
    },
    {
      num: "04",
      title: "Entrega",
      desc: "Llega fría, el mismo día en que se preparó, en la ventana que acordamos contigo.",
      mock: <MockEntrega />,
    },
    {
      num: "05",
      title: "Mi LUMO",
      desc: "Tu espacio como miembro: tu Balance LUMO, tu historial y tus próximas entregas en un solo lugar.",
      mock: <MockMiLumo />,
    },
  ];

  return (
    <section
      id="experiencia"
      className="px-6 md:px-12 lg:px-20"
      style={{
        background: PLANO.raised,
        borderTop: `1px solid ${SEAM}`,
        paddingTop: PAD.chapterTop,
        paddingBottom: PAD.chapterBottom,
      }}
      aria-label="La experiencia LUMO"
    >
      <div className="max-w-5xl mx-auto">
        <SectionMarker num="05" label="La experiencia" />

        <Reveal y={16} duration={1.1}>
          <div style={{ maxWidth: 620, marginBottom: "clamp(3.5rem, 9vw, 5.5rem)" }}>
            <h2
              className="font-cormorant font-light"
              style={{
                fontSize: "clamp(1.9rem, 5.6vw, 2.9rem)",
                lineHeight: 1.18,
                color: "#F5F0E8",
                letterSpacing: "-0.015em",
                marginBottom: "1.5rem",
              }}
            >
              Recibir un LUMO no termina en la entrega.
            </h2>
            <p className="font-inter" style={{ fontSize: "0.95rem", lineHeight: 1.85, color: "#8A8A8A" }}>
              Diseñamos cada paso del recorrido con el mismo cuidado que ponemos en la botella.
            </p>
          </div>
        </Reveal>

        <div className="flex flex-col" style={{ gap: "clamp(3.5rem, 9vw, 5.5rem)" }}>
          {pasos.map((paso, i) => (
            <Reveal key={paso.num} y={20} duration={1} delay={0.05}>
              <div
                className={`flex flex-col gap-8 md:gap-14 md:items-center ${
                  i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
                }`}
              >
                {/* Copy */}
                <div className="flex-1 flex flex-col gap-3">
                  <span
                    className="font-inter"
                    style={{ fontSize: 11, letterSpacing: "0.18em", color: "#4A5E3A" }}
                  >
                    {paso.num}
                  </span>
                  <h3
                    className="font-cormorant font-light"
                    style={{ fontSize: "clamp(1.35rem, 4.2vw, 1.8rem)", color: "#F5F0E8", lineHeight: 1.25 }}
                  >
                    {paso.title}
                  </h3>
                  <p
                    className="font-inter"
                    style={{ fontSize: "0.88rem", lineHeight: 1.8, color: "#8A8A8A", maxWidth: 380 }}
                  >
                    {paso.desc}
                  </p>
                </div>

                {/* Interface fragment */}
                <div className="flex-1 w-full">{paso.mock}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════ Interface fragments ══════
   Abstract, not screenshots. They suggest the product without
   promising a specific screen we would then have to keep in sync. */

function MockFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl w-full"
      style={{
        border: "1px solid rgba(245,240,232,0.09)",
        background: "rgba(245,240,232,0.02)",
        padding: "1.25rem",
      }}
    >
      {children}
    </div>
  );
}

function MockLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="font-inter uppercase"
      style={{ fontSize: 9, letterSpacing: "0.2em", color: "#6A6A6A", marginBottom: "0.9rem" }}
    >
      {children}
    </p>
  );
}

function MockReserva() {
  const opciones = [
    { label: "Verde Fresco", color: "#4A5E3A", active: true },
    { label: "Rojo Vital", color: "#7A2030", active: false },
    { label: "Tropical Hydrate", color: "#B8860B", active: false },
  ];
  return (
    <MockFrame>
      <MockLabel>Elige tu fórmula</MockLabel>
      {/* The one place in this mockup that borrows the real formula
          palette — every row keeps a trace of its own color, not just
          the selected one, so the three read as a set. */}
      <div className="flex flex-col gap-2">
        {opciones.map((o) => (
          <div
            key={o.label}
            className="flex items-center gap-3 rounded-xl"
            style={{
              padding: "0.65rem 0.85rem",
              border: `1px solid ${o.color}${o.active ? "80" : "26"}`,
              background: `${o.color}${o.active ? "1c" : "0a"}`,
              transition: "background 0.3s ease, border-color 0.3s ease",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: o.color, display: "block", flexShrink: 0 }} />
            <span
              className="font-inter"
              style={{ fontSize: "0.78rem", color: o.active ? "#F5F0E8" : `${o.color}c8`, fontWeight: o.active ? 500 : 400 }}
            >
              {o.label}
            </span>
          </div>
        ))}
      </div>
      <div
        className="flex items-center justify-between rounded-xl"
        style={{ marginTop: "0.85rem", padding: "0.65rem 0.85rem", background: "rgba(245,240,232,0.04)" }}
      >
        <span className="font-inter" style={{ fontSize: "0.75rem", color: "#8A8A8A" }}>Entrega</span>
        <span className="font-inter" style={{ fontSize: "0.75rem", color: "#F5F0E8" }}>Mañana</span>
      </div>
    </MockFrame>
  );
}

function MockPreparacion() {
  return (
    <MockFrame>
      <MockLabel>Lote del día</MockLabel>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-cormorant font-light" style={{ fontSize: "2.1rem", color: "#F5F0E8", lineHeight: 1 }}>
          06:40
        </span>
        <span className="font-inter" style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>a.m.</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {[
          { label: "Prensado", done: true },
          { label: "Embotellado", done: true },
          { label: "Refrigeración", done: false },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2.5">
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                background: s.done ? "#4A5E3A" : "rgba(245,240,232,0.18)",
                display: "block",
              }}
            />
            <span
              className="font-inter"
              style={{ fontSize: "0.78rem", color: s.done ? "#F5F0E8" : "#6A6A6A" }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}

function MockSeguimiento() {
  return (
    <MockFrame>
      <div className="flex items-center justify-between mb-4">
        <MockLabel>Pedido #148</MockLabel>
        <span
          className="font-inter rounded-full"
          style={{
            fontSize: "0.66rem",
            padding: "0.2rem 0.6rem",
            color: "#4A5E3A",
            border: "1px solid rgba(74,94,58,0.4)",
          }}
        >
          En ruta
        </span>
      </div>
      <div style={{ height: 2, borderRadius: 999, background: "rgba(245,240,232,0.07)", marginBottom: "1rem" }}>
        <div style={{ width: "72%", height: "100%", borderRadius: 999, background: "#4A5E3A" }} />
      </div>
      <div
        className="flex items-center justify-between rounded-xl"
        style={{ padding: "0.7rem 0.85rem", border: "1px solid rgba(245,240,232,0.07)" }}
      >
        <span className="font-inter" style={{ fontSize: "0.75rem", color: "#8A8A8A" }}>Ficha LUMO</span>
        <span className="font-inter" style={{ fontSize: "0.75rem", color: "#4A5E3A" }}>Ver →</span>
      </div>
    </MockFrame>
  );
}

function MockEntrega() {
  return (
    <MockFrame>
      <MockLabel>Entregado</MockLabel>
      <div className="flex items-center gap-3.5">
        <div
          className="rounded-full flex items-center justify-center flex-shrink-0"
          style={{ width: 36, height: 36, background: "rgba(74,94,58,0.12)", border: "1px solid rgba(74,94,58,0.35)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-inter" style={{ fontSize: "0.82rem", color: "#F5F0E8" }}>
            Tu LUMO llegó
          </span>
          <span className="font-inter" style={{ fontSize: "0.72rem", color: "#6A6A6A" }}>
            Hoy · 7:15 a.m. · 4 °C
          </span>
        </div>
      </div>
    </MockFrame>
  );
}

function MockMiLumo() {
  return (
    <MockFrame>
      <MockLabel>Balance LUMO</MockLabel>
      <div className="flex items-baseline gap-1.5 mb-5">
        <span className="font-cormorant font-light" style={{ fontSize: "0.95rem", color: "#8A8A8A" }}>$</span>
        <span className="font-cormorant font-light" style={{ fontSize: "2.1rem", color: "#F5F0E8", lineHeight: 1 }}>
          255
        </span>
      </div>
      <div className="flex flex-col" style={{ borderTop: "1px solid rgba(245,240,232,0.07)" }}>
        {[
          { label: "Verde Fresco", date: "12 ago", monto: "−$85" },
          { label: "Rojo Vital", date: "09 ago", monto: "−$85" },
        ].map((h) => (
          <div
            key={h.date}
            className="flex items-center justify-between"
            style={{ padding: "0.7rem 0", borderBottom: "1px solid rgba(245,240,232,0.05)" }}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-inter" style={{ fontSize: "0.76rem", color: "#F5F0E8" }}>{h.label}</span>
              <span className="font-inter" style={{ fontSize: "0.68rem", color: "#6A6A6A" }}>{h.date}</span>
            </div>
            <span className="font-inter" style={{ fontSize: "0.76rem", color: "#8A8A8A" }}>{h.monto}</span>
          </div>
        ))}
      </div>
    </MockFrame>
  );
}
