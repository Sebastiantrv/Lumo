"use client";

import { useReveal, EASE } from "./Reveal";

/**
 * Chapter marker: a ghosted numeral, a rule that draws, and the label.
 *
 * Repeated at the head of every chapter, it does two jobs the old plain
 * eyebrow could not — it says where a section begins, and it says which
 * of six you are reading.
 */
export default function SectionMarker({
  num,
  label,
  muted = false,
}: {
  num: string;
  label: string;
  /** Quieter treatment for chapters that should recede (the FAQ). */
  muted?: boolean;
}) {
  const { ref, visible } = useReveal({ threshold: 0.4 });

  return (
    <div
      ref={ref}
      className="flex items-baseline gap-4"
      style={{ marginBottom: muted ? "clamp(1.5rem, 4vw, 2rem)" : "clamp(1.75rem, 4.5vw, 2.5rem)" }}
    >
      <span
        className="font-cormorant font-light"
        style={{
          fontSize: muted ? "clamp(1.4rem, 3.4vw, 1.8rem)" : "clamp(1.7rem, 4.4vw, 2.3rem)",
          lineHeight: 1,
          letterSpacing: "0.02em",
          // Cormorant defaults to oldstyle figures, where "01" reads as "OI".
          // A chapter number has to be unmistakable.
          fontVariantNumeric: "lining-nums tabular-nums",
          color: `rgba(245,240,232,${muted ? 0.11 : 0.17})`,
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(8px)",
          transition: `opacity 1s ${EASE}, transform 1s ${EASE}`,
        }}
      >
        {num}
      </span>

      <span
        aria-hidden="true"
        style={{
          height: 1,
          width: 28,
          alignSelf: "center",
          background: "rgba(74,94,58,0.55)",
          transformOrigin: "left",
          transform: visible ? "scaleX(1)" : "scaleX(0)",
          transition: `transform 0.9s ${EASE} 0.15s`,
        }}
      />

      <span
        className="font-inter uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.22em",
          color: muted ? "rgba(74,94,58,0.75)" : "#4A5E3A",
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateX(-6px)",
          transition: `opacity 0.9s ${EASE} 0.25s, transform 0.9s ${EASE} 0.25s`,
        }}
      >
        {label}
      </span>
    </div>
  );
}
