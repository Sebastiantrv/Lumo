"use client";

import Reveal from "./Reveal";
import SectionMarker from "./SectionMarker";
import { PLANO, SEAM, PAD } from "./tokens";

type Principio = {
  icon: React.ReactNode;
  title: string;
  lines: string[];
};

const principios: Principio[] = [
  {
    icon: <SproutIcon />,
    title: "Solo ingredientes reales",
    lines: ["Sin concentrados.", "Sin saborizantes.", "Sin colorantes."],
  },
  {
    icon: <SunriseIcon />,
    title: "Hecho cada mañana",
    lines: ["Cada lote se prepara el mismo día de entrega."],
  },
  {
    icon: <BatchIcon />,
    title: "Producción limitada",
    lines: ["Preferimos producir menos antes que comprometer la calidad."],
  },
  {
    icon: <PressIcon />,
    title: "Prensado en frío",
    lines: ["Menor oxidación.", "Mayor conservación del sabor."],
  },
  {
    icon: <LensIcon />,
    title: "Transparencia",
    lines: ["Mostramos exactamente qué contiene cada botella."],
  },
];

export default function FilosofiaSection() {
  return (
    <section
      id="filosofia"
      className="px-6 md:px-12 lg:px-20"
      style={{
        background: PLANO.base,
        borderTop: `1px solid ${SEAM}`,
        paddingTop: PAD.chapterTop,
        paddingBottom: PAD.chapterBottom,
      }}
      aria-label="Nuestra filosofía"
    >
      <div className="max-w-5xl mx-auto">
        <SectionMarker num="02" label="Filosofía" />

        <Reveal y={16} duration={1.1}>
          <h2
            className="font-cormorant font-light"
            style={{
              fontSize: "clamp(1.9rem, 5.6vw, 2.9rem)",
              lineHeight: 1.2,
              color: "#F5F0E8",
              marginBottom: "clamp(3rem, 8vw, 4.5rem)",
              letterSpacing: "-0.015em",
            }}
          >
            Cinco reglas que no negociamos
          </h2>
        </Reveal>

        {/* No cards. Composition and hairlines carry the structure. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-0">
          {principios.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08} y={16} duration={1}>
              <div
                className="flex flex-col gap-4 h-full"
                style={{
                  paddingTop: "2rem",
                  paddingBottom: "2rem",
                  borderTop: "1px solid rgba(245,240,232,0.09)",
                }}
              >
                <div style={{ color: "#4A5E3A" }}>{p.icon}</div>
                <h3
                  className="font-inter"
                  style={{ fontSize: "0.95rem", fontWeight: 500, color: "#F5F0E8", letterSpacing: "0.005em" }}
                >
                  {p.title}
                </h3>
                <div className="flex flex-col gap-1">
                  {p.lines.map((line) => (
                    <p
                      key={line}
                      className="font-inter"
                      style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "#8A8A8A" }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Line icons — 1.25 stroke, no fill, consistent 22px box ── */
const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function SproutIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21V11" />
      <path d="M12 11C12 7.5 9.5 5 6 5c0 3.5 2.5 6 6 6z" />
      <path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5z" />
    </svg>
  );
}

function SunriseIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3v3" />
      <path d="M5.5 8.5 7.6 10.6" />
      <path d="M18.5 8.5 16.4 10.6" />
      <path d="M3 18h18" />
      <path d="M7 18a5 5 0 0 1 10 0" />
    </svg>
  );
}

function BatchIcon() {
  return (
    <svg {...iconProps}>
      <path d="M9 3h6" />
      <path d="M10 3v4L6.5 15.5A3 3 0 0 0 9.3 20h5.4a3 3 0 0 0 2.8-4.5L14 7V3" />
      <path d="M8 14h8" />
    </svg>
  );
}

function PressIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 5h16" />
      <path d="M7 5v4a5 5 0 0 0 10 0V5" />
      <path d="M12 14v3" />
      <path d="M9 20h6" />
    </svg>
  );
}

function LensIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.9-3.9" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </svg>
  );
}
