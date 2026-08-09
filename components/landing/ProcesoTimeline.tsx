"use client";

import { useEffect, useState } from "react";
import Reveal, { useReveal, EASE } from "./Reveal";
import PrensadoModal from "./PrensadoModal";
import SectionMarker from "./SectionMarker";
import { PLANO, SEAM } from "./tokens";

type Paso = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

const pasos: Paso[] = [
  {
    icon: <BasketIcon />,
    title: "Selección de ingredientes",
    desc: "Elegimos fruta y verdura en su punto, en cantidades pequeñas.",
  },
  {
    icon: <DropletsIcon />,
    title: "Lavado y preparación",
    desc: "Cada pieza se lava y se corta a mano antes de entrar a la prensa.",
  },
  {
    icon: <PressIcon />,
    title: "Prensado en frío",
    desc: "Extraemos sin generar calor, para no alterar el ingrediente.",
  },
  {
    icon: <BottleIcon />,
    title: "Embotellado",
    desc: "Envasamos de inmediato, botella por botella.",
  },
  {
    icon: <ColdIcon />,
    title: "Refrigeración inmediata",
    desc: "El jugo pasa a frío en cuanto se cierra la botella.",
  },
  {
    icon: <SunriseIcon />,
    title: "Entrega esa misma mañana",
    desc: "Llega a tus manos el mismo día en que se preparó.",
  },
];

export default function ProcesoTimeline() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section
      id="proceso"
      className="px-6 md:px-12 lg:px-20"
      style={{
        background: PLANO.raised,
        borderTop: `1px solid ${SEAM}`,
        paddingTop: "clamp(4.5rem, 11vw, 7.5rem)",
        paddingBottom: "clamp(5rem, 12vw, 8rem)",
      }}
      aria-label="Así nace una botella LUMO"
    >
      <div className="max-w-6xl mx-auto">
        <SectionMarker num="03" label="El proceso" />

        <Reveal y={16} duration={1.1}>
          <div style={{ maxWidth: 640, marginBottom: "clamp(3.5rem, 9vw, 5.5rem)" }}>
            <h2
              className="font-cormorant font-light"
              style={{
                fontSize: "clamp(1.9rem, 5.6vw, 2.9rem)",
                lineHeight: 1.18,
                color: "#F5F0E8",
                letterSpacing: "-0.015em",
              }}
            >
              Así nace una botella LUMO
            </h2>
          </div>
        </Reveal>

        <HorizontalTimeline pasos={pasos} />
        <VerticalTimeline pasos={pasos} />

        {/* ── Informative card ── */}
        <Reveal y={18} duration={1.1}>
          <div
            className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 rounded-2xl"
            style={{
              marginTop: "clamp(4rem, 10vw, 6rem)",
              padding: "clamp(1.75rem, 5vw, 2.75rem)",
              border: "1px solid rgba(245,240,232,0.09)",
              background: "rgba(245,240,232,0.02)",
            }}
          >
            <div className="flex-1 flex flex-col gap-3">
              <h3
                className="font-cormorant font-light"
                style={{ fontSize: "clamp(1.25rem, 3.6vw, 1.6rem)", color: "#F5F0E8", lineHeight: 1.3 }}
              >
                ¿Qué significa prensado en frío?
              </h3>
              <p
                className="font-inter"
                style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "#8A8A8A", maxWidth: 560 }}
              >
                El prensado en frío reduce la oxidación y evita procesos térmicos agresivos,
                ayudando a conservar mejor el sabor y las características naturales de frutas y verduras.
              </p>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="font-inter rounded-full spring-press self-start md:self-auto flex-shrink-0 inline-flex items-center gap-2"
              style={{
                fontSize: "0.875rem",
                padding: "0.75rem 1.4rem",
                color: "#F5F0E8",
                border: "1px solid rgba(74,94,58,0.7)",
                background: "transparent",
              }}
            >
              Saber más
              <span aria-hidden="true" style={{ color: "#4A5E3A" }}>→</span>
            </button>
          </div>
        </Reveal>
      </div>

      <PrensadoModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
}

/* ── Desktop: line draws left to right ── */
function HorizontalTimeline({ pasos }: { pasos: Paso[] }) {
  const { ref, visible } = useReveal({ threshold: 0.2 });

  return (
    <div ref={ref} className="hidden lg:block relative">
      {/* Rail sits behind the node row, centered on the 44px circles */}
      <div
        style={{
          position: "absolute",
          top: 22,
          left: "8.33%",
          right: "8.33%",
          height: 1,
          background: "rgba(245,240,232,0.14)",
          transformOrigin: "left",
          transform: visible ? "scaleX(1)" : "scaleX(0)",
          transition: `transform 1.8s ${EASE} 0.1s`,
        }}
      />

      <div className="grid grid-cols-6 gap-5 relative">
        {pasos.map((paso, i) => (
          <div key={paso.title} className="flex flex-col items-center text-center gap-4">
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                background: PLANO.raised,
                border: "1px solid rgba(74,94,58,0.45)",
                color: "#4A5E3A",
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.9)",
                transition: `opacity 0.7s ${EASE} ${0.25 + i * 0.16}s, transform 0.7s ${EASE} ${0.25 + i * 0.16}s`,
              }}
            >
              {paso.icon}
            </div>

            <div
              className="flex flex-col gap-2"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(10px)",
                transition: `opacity 0.8s ${EASE} ${0.38 + i * 0.16}s, transform 0.8s ${EASE} ${0.38 + i * 0.16}s`,
              }}
            >
              <h3
                className="font-inter"
                style={{ fontSize: "0.82rem", fontWeight: 500, color: "#F5F0E8", lineHeight: 1.4 }}
              >
                {paso.title}
              </h3>
              <p
                className="font-inter"
                style={{ fontSize: "0.75rem", lineHeight: 1.65, color: "#8A8A8A" }}
              >
                {paso.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mobile / tablet: line draws top to bottom ── */
function VerticalTimeline({ pasos }: { pasos: Paso[] }) {
  const { ref, visible } = useReveal({ threshold: 0.08 });

  return (
    <div ref={ref} className="lg:hidden relative">
      <div
        style={{
          position: "absolute",
          left: 21,
          top: 22,
          bottom: 22,
          width: 1,
          background: "rgba(245,240,232,0.14)",
          transformOrigin: "top",
          transform: visible ? "scaleY(1)" : "scaleY(0)",
          transition: `transform 2s ${EASE} 0.1s`,
        }}
      />

      <div className="flex flex-col gap-9">
        {pasos.map((paso, i) => (
          <div key={paso.title} className="flex items-start gap-5 relative">
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                width: 44,
                height: 44,
                background: PLANO.raised,
                border: "1px solid rgba(74,94,58,0.45)",
                color: "#4A5E3A",
                opacity: visible ? 1 : 0,
                transform: visible ? "scale(1)" : "scale(0.9)",
                transition: `opacity 0.6s ${EASE} ${0.2 + i * 0.13}s, transform 0.6s ${EASE} ${0.2 + i * 0.13}s`,
              }}
            >
              {paso.icon}
            </div>

            <div
              className="flex flex-col gap-1.5"
              style={{
                paddingTop: 4,
                opacity: visible ? 1 : 0,
                transform: visible ? "none" : "translateY(10px)",
                transition: `opacity 0.7s ${EASE} ${0.3 + i * 0.13}s, transform 0.7s ${EASE} ${0.3 + i * 0.13}s`,
              }}
            >
              <h3
                className="font-inter"
                style={{ fontSize: "0.9rem", fontWeight: 500, color: "#F5F0E8", lineHeight: 1.4 }}
              >
                {paso.title}
              </h3>
              <p
                className="font-inter"
                style={{ fontSize: "0.82rem", lineHeight: 1.7, color: "#8A8A8A" }}
              >
                {paso.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Icons ── */
const ip = {
  width: 19,
  height: 19,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function BasketIcon() {
  return (
    <svg {...ip}>
      <path d="M4 9h16l-1.5 9.5A2 2 0 0 1 16.5 20h-9a2 2 0 0 1-2-1.5L4 9z" />
      <path d="m8.5 9 2-5" />
      <path d="m15.5 9-2-5" />
    </svg>
  );
}

function DropletsIcon() {
  return (
    <svg {...ip}>
      <path d="M8.5 3.5c2 2.4 3.2 4.2 3.2 5.8a3.2 3.2 0 0 1-6.4 0c0-1.6 1.2-3.4 3.2-5.8z" />
      <path d="M16 11c1.8 2.2 2.8 3.8 2.8 5.2a2.9 2.9 0 0 1-5.7 0c0-1.4 1-3 2.9-5.2z" />
    </svg>
  );
}

function PressIcon() {
  return (
    <svg {...ip}>
      <path d="M4 5h16" />
      <path d="M7 5v4a5 5 0 0 0 10 0V5" />
      <path d="M12 14v3" />
      <path d="M9 20h6" />
    </svg>
  );
}

function BottleIcon() {
  return (
    <svg {...ip}>
      <path d="M10 2h4" />
      <path d="M10.5 2v3.2a2 2 0 0 1-.4 1.2L9 8a3 3 0 0 0-.6 1.8V19a2 2 0 0 0 2 2h3.2a2 2 0 0 0 2-2V9.8A3 3 0 0 0 15 8l-1.1-1.6a2 2 0 0 1-.4-1.2V2" />
      <path d="M8.4 12.5h7.2" />
    </svg>
  );
}

function ColdIcon() {
  return (
    <svg {...ip}>
      <path d="M12 3v18" />
      <path d="m5.5 7 13 10" />
      <path d="m18.5 7-13 10" />
      <path d="M12 7.5 9.6 5.4M12 7.5l2.4-2.1" />
      <path d="M12 16.5l-2.4 2.1M12 16.5l2.4 2.1" />
    </svg>
  );
}

function SunriseIcon() {
  return (
    <svg {...ip}>
      <path d="M12 3v3" />
      <path d="M5.5 8.5 7.6 10.6" />
      <path d="M18.5 8.5 16.4 10.6" />
      <path d="M3 18h18" />
      <path d="M7 18a5 5 0 0 1 10 0" />
    </svg>
  );
}
