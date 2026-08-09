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

/**
 * Chapter vertical rhythm.
 *
 * Every seam is paddingBottom(A) + paddingTop(B) — two paddings compound
 * into one gap. Chapters therefore carry a modest top and an even smaller
 * bottom; the *next* chapter's top is what does the work of separating
 * them. Only the loud moments (the promise, the close) get extra room,
 * and only on one side each, so the air never doubles up.
 */
export const PAD = {
  chapterTop: "clamp(4rem, 9vw, 6.5rem)",
  chapterBottom: "clamp(2.75rem, 6vw, 4.5rem)",
  breakY: "clamp(2.5rem, 6vw, 4rem)",
  promiseTop: "clamp(5.5rem, 13vw, 9rem)",
  closeY: "clamp(6rem, 15vw, 11rem)",
} as const;
