/**
 * Configuración operativa de LUMO.
 *
 * Fuente de verdad: tabla `configuracion` (clave/valor) en Supabase, editable
 * desde /admin/configuracion. Los valores de lib/constants.ts pasan a ser el
 * fallback: si una clave no está guardada, o Supabase no responde, la app
 * sigue funcionando con el valor de código.
 *
 * Regla para agregar una clave nueva: debe tener un consumidor real y un
 * default sensato. Los valores que el código ramifica (estados, colores) no
 * viven aquí — cambiarlos no ajusta comportamiento, lo rompe.
 */

import { supabase } from "@/lib/supabase";
import { DELIVERY_RANGES, LUMO_WHATSAPP } from "@/lib/constants";

export type LumoConfig = {
  /** Máximo de botellas producibles por día. */
  capacidadDiaria: number | null;
  /** Días de entrega activos, 1 = lunes … 6 = sábado. */
  diasEntrega: number[];
  /** Hora (0-23) del día anterior hasta la que el cliente puede cancelar o mover. */
  horaLimiteCambios: number;
  /** Rangos de hora estimada de entrega ofrecidos al envasar. */
  rangosEntrega: string[];
  /** WhatsApp de contacto de LUMO, solo dígitos. */
  whatsappLumo: string;
};

export const CONFIG_DEFAULTS: LumoConfig = {
  capacidadDiaria: null,
  // Sin `dias_entrega` guardado, Mi LUMO ofrecía todos los días de lunes a
  // sábado. El default los mantiene todos activos para no cerrar el sábado
  // por accidente en instalaciones donde la clave nunca se guardó.
  diasEntrega: [1, 2, 3, 4, 5, 6],
  horaLimiteCambios: 20,
  rangosEntrega: [...DELIVERY_RANGES],
  whatsappLumo: LUMO_WHATSAPP,
};

/** Claves tal como viven en la tabla. */
export const CONFIG_KEYS = {
  capacidadDiaria: "capacidad_diaria",
  diasEntrega: "dias_entrega",
  horaLimiteCambios: "hora_limite_cambios",
  rangosEntrega: "rangos_entrega",
  whatsappLumo: "whatsapp_lumo",
} as const;

/**
 * Convierte las filas crudas de `configuracion` en un objeto tipado.
 * Cualquier valor ausente o mal formado cae al default sin lanzar.
 */
export function parseConfig(rows: { clave: string; valor: string | null }[]): LumoConfig {
  const raw = new Map(rows.map((r) => [r.clave, r.valor]));
  const config = { ...CONFIG_DEFAULTS };

  const capacidad = parseInt(raw.get(CONFIG_KEYS.capacidadDiaria) ?? "", 10);
  if (Number.isFinite(capacidad) && capacidad > 0) config.capacidadDiaria = capacidad;

  const dias = parseJsonArray(raw.get(CONFIG_KEYS.diasEntrega));
  if (dias) {
    const validos = dias.filter((d): d is number => typeof d === "number" && d >= 1 && d <= 6);
    if (validos.length > 0) config.diasEntrega = validos.sort((a, b) => a - b);
  }

  const hora = parseInt(raw.get(CONFIG_KEYS.horaLimiteCambios) ?? "", 10);
  if (Number.isFinite(hora) && hora >= 0 && hora <= 23) config.horaLimiteCambios = hora;

  const rangos = parseJsonArray(raw.get(CONFIG_KEYS.rangosEntrega));
  if (rangos) {
    const validos = rangos.filter((r): r is string => typeof r === "string" && r.trim().length > 0);
    if (validos.length > 0) config.rangosEntrega = validos;
  }

  const whatsapp = (raw.get(CONFIG_KEYS.whatsappLumo) ?? "").replace(/\D/g, "");
  if (whatsapp.length >= 10) config.whatsappLumo = whatsapp;

  return config;
}

function parseJsonArray(valor: string | null | undefined): unknown[] | null {
  if (!valor) return null;
  try {
    const parsed = JSON.parse(valor);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Lee la configuración con la clave anónima. Sirve tanto para páginas públicas
 * (Mi LUMO, seguimiento de pedido) como para el admin: son valores operativos,
 * no secretos. Ante cualquier error devuelve los defaults.
 */
export async function fetchConfig(): Promise<LumoConfig> {
  const { data, error } = await supabase.from("configuracion").select("clave, valor");
  if (error || !data) return { ...CONFIG_DEFAULTS };
  return parseConfig(data);
}

/** "20" → "8:00 PM". Para mostrar la hora límite en texto. */
export function formatHoraLimite(hora: number): string {
  const sufijo = hora >= 12 ? "PM" : "AM";
  const h12 = hora % 12 === 0 ? 12 : hora % 12;
  return `${h12}:00 ${sufijo}`;
}
