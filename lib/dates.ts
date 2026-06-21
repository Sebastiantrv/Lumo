const TZ = "America/Mexico_City";

export function localStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayStr(): string {
  return localStr(new Date());
}

export function addDays(base: string, n: number): string {
  const d = new Date(base + "T12:00:00");
  d.setDate(d.getDate() + n);
  return localStr(d);
}

export function formatDateLabel(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

export function formatHora(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

export function formatCreatedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    timeZone: TZ,
  });
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function getWeekRange(offset = 0) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  return {
    inicio: localStr(monday),
    fin: localStr(saturday),
    label: `${formatDateShort(localStr(monday))} – ${formatDateShort(localStr(saturday))}`,
  };
}

export function getWeekDays(offset = 0): string[] {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return localStr(d);
  });
}

export function getTipoPedido(diaEntrega: string): "normal" | "domingo" | "extra" {
  const hoy = new Date();
  const dow = hoy.getDay();
  if (dow === 0) return "domingo";
  if (dow === 6) return "normal";
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - dow + 1);
  const sabado = new Date(lunes);
  sabado.setDate(lunes.getDate() + 5);
  if (diaEntrega >= localStr(lunes) && diaEntrega <= localStr(sabado)) return "extra";
  return "normal";
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function isCutoffPassed(diaEntrega: string): boolean {
  const now = new Date();
  const mexicoOffset = -6;
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  const mexicoNow = new Date(utcNow + mexicoOffset * 3600000);
  const [y, m, d] = diaEntrega.split("-").map(Number);
  const cutoff = new Date(y, m - 1, d - 1, 20, 0, 0, 0);
  return mexicoNow >= cutoff;
}
