"use client";

import { useEffect, useRef, useState } from "react";
import { EASE } from "./Reveal";

const SECCIONES = [
  { id: "promesa",     label: "La promesa" },
  { id: "filosofia",   label: "Filosofía" },
  { id: "proceso",     label: "El proceso" },
  { id: "formulas",    label: "Fórmulas" },
  { id: "experiencia", label: "La experiencia" },
  { id: "faq",         label: "Preguntas" },
  { id: "reservar",    label: "Reservar" },
];

const ROW_H = 30;
const LAST = SECCIONES.length - 1;

/**
 * Reading position for a very long page.
 * Desktop gets a dotted rail; narrow screens get a hairline at the top.
 * Both stay hidden over the hero so the opening frame is left alone.
 */
export default function ScrollProgress() {
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  // Labels surface for a moment when you cross into a new section,
  // then step back out of the way.
  const [flash, setFlash] = useState(false);
  // Labels reach left into the page. Below this width they would sit on top
  // of body copy, so narrower desktops get the dots alone.
  const [roomForLabels, setRoomForLabels] = useState(false);

  const offsets = useRef<number[]>([]);
  const prevActive = useRef<number | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const measure = () => {
      offsets.current = SECCIONES.map(({ id }) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : Number.POSITIVE_INFINITY;
      });
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;

        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
        setVisible(y > window.innerHeight * 0.6);

        // A section counts as current once its top passes the upper third.
        const marker = y + window.innerHeight * 0.35;
        let idx = 0;
        for (let i = 0; i < offsets.current.length; i++) {
          if (offsets.current[i] <= marker) idx = i;
        }
        setActive(idx);
      });
    };

    measure();
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    // Images settling can shift every offset below them.
    window.addEventListener("load", measure);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("load", measure);
    };
  }, []);

  useEffect(() => {
    // Skip the first assignment so the rail doesn't announce itself on load.
    if (prevActive.current === null) {
      prevActive.current = active;
      return;
    }
    if (prevActive.current === active) return;
    prevActive.current = active;

    setFlash(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 1700);
  }, [active]);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1440px)");
    const sync = () => setRoomForLabels(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const labelsOut = roomForLabels && (hovered || flash);

  return (
    <>
      {/* ── Desktop rail ── */}
      <nav
        aria-label="Progreso de lectura"
        className="hidden lg:flex"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: "fixed",
          right: 30,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 30,
          flexDirection: "column",
          // Transparent gutter so the 7px dots are comfortable to hit
          // without the nav box reaching over page content.
          paddingLeft: 28,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
          transition: `opacity 0.7s ${EASE}`,
        }}
      >
        {/* Track */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 3,
            top: ROW_H / 2,
            height: ROW_H * LAST,
            width: 1,
            background: "rgba(245,240,232,0.12)",
          }}
        />
        {/* Filled portion, up to the current dot */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 3,
            top: ROW_H / 2,
            height: (ROW_H * LAST * active) / LAST,
            width: 1,
            background: "rgba(74,94,58,0.85)",
            transition: `height 0.65s ${EASE}`,
          }}
        />

        {SECCIONES.map((s, i) => {
          const isActive = i === active;
          const isPast = i < active;

          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={isActive ? "true" : undefined}
              className="flex items-center justify-end"
              style={{ height: ROW_H, textDecoration: "none", position: "relative" }}
            >
              {/* Absolute so the row stays dot-width and the label can never
                  intercept a click meant for the page behind it. */}
              <span
                className="font-inter whitespace-nowrap"
                style={{
                  position: "absolute",
                  right: 19,
                  pointerEvents: "none",
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  color: isActive ? "#F5F0E8" : "rgba(245,240,232,0.45)",
                  opacity: labelsOut ? 1 : 0,
                  transform: labelsOut ? "translateX(0)" : "translateX(8px)",
                  transition: `opacity 0.5s ${EASE} ${labelsOut ? i * 0.03 : 0}s, transform 0.5s ${EASE} ${
                    labelsOut ? i * 0.03 : 0
                  }s, color 0.4s ease`,
                }}
              >
                {s.label}
              </span>

              <span
                aria-hidden="true"
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  flexShrink: 0,
                  background: isActive
                    ? "#4A5E3A"
                    : isPast
                    ? "rgba(245,240,232,0.38)"
                    : "rgba(245,240,232,0.16)",
                  boxShadow: isActive ? "0 0 0 4px rgba(74,94,58,0.16)" : "0 0 0 0 rgba(74,94,58,0)",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                  transition: `background 0.45s ease, box-shadow 0.5s ${EASE}, transform 0.5s ${EASE}`,
                }}
              />
            </a>
          );
        })}
      </nav>

      {/* ── Narrow screens: hairline across the top ── */}
      <div
        aria-hidden="true"
        className="lg:hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          zIndex: 45,
          pointerEvents: "none",
          opacity: visible ? 1 : 0,
          transition: `opacity 0.6s ${EASE}`,
        }}
      >
        <span
          style={{
            display: "block",
            height: "100%",
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg, rgba(74,94,58,0.5), #4A5E3A)",
          }}
        />
      </div>
    </>
  );
}
