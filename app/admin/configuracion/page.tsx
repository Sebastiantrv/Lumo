"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { adminWrite } from "@/lib/admin-api";
import { LUMO_DOMAIN, POLL_INTERVAL_MS, SESSION_MAX_AGE_MS } from "@/lib/constants";
import { CONFIG_DEFAULTS, CONFIG_KEYS, LumoConfig, fetchConfig, formatHoraLimite } from "@/lib/config";

/**
 * Consola de configuración de LUMO.
 *
 * Escribe en la tabla `configuracion` vía /api/admin/configuracion (protegida
 * por el middleware) y en `formulas.precio` vía adminWrite. Lo que sigue en
 * código aparece en "Sistema" con el motivo: no es pereza, son valores que el
 * código ramifica o que definen una frontera de seguridad.
 */

const DIAS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

type Formula = { id: string; nombre: string; slug: string; color_acento: string; precio: number };

type Seccion = "capacidad" | "dias" | "hora" | "rangos" | "whatsapp" | "precios";

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<LumoConfig>(CONFIG_DEFAULTS);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<Seccion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState<Seccion | null>(null);

  const load = useCallback(async () => {
    const [conf, formulasRes] = await Promise.all([
      fetchConfig(),
      supabase.from("formulas").select("id, nombre, slug, color_acento, precio").order("nombre"),
    ]);
    setConfig(conf);
    setFormulas((formulasRes.data ?? []) as Formula[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Guarda una clave de `configuracion` y refresca desde la fuente. */
  async function guardarClave(clave: string, valor: string, seccion: Seccion) {
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/configuracion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave, valor }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConfig(await fetchConfig());
      setEditando(null);
      setGuardado(seccion);
      setTimeout(() => setGuardado(null), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarPrecios(precios: Record<string, number>) {
    setGuardando(true);
    setError(null);
    try {
      const results = await Promise.all(
        Object.entries(precios).map(([id, precio]) =>
          adminWrite("formulas", "update", { precio }, [{ column: "id", value: id }])
        )
      );
      const fallo = results.find((r) => !r.ok);
      if (fallo) throw new Error(fallo.error ?? "No se pudieron guardar los precios");
      await load();
      setEditando(null);
      setGuardado("precios");
      setTimeout(() => setGuardado(null), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setGuardando(false);
    }
  }

  function abrir(seccion: Seccion) {
    setError(null);
    setEditando(seccion);
  }

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <p className="font-inter text-xs uppercase tracking-widest mb-1" style={{ color: "#4A5E3A" }}>
          Configuración
        </p>
        <h1 className="font-cormorant font-light text-[#F5F0E8]" style={{ fontSize: "clamp(1.7rem, 6vw, 2.2rem)", lineHeight: 1.15 }}>
          Reglas operativas
        </h1>
        <p className="font-inter text-sm mt-1.5" style={{ color: "#8A8A8A" }}>
          Todo lo que define cómo opera LUMO, en un solo lugar.
        </p>
      </div>

      {error && (
        <div
          className="rounded-xl px-4 py-3 mb-5 font-inter text-xs"
          style={{ background: "rgba(224,80,112,0.1)", border: "1px solid rgba(224,80,112,0.28)", color: "#E05070" }}
        >
          {error}
        </div>
      )}

      {/* ── Entregas ── */}
      <Seccion titulo="Entregas">
        <Card
          titulo="Capacidad diaria"
          descripcion="Máximo de botellas por día. Mi LUMO rechaza reservas que superen este número."
          editando={editando === "capacidad"}
          guardado={guardado === "capacidad"}
          onEditar={() => abrir("capacidad")}
          onCancelar={() => setEditando(null)}
          valor={config.capacidadDiaria ? `${config.capacidadDiaria} botellas` : "Sin límite"}
        >
          <EditorCapacidad
            inicial={config.capacidadDiaria}
            guardando={guardando}
            onError={setError}
            onGuardar={(v) => guardarClave(CONFIG_KEYS.capacidadDiaria, v, "capacidad")}
          />
        </Card>

        <Card
          titulo="Días activos de entrega"
          descripcion="Días en los que LUMO entrega. Define qué fechas ofrece Mi LUMO al reservar."
          editando={editando === "dias"}
          guardado={guardado === "dias"}
          onEditar={() => abrir("dias")}
          onCancelar={() => setEditando(null)}
          valorNodo={<ChipsDias activos={config.diasEntrega} />}
        >
          <EditorDias
            inicial={config.diasEntrega}
            guardando={guardando}
            onError={setError}
            onGuardar={(v) => guardarClave(CONFIG_KEYS.diasEntrega, JSON.stringify(v), "dias")}
          />
        </Card>

        <Card
          titulo="Hora límite de cambios"
          descripcion="Hasta esta hora del día anterior, el cliente puede cancelar o mover su pedido desde el seguimiento."
          editando={editando === "hora"}
          guardado={guardado === "hora"}
          onEditar={() => abrir("hora")}
          onCancelar={() => setEditando(null)}
          valor={formatHoraLimite(config.horaLimiteCambios)}
        >
          <EditorHora
            inicial={config.horaLimiteCambios}
            guardando={guardando}
            onGuardar={(v) => guardarClave(CONFIG_KEYS.horaLimiteCambios, String(v), "hora")}
          />
        </Card>

        <Card
          titulo="Rangos de entrega"
          descripcion="Opciones de hora estimada que aparecen al marcar un pedido como envasado."
          editando={editando === "rangos"}
          guardado={guardado === "rangos"}
          onEditar={() => abrir("rangos")}
          onCancelar={() => setEditando(null)}
          valorNodo={
            <div className="flex flex-wrap gap-2">
              {config.rangosEntrega.map((r) => (
                <span
                  key={r}
                  className="rounded-lg px-3 py-1.5 font-inter text-xs"
                  style={{ background: "rgba(74,94,58,0.15)", color: "#6DBF67", border: "1px solid rgba(74,94,58,0.3)" }}
                >
                  {r}
                </span>
              ))}
            </div>
          }
        >
          <EditorRangos
            inicial={config.rangosEntrega}
            guardando={guardando}
            onError={setError}
            onGuardar={(v) => guardarClave(CONFIG_KEYS.rangosEntrega, JSON.stringify(v), "rangos")}
          />
        </Card>
      </Seccion>

      {/* ── Precios ── */}
      <Seccion titulo="Precios">
        <Card
          titulo="Precio por fórmula"
          descripcion="Precio unitario de cada botella. Finanzas lo usa para calcular ingresos."
          editando={editando === "precios"}
          guardado={guardado === "precios"}
          onEditar={() => abrir("precios")}
          onCancelar={() => setEditando(null)}
          valorNodo={
            formulas.length === 0 ? (
              <p className="font-inter text-sm" style={{ color: "#555" }}>Sin fórmulas registradas.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {formulas.map((f) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color_acento }} />
                      <span className="font-inter text-sm truncate" style={{ color: "#F5F0E8" }}>{f.nombre}</span>
                    </div>
                    <span className="font-cormorant text-lg shrink-0 ml-3" style={{ color: f.color_acento }}>
                      ${f.precio}
                    </span>
                  </div>
                ))}
              </div>
            )
          }
        >
          <EditorPrecios formulas={formulas} guardando={guardando} onError={setError} onGuardar={guardarPrecios} />
        </Card>
      </Seccion>

      {/* ── Contacto ── */}
      <Seccion titulo="Contacto">
        <Card
          titulo="WhatsApp de LUMO"
          descripcion="Número al que escriben los clientes desde Mi LUMO y desde el seguimiento de pedido."
          editando={editando === "whatsapp"}
          guardado={guardado === "whatsapp"}
          onEditar={() => abrir("whatsapp")}
          onCancelar={() => setEditando(null)}
          valor={`+${config.whatsappLumo}`}
        >
          <EditorWhatsApp
            inicial={config.whatsappLumo}
            guardando={guardando}
            onError={setError}
            onGuardar={(v) => guardarClave(CONFIG_KEYS.whatsappLumo, v, "whatsapp")}
          />
        </Card>
      </Seccion>

      {/* ── Sistema ── */}
      <Seccion titulo="Sistema">
        <p className="font-inter text-xs mb-1 -mt-1 leading-relaxed" style={{ color: "#555" }}>
          Estos valores viven en código a propósito: el código ramifica sobre ellos o definen
          una frontera de seguridad, así que cambiarlos en caliente rompería comportamiento en
          vez de ajustarlo.
        </p>
        <CardSistema
          titulo="Duración de sesión de Mi LUMO"
          valor={`${SESSION_MAX_AGE_MS / (24 * 60 * 60 * 1000)} días`}
          motivo="Frontera de autenticación: la comparte la verificación de token del servidor. Editarla desde el panel permitiría extender sesiones sin pasar por despliegue."
          donde="SESSION_MAX_AGE_MS · lib/constants.ts"
        />
        <CardSistema
          titulo="Estados de pedido"
          valor="pendiente → confirmado → preparado → entregado"
          motivo="El código ramifica sobre estos valores exactos. Agregar o renombrar uno requiere tocar las transiciones, no solo la configuración."
          donde="ESTADOS · lib/constants.ts"
        />
        <CardSistema
          titulo="Dominio público"
          valor={LUMO_DOMAIN}
          motivo="Va en los enlaces de seguimiento que se mandan por WhatsApp. Depende del despliegue, no de la operación."
          donde="LUMO_DOMAIN · lib/constants.ts"
        />
        <CardSistema
          titulo="Frecuencia de actualización"
          valor={`${POLL_INTERVAL_MS / 1000} s`}
          motivo="Cada cuánto refresca el seguimiento de pedido. Es ajuste de rendimiento, no una regla de negocio."
          donde="POLL_INTERVAL_MS · lib/constants.ts"
        />
      </Seccion>
    </div>
  );
}

/* ── Editores ── */

function EditorCapacidad({
  inicial,
  guardando,
  onError,
  onGuardar,
}: {
  inicial: number | null;
  guardando: boolean;
  onError: (e: string) => void;
  onGuardar: (v: string) => void;
}) {
  const [valor, setValor] = useState(inicial ? String(inicial) : "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={1}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-28 rounded-xl px-4 py-2.5 font-inter text-sm outline-none"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}
      />
      <span className="font-inter text-xs" style={{ color: "#555" }}>botellas por día</span>
      <BotonGuardar
        guardando={guardando}
        onClick={() => {
          const n = parseInt(valor, 10);
          if (!Number.isFinite(n) || n < 1) {
            onError("La capacidad debe ser un número mayor a cero.");
            return;
          }
          onGuardar(String(n));
        }}
      />
    </div>
  );
}

function EditorDias({
  inicial,
  guardando,
  onError,
  onGuardar,
}: {
  inicial: number[];
  guardando: boolean;
  onError: (e: string) => void;
  onGuardar: (v: number[]) => void;
}) {
  const [dias, setDias] = useState<number[]>(inicial);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {DIAS.map((d) => {
          const activo = dias.includes(d.value);
          return (
            <button
              key={d.value}
              onClick={() =>
                setDias((prev) => (prev.includes(d.value) ? prev.filter((x) => x !== d.value) : [...prev, d.value]))
              }
              className="w-11 h-11 rounded-xl font-inter text-xs font-medium transition-all"
              style={{
                background: activo ? "rgba(74,94,58,0.25)" : "rgba(255,255,255,0.04)",
                color: activo ? "#6DBF67" : "#555",
                border: activo ? "1px solid rgba(74,94,58,0.5)" : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      <BotonGuardar
        guardando={guardando}
        onClick={() => {
          if (dias.length === 0) {
            onError("Debe haber al menos un día de entrega activo.");
            return;
          }
          onGuardar([...dias].sort((a, b) => a - b));
        }}
      />
    </div>
  );
}

function EditorHora({
  inicial,
  guardando,
  onGuardar,
}: {
  inicial: number;
  guardando: boolean;
  onGuardar: (v: number) => void;
}) {
  const [hora, setHora] = useState(inicial);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {[16, 17, 18, 19, 20, 21, 22].map((h) => (
          <button
            key={h}
            onClick={() => setHora(h)}
            className="rounded-xl px-3 py-2.5 font-inter text-xs font-medium transition-all"
            style={{
              background: hora === h ? "rgba(74,94,58,0.25)" : "rgba(255,255,255,0.04)",
              color: hora === h ? "#6DBF67" : "#8A8A8A",
              border: hora === h ? "1px solid rgba(74,94,58,0.5)" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {formatHoraLimite(h)}
          </button>
        ))}
      </div>
      <p className="font-inter text-xs" style={{ color: "#555" }}>
        Se aplica al día anterior a la entrega, hora de Ciudad de México.
      </p>
      <BotonGuardar guardando={guardando} onClick={() => onGuardar(hora)} />
    </div>
  );
}

function EditorRangos({
  inicial,
  guardando,
  onError,
  onGuardar,
}: {
  inicial: string[];
  guardando: boolean;
  onError: (e: string) => void;
  onGuardar: (v: string[]) => void;
}) {
  const [rangos, setRangos] = useState<string[]>(inicial);

  function actualizar(i: number, v: string) {
    setRangos((prev) => prev.map((r, idx) => (idx === i ? v : r)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {rangos.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={r}
              onChange={(e) => actualizar(i, e.target.value)}
              placeholder="6:30 - 7:00"
              className="flex-1 rounded-xl px-4 py-2.5 font-inter text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}
            />
            <button
              onClick={() => setRangos((prev) => prev.filter((_, idx) => idx !== i))}
              aria-label={`Quitar rango ${r || i + 1}`}
              className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: "rgba(122,32,48,0.1)", border: "1px solid rgba(122,32,48,0.2)", color: "#7A2030" }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => setRangos((prev) => [...prev, ""])}
        className="self-start rounded-lg px-3 py-2 font-inter text-xs"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#C0B8AE" }}
      >
        + Agregar rango
      </button>
      <BotonGuardar
        guardando={guardando}
        onClick={() => {
          const limpios = rangos.map((r) => r.trim()).filter(Boolean);
          if (limpios.length === 0) {
            onError("Debe quedar al menos un rango de entrega.");
            return;
          }
          onGuardar(limpios);
        }}
      />
    </div>
  );
}

function EditorWhatsApp({
  inicial,
  guardando,
  onError,
  onGuardar,
}: {
  inicial: string;
  guardando: boolean;
  onError: (e: string) => void;
  onGuardar: (v: string) => void;
}) {
  const [valor, setValor] = useState(inicial);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="5215542779362"
          inputMode="tel"
          className="flex-1 rounded-xl px-4 py-2.5 font-inter text-sm outline-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", minWidth: "12rem" }}
        />
        <BotonGuardar
          guardando={guardando}
          onClick={() => {
            const digitos = valor.replace(/\D/g, "");
            if (digitos.length < 10) {
              onError("El número debe incluir lada y país, por ejemplo 5215542779362.");
              return;
            }
            onGuardar(digitos);
          }}
        />
      </div>
      <p className="font-inter text-xs" style={{ color: "#555" }}>
        Formato internacional sin símbolos. Si queda vacío o inválido, se usa el número de código.
      </p>
    </div>
  );
}

function EditorPrecios({
  formulas,
  guardando,
  onError,
  onGuardar,
}: {
  formulas: Formula[];
  guardando: boolean;
  onError: (e: string) => void;
  onGuardar: (precios: Record<string, number>) => void;
}) {
  const [precios, setPrecios] = useState<Record<string, string>>(
    Object.fromEntries(formulas.map((f) => [f.id, String(f.precio ?? 0)]))
  );

  return (
    <div className="flex flex-col gap-3">
      {formulas.map((f) => (
        <div key={f.id} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color_acento }} />
            <span className="font-inter text-sm truncate" style={{ color: "#F5F0E8" }}>{f.nombre}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-inter text-sm" style={{ color: "#8A8A8A" }}>$</span>
            <input
              type="number"
              min={0}
              step="1"
              value={precios[f.id] ?? ""}
              onChange={(e) => setPrecios((prev) => ({ ...prev, [f.id]: e.target.value }))}
              className="w-24 rounded-xl px-3 py-2.5 font-inter text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}
            />
          </div>
        </div>
      ))}
      <BotonGuardar
        guardando={guardando}
        onClick={() => {
          const parsed: Record<string, number> = {};
          for (const f of formulas) {
            const n = Number(precios[f.id]);
            if (!Number.isFinite(n) || n < 0) {
              onError(`El precio de ${f.nombre} no es válido.`);
              return;
            }
            parsed[f.id] = n;
          }
          onGuardar(parsed);
        }}
      />
    </div>
  );
}

/* ── Presentación ── */

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="font-inter text-xs uppercase tracking-widest mb-3" style={{ color: "#8A8A8A" }}>
        {titulo}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Card({
  titulo,
  descripcion,
  valor,
  valorNodo,
  editando,
  guardado,
  onEditar,
  onCancelar,
  children,
}: {
  titulo: string;
  descripcion: string;
  valor?: string;
  valorNodo?: React.ReactNode;
  editando: boolean;
  guardado: boolean;
  onEditar: () => void;
  onCancelar: () => void;
  children: React.ReactNode;
}) {
  return (
    <article
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1" style={{ minWidth: "min(100%, 15rem)" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-inter text-sm font-medium" style={{ color: "#F5F0E8" }}>{titulo}</p>
            {guardado && <span className="font-inter text-xs" style={{ color: "#6DBF67" }}>✓ Guardado</span>}
          </div>
          <p className="font-inter text-xs mt-1 leading-relaxed" style={{ color: "#8A8A8A" }}>{descripcion}</p>
        </div>
        <button
          onClick={editando ? onCancelar : onEditar}
          className="rounded-lg px-3 py-2 font-inter text-xs whitespace-nowrap"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#C0B8AE" }}
        >
          {editando ? "Cancelar" : "Editar"}
        </button>
      </div>

      {editando ? (
        children
      ) : valorNodo ? (
        valorNodo
      ) : (
        <p className="font-cormorant text-2xl" style={{ color: "#F5F0E8" }}>{valor}</p>
      )}
    </article>
  );
}

function CardSistema({
  titulo,
  valor,
  motivo,
  donde,
}: {
  titulo: string;
  valor: string;
  motivo: string;
  donde: string;
}) {
  return (
    <article
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1" style={{ minWidth: "min(100%, 15rem)" }}>
          <p className="font-inter text-sm font-medium" style={{ color: "#F5F0E8" }}>{titulo}</p>
          <p className="font-inter text-sm mt-1" style={{ color: "#C0B8AE" }}>{valor}</p>
        </div>
        <span className="font-inter text-xs whitespace-nowrap" style={{ color: "#555" }}>En código</span>
      </div>
      <p className="font-inter text-xs mt-2.5 leading-relaxed" style={{ color: "#8A8A8A" }}>{motivo}</p>
      <p className="font-inter text-xs mt-1.5" style={{ color: "#444" }}>{donde}</p>
    </article>
  );
}

function ChipsDias({ activos }: { activos: number[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {DIAS.map((d) => {
        const activo = activos.includes(d.value);
        return (
          <span
            key={d.value}
            className="rounded-lg px-3 py-1.5 font-inter text-xs"
            style={{
              background: activo ? "rgba(74,94,58,0.2)" : "rgba(255,255,255,0.03)",
              color: activo ? "#6DBF67" : "#555",
              border: activo ? "1px solid rgba(74,94,58,0.4)" : "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {d.label}
          </span>
        );
      })}
    </div>
  );
}

function BotonGuardar({ onClick, guardando }: { onClick: () => void; guardando: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={guardando}
      className="rounded-lg px-4 py-2.5 font-inter text-xs font-medium self-start"
      style={{
        background: "rgba(74,94,58,0.2)",
        color: "#6DBF67",
        border: "1px solid rgba(74,94,58,0.4)",
        opacity: guardando ? 0.5 : 1,
      }}
    >
      {guardando ? "Guardando..." : "Guardar"}
    </button>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div
        className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "#4A5E3A", borderTopColor: "transparent" }}
      />
    </div>
  );
}
