/**
 * Surface planes for the landing narrative.
 *
 * Chapters alternate between `base` and `raised` so a change of background
 * marks a change of subject. Each stripe runs well over a screen tall, so two
 * boundaries are never visible at once — it reads as "new chapter", not stripes.
 */
export const PLANO = {
  base: "#0D0D0D",
  raised: "#141414",
  deep: "#060606",
} as const;

export type Plano = keyof typeof PLANO;

/** Hairline drawn at the top of each chapter, on top of the plane change. */
export const SEAM = "rgba(245,240,232,0.07)";
