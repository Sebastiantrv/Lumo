"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Reveal, { useReveal, EASE } from "./Reveal";
import MaskedLines from "./MaskedLines";
import { PLANO, SEAM, PAD } from "./tokens";

export default function CierreSection() {
  const [imgError, setImgError] = useState(false);
  const { ref, visible } = useReveal({ threshold: 0.25 });

  return (
    <section
      id="reservar"
      ref={ref}
      className="relative overflow-hidden px-6 md:px-12 lg:px-20"
      style={{
        paddingTop: PAD.closeY,
        paddingBottom: PAD.closeY,
        // Deepest plane on the page. The narrative closes darker than it opened.
        background: PLANO.deep,
        borderTop: `1px solid ${SEAM}`,
      }}
      aria-label="Reservar tu LUMO"
    >
      {/* Single soft pool of light behind the bottle. No gradient sheets. */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(520px, 90vw)",
          height: "min(520px, 90vw)",
          background: "radial-gradient(circle, rgba(74,94,58,0.10) 0%, rgba(6,6,6,0) 68%)",
        }}
      />

      <div className="relative max-w-2xl mx-auto flex flex-col items-center text-center">
        {/* Bottle — very slow, very small zoom. */}
        <div
          style={{
            width: "clamp(110px, 26vw, 168px)",
            marginBottom: "clamp(3rem, 8vw, 4.5rem)",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.94)",
            transition: `opacity 1.6s ${EASE}, transform 2.4s ${EASE}`,
          }}
        >
          {!imgError ? (
            <Image
              src="/bottle-verde.png"
              alt="Botella LUMO"
              width={600}
              height={900}
              sizes="168px"
              onError={() => setImgError(true)}
              style={{ width: "100%", height: "auto", display: "block", filter: "brightness(1.06)" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: "2 / 3",
                borderRadius: 18,
                border: "1px solid rgba(74,94,58,0.25)",
                background: "rgba(74,94,58,0.06)",
              }}
            />
          )}
        </div>

        <h2
          className="font-cormorant font-light"
          style={{
            fontSize: "clamp(1.75rem, 6vw, 3rem)",
            lineHeight: 1.28,
            color: "#F5F0E8",
            letterSpacing: "-0.015em",
          }}
        >
          <MaskedLines
            delay={0.1}
            stagger={0.16}
            duration={1.3}
            lines={[
              "La calidad no empieza cuando abres la botella.",
              <span key="b" style={{ color: "rgba(245,240,232,0.5)" }}>
                Empieza mucho antes.
              </span>,
            ]}
          />
        </h2>

        <Reveal delay={0.18} y={12} duration={1.1}>
          <p
            className="font-inter"
            style={{
              fontSize: "0.85rem",
              lineHeight: 1.9,
              color: "#8A8A8A",
              marginTop: "clamp(2rem, 5vw, 2.75rem)",
              letterSpacing: "0.02em",
            }}
          >
            Prensados en frío.
            <br />
            Hechos cada mañana.
          </p>
        </Reveal>

        <Reveal delay={0.3} y={12} duration={1.1}>
          <Link
            href="/mi-lumo"
            className="inline-flex items-center gap-3 font-inter font-medium rounded-full spring-press"
            style={{
              marginTop: "clamp(2.5rem, 6vw, 3.5rem)",
              fontSize: "0.95rem",
              padding: "0.95rem 2.2rem",
              background: "#F5F0E8",
              color: "#0D0D0D",
            }}
          >
            Reservar
            <span aria-hidden="true">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
