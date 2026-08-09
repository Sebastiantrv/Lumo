"use client";

import { useReveal, EASE } from "./Reveal";

type MaskedLinesProps = {
  /** One entry per masked band. Each rises independently. */
  lines: React.ReactNode[];
  delay?: number;
  stagger?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Statement reveal: each line rises out of its own clipping band.
 *
 * Reserved for the few lines that set the tone — the promise, the
 * editorial breaks, the closing frame. Everything else fades up through
 * `Reveal`, so this stays a gesture rather than a habit.
 */
export default function MaskedLines({
  lines,
  delay = 0,
  stagger = 0.11,
  duration = 1.15,
  className,
  style,
}: MaskedLinesProps) {
  const { ref, visible } = useReveal({ threshold: 0.25 });

  return (
    <span ref={ref} className={className} style={{ display: "block", ...style }}>
      {lines.map((line, i) => (
        <span
          key={i}
          style={{
            display: "block",
            overflow: "hidden",
            // Give descenders room so the band never clips a "j" or "g".
            paddingBottom: "0.14em",
            marginBottom: "-0.14em",
          }}
        >
          <span
            data-reveal=""
            style={{
              display: "block",
              transform: visible ? "translateY(0)" : "translateY(101%)",
              transition: `transform ${duration}s ${EASE} ${delay + i * stagger}s`,
              willChange: visible ? "auto" : "transform",
            }}
          >
            {line}
          </span>
        </span>
      ))}
    </span>
  );
}
