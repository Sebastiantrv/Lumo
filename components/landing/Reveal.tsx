"use client";

import { useEffect, useRef, useState } from "react";

/* ── Shared easing: ease-out expo. No overshoot, no bounce. ── */
export const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Fires once when the element scrolls into view.
 * Falls back to visible when IntersectionObserver is unavailable,
 * so content is never trapped behind a missing API.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  { threshold = 0.15, rootMargin = "0px 0px -12% 0px" } = {}
) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return { ref, visible };
}

type RevealProps = {
  children: React.ReactNode;
  /** Seconds to wait after entering view. Used for staggering siblings. */
  delay?: number;
  /** Pixels to travel on the Y axis. Keep small — 10–18 reads as premium. */
  y?: number;
  /** Adds a barely-perceptible scale-up. Off by default. */
  scale?: boolean;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
};

export default function Reveal({
  children,
  delay = 0,
  y = 14,
  scale = false,
  duration = 0.9,
  className,
  style,
}: RevealProps) {
  const { ref, visible } = useReveal();

  return (
    <div
      ref={ref}
      data-reveal=""
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "none"
          : `translateY(${y}px)${scale ? " scale(0.98)" : ""}`,
        transition: `opacity ${duration}s ${EASE} ${delay}s, transform ${duration}s ${EASE} ${delay}s`,
        willChange: visible ? "auto" : "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
