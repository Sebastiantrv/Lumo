"use client";

import Reveal, { useReveal, EASE } from "./Reveal";

/**
 * A visual breath between sections. One line of type, one hairline.
 * Deliberately sparse — these carry the narrative, not information.
 */
export default function EditorialBreak({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useReveal({ threshold: 0.4 });

  return (
    <div
      ref={ref}
      className="px-6 md:px-12 lg:px-20"
      style={{ paddingTop: "clamp(5rem, 14vw, 9rem)", paddingBottom: "clamp(5rem, 14vw, 9rem)" }}
    >
      <div className="max-w-2xl mx-auto flex flex-col items-center gap-8">
        <div
          style={{
            height: 1,
            width: 48,
            background: "rgba(245,240,232,0.18)",
            transform: visible ? "scaleX(1)" : "scaleX(0)",
            transition: `transform 1.1s ${EASE}`,
          }}
        />
        <Reveal delay={0.15} y={10} duration={1.1}>
          <p
            className="font-cormorant font-light italic text-center"
            style={{
              fontSize: "clamp(1.35rem, 4.6vw, 2rem)",
              lineHeight: 1.4,
              color: "rgba(245,240,232,0.62)",
              letterSpacing: "0.005em",
            }}
          >
            {children}
          </p>
        </Reveal>
      </div>
    </div>
  );
}
