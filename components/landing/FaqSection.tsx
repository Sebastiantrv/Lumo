"use client";

import { useState } from "react";
import Reveal, { EASE } from "./Reveal";
import SectionMarker from "./SectionMarker";
import { PLANO, SEAM, PAD } from "./tokens";

const faqs = [
  {
    q: "¿Cuánto dura un jugo?",
    a: "Hasta tres días refrigerado. Aun así, recomendamos tomarlo el mismo día: es cuando el sabor y el aroma están en su mejor punto.",
  },
  {
    q: "¿Por qué debe mantenerse refrigerado?",
    a: "Porque no lleva conservadores ni pasa por pasteurización. El frío es lo único que usamos para mantenerlo estable, así que la cadena de frío no debe romperse.",
  },
  {
    q: "¿Por qué el sabor puede cambiar ligeramente?",
    a: "Trabajamos con fruta y verdura reales, y ningún betabel sabe exactamente igual que el anterior. La temporada y el punto de maduración se notan. Preferimos esa variación antes que estandarizar con aditivos.",
  },
  {
    q: "¿Por qué algunos días no hay disponibilidad?",
    a: "Producimos por lotes pequeños y solo con lo que conseguimos fresco esa mañana. Cuando el lote se agota, se agota. No producimos de más para llenar inventario.",
  },
  {
    q: "¿Incluye envío?",
    a: "Sí. Durante el piloto la entrega está incluida dentro de nuestras zonas de cobertura, en la ventana de la mañana que acordamos contigo.",
  },
  {
    q: "¿Puedo cancelar mi pedido?",
    a: "Sí, siempre que lo hagas antes de las 8:00 p.m. del día anterior. Después de esa hora tu botella ya entró al lote del día siguiente y se prepara con tu nombre.",
  },
  {
    q: "¿Cómo funciona Balance LUMO?",
    a: "Es el saldo de tu cuenta de miembro. Cada reserva se descuenta automáticamente de tu balance, así no tienes que hacer un pago por entrega. Puedes consultarlo en cualquier momento desde Mi LUMO.",
  },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="px-6 md:px-12 lg:px-20"
      style={{
        // Deliberately the quietest chapter — it sits between two loud
        // moments and should not compete with the closing frame.
        background: PLANO.base,
        borderTop: `1px solid ${SEAM}`,
        paddingTop: PAD.chapterTop,
        paddingBottom: PAD.chapterBottom,
      }}
      aria-label="Preguntas frecuentes"
    >
      <div style={{ maxWidth: 760 }} className="mx-auto">
        <SectionMarker num="06" label="Preguntas" muted />

        <Reveal y={16} duration={1.1}>
          <div style={{ marginBottom: "clamp(2.5rem, 7vw, 4rem)" }}>
            <h2
              className="font-cormorant font-light"
              style={{
                fontSize: "clamp(1.55rem, 4.2vw, 2.1rem)",
                lineHeight: 1.2,
                color: "rgba(245,240,232,0.88)",
                letterSpacing: "-0.01em",
              }}
            >
              Lo que suelen preguntarnos
            </h2>
          </div>
        </Reveal>

        <div style={{ borderTop: "1px solid rgba(245,240,232,0.09)" }}>
          {faqs.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 0.04} y={12} duration={0.85}>
              <FaqItem
                faq={faq}
                open={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({
  faq,
  open,
  onToggle,
}: {
  faq: { q: string; a: string };
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ borderBottom: "1px solid rgba(245,240,232,0.09)" }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-start justify-between gap-6 text-left"
        style={{
          padding: "1.4rem 0",
          background: "none",
          border: "none",
          cursor: "pointer",
          transition: `opacity 0.25s ease`,
        }}
      >
        <span
          className="font-inter"
          style={{
            fontSize: "clamp(0.9rem, 2.6vw, 1rem)",
            color: open ? "#F5F0E8" : "#CFC9C0",
            fontWeight: 400,
            lineHeight: 1.5,
            transition: "color 0.35s ease",
          }}
        >
          {faq.q}
        </span>

        {/* Plus that becomes a minus — the only motion the control needs. */}
        <span
          className="relative flex-shrink-0"
          style={{ width: 12, height: 12, marginTop: 5 }}
          aria-hidden="true"
        >
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: 12,
              height: 1,
              background: open ? "#4A5E3A" : "#8A8A8A",
              transition: `background 0.35s ease`,
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              width: 12,
              height: 1,
              background: open ? "#4A5E3A" : "#8A8A8A",
              transform: open ? "rotate(0deg)" : "rotate(90deg)",
              transition: `transform 0.45s ${EASE}, background 0.35s ease`,
            }}
          />
        </span>
      </button>

      {/* Grid-rows trick: animates to auto height without measuring. */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
          transition: `grid-template-rows 0.5s ${EASE}, opacity 0.4s ease`,
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <p
            className="font-inter"
            style={{
              fontSize: "0.875rem",
              lineHeight: 1.85,
              color: "#8A8A8A",
              paddingBottom: "1.5rem",
              paddingRight: "2rem",
              maxWidth: 620,
            }}
          >
            {faq.a}
          </p>
        </div>
      </div>
    </div>
  );
}
