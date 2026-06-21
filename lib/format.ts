export function fmtGramos(g: number, unidad = "g"): string {
  if (unidad === "g") return g >= 1000 ? `${(g / 1000).toFixed(g >= 10000 ? 1 : 2)} kg` : `${Math.round(g)} g`;
  return `${g} ${unidad}`;
}
