"use client";

import { useReveal, EASE } from "./Reveal";
import MaskedLines from "./MaskedLines";
import { PLANO, PAD, type Plano } from "./tokens";

/**
 * A visual breath between sections. One line of type, one hairline.
 * Deliberately sparse — these carry the narrative, not information.
 */
export default function EditorialBreak({
  children,
  tone = "base",
}: {
  children: React.ReactNode;
  /** Must match the chapter it closes, so the plane reads as continuous. */
  tone?: Plano;
}) {
  const { ref, visible } = useReveal({ threshold: 0.4 });

  return (
    <div
      ref={ref}
      className="px-6 md:px-12 lg:px-20"
      style={{
        background: PLANO[tone],
        paddingTop: PAD.breakY,
        paddingBottom: PAD.breakY,
      }}
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
        <p
          className="font-cormorant font-light italic text-center"
          style={{
            fontSize: "clamp(1.35rem, 4.6vw, 2rem)",
            lineHeight: 1.4,
            color: "rgba(245,240,232,0.62)",
            letterSpacing: "0.005em",
          }}
        >
          <MaskedLines delay={0.22} duration={1.25} lines={[children]} />
        </p>
      </div>
    </div>
  );
}
