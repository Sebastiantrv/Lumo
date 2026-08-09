"use client";

import Reveal from "./Reveal";

export default function PromesaSection() {
  return (
    <section
      id="promesa"
      className="px-6 md:px-12 lg:px-20"
      style={{ paddingTop: "clamp(6rem, 16vw, 11rem)", paddingBottom: "clamp(4rem, 10vw, 7rem)" }}
      aria-label="La promesa LUMO"
    >
      {/* Reading measure held near 700px — the page should never ask the eye to travel. */}
      <div style={{ maxWidth: 700 }} className="mx-auto flex flex-col gap-10">
        <Reveal y={16} duration={1.1}>
          <p
            className="font-inter uppercase"
            style={{ fontSize: 11, letterSpacing: "0.22em", color: "#4A5E3A" }}
          >
            La promesa LUMO
          </p>
        </Reveal>

        <Reveal delay={0.1} y={18} duration={1.1}>
          <h2
            className="font-cormorant font-light"
            style={{
              fontSize: "clamp(2rem, 6.4vw, 3.1rem)",
              lineHeight: 1.18,
              color: "#F5F0E8",
              letterSpacing: "-0.015em",
            }}
          >
            No hacemos jugos.
            <br />
            Creamos un mejor comienzo para tu día.
          </h2>
        </Reveal>

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
