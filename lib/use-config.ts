"use client";

import { useEffect, useState } from "react";
import { CONFIG_DEFAULTS, LumoConfig, fetchConfig } from "@/lib/config";

/**
 * Configuración operativa en componentes cliente.
 *
 * Devuelve los defaults en el primer render y los reemplaza cuando llega la
 * respuesta de Supabase, así que nunca hay un estado sin valores: la UI se
 * pinta con el fallback de código y se corrige sola.
 */
export function useConfig(): { config: LumoConfig; cargando: boolean } {
  const [config, setConfig] = useState<LumoConfig>(CONFIG_DEFAULTS);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    fetchConfig().then((c) => {
      if (vigente) {
        setConfig(c);
        setCargando(false);
      }
    });
    return () => {
      vigente = false;
    };
  }, []);

  return { config, cargando };
}
