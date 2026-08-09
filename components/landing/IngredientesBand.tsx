"use client";

import Image from "next/image";
import { useState } from "react";
import { useReveal, EASE } from "./Reveal";
import { PLANO, SEAM } from "./tokens";

/** Crop dimensions of /ingredientes-band.jpg. */
const BAND_W = 1536;
const BAND_H = 500;
/** Beyond this the band stops growing; the gutters are black on near-black. */
const BAND_MAX_W = 1700;

/**
 * Full-bleed breath opening the formulas chapter.
 *
 * The narrative runs a long way on type alone between the hero and the
 * closing frame; this is the one image inside it.
 *
 * The asset is pre-cropped to the ingredients themselves, and the frame
 * carries that exact aspect ratio, so `cover` never has anything to cut —
 * the three groups stay whole at every width. Its black ground is dissolved
 * into the plane with a vertical mask rather than meeting it as an edge.
 */
export default function IngredientesBand() {
  const [imgError, setImgError] = useState(false);
  const { ref, visible } = useReveal({ threshold: 0.15 });

  if (imgError) return null;

  const fade =
    "linear-gradient(to bottom, transparent 0%, #000 7%, #000 93%, transparent 100%)";

  return (
    <div
      ref={ref}
      style={{
        background: PLANO.base,
        borderTop: `1px solid ${SEAM}`,
        paddingTop: "clamp(3.5rem, 9vw, 6rem)",
        // The settling zoom below scales a full-bleed element past 100%.
        // Without this the page scrolls sideways for the length of the animation.
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: "#000",
          maskImage: fade,
          WebkitMaskImage: fade,
          opacity: visible ? 1 : 0,
          transition: `opacity 1.6s ${EASE}`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: BAND_MAX_W,
            margin: "0 auto",
            aspectRatio: `${BAND_W} / ${BAND_H}`,
            // Very slow settle, no bounce.
            transform: visible ? "scale(1)" : "scale(1.04)",
            transition: `transform 2.6s ${EASE}`,
          }}
        >
          <Image
            src="/ingredientes-band.jpg"
            alt="Ingredientes de las tres fórmulas LUMO: verde, rojo y tropical"
            fill
            loading="lazy"
            sizes={`(max-width: ${BAND_MAX_W}px) 100vw, ${BAND_MAX_W}px`}
            onError={() => setImgError(true)}
            style={{ objectFit: "cover" }}
          />
        </div>
      </div>

      <p
        className="font-inter uppercase text-center"
        style={{
          fontSize: 10,
          // Wide tracking makes this string nearly 700px; it needs room to
          // wrap rather than run into the edges of a small phone.
          letterSpacing: "0.24em",
          lineHeight: 1.9,
          padding: "0 1.5rem",
          color: "rgba(245,240,232,0.28)",
          marginTop: "clamp(0.75rem, 2.5vw, 1.5rem)",
          opacity: visible ? 1 : 0,
          transition: `opacity 1.2s ${EASE} 0.5s`,
        }}
      >
        Verde Fresco · Rojo Vital · Tropical Hydrate
      </p>
    </div>
  );
}
