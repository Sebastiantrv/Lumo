"use client";

import Reveal from "./Reveal";
import MaskedLines from "./MaskedLines";
import SectionMarker from "./SectionMarker";
import { PLANO, SEAM } from "./tokens";

export default function PromesaSection() {
  return (
    <section
      id="promesa"
      className="px-6 md:px-12 lg:px-20"
      style={{
        background: PLANO.raised,
        borderTop: `1px solid ${SEAM}`,
        // The loudest type on the page after the hero. It gets the most air too.
        paddingTop: "clamp(7rem, 18vw, 13rem)",
        paddingBottom: "clamp(7rem, 18vw, 13rem)",
      }}
      aria-label="La promesa LUMO"
    >
      {/* Reading measure held near 700px — the page should never ask the eye to travel. */}
      <div style={{ maxWidth: 700 }} className="mx-auto flex flex-col gap-10">
        <SectionMarker num="01" label="La promesa" />

        <h2
          className="font-cormorant font-light"
          style={{
            fontSize: "clamp(2.35rem, 7.8vw, 4.1rem)",
            lineHeight: 1.13,
            color: "#F5F0E8",
            letterSpacing: "-0.02em",
          }}
        >
          <MaskedLines
            delay={0.05}
            lines={["No hacemos jugos.", "Creamos un mejor comienzo para tu día."]}
          />
        </h2>

        <Reveal delay={0.2} y={16} duration={1.1}>
          <div className="flex flex-col gap-6">
            <p
              className="font-inter"
              style={{ fontSize: "clamp(0.95rem, 2.6vw, 1.05rem)", lineHeight: 1.85, color: "#8A8A8A" }}
            >
              LUMO nació con una idea sencilla: si algo va a formar parte de tu rutina diaria,
              debe estar hecho con el mismo cuidado con el que eliges entrenar, descansar o alimentarte.
            </p>
            <p
              className="font-inter"
              style={{ fontSize: "clamp(0.95rem, 2.6vw, 1.05rem)", lineHeight: 1.85, color: "#8A8A8A" }}
            >
              Por eso producimos pequeñas cantidades cada mañana, utilizando únicamente ingredientes
              reales y prensado en frío para conservar lo que la naturaleza ya hizo bien.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
