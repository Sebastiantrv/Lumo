"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DELIVERY_RANGES, LUMO_WHATSAPP, SESSION_MAX_AGE_MS } from "@/lib/constants";

/**
 * Configuración operativa de LUMO.
 *
 * Lee y escribe contra /api/admin/configuracion (tabla `configuracion`), la
 * misma fuente que ya usaban el bloque de Entregas en /admin y el chequeo de
 * capacidad en /api/mi-lumo/pedido. Las claves y sus formatos se respetan tal
 * cual: `capacidad_diaria` (número como texto) y `dias_entrega` (array JSON de
 * días 1-6, lunes a sábado).
 */

const DIAS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

export default function ConfiguracionPage() {
  const [capacidad, setCapacidad] = useState("");
  const [diasActivos, setDiasActivos] = useState<number[]>([1, 2, 3, 4, 5]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<"capacidad" | "dias" | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState<string | null>(null);

  // Borradores: no tocan el valor mostrado hasta que se guarda.
  const [draftCapacidad, setDraftCapacidad] = useState("");
  const [draftDias, setDraftDias] = useState<number[]>([]);

  async function load() {
    try {
      const res = await fetch("/api/admin/configuracion");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCapacidad(data.capacidad_diaria ?? "");
      if (data.dias_entrega) {
        try {
          const parsed = JSON.parse(data.dias_entrega);
          if (Array.isArray(parsed)) setDiasActivos(parsed);
        } catch {
          /* valor corrupto: se conservan los días por defecto */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la configuración");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function guardar(clave: string, valor: string) {
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
      setGuardado(clave);
      setTimeout(() => setGuardado(null), 2000);
      setEditando(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
      return false;
    } finally {
      setGuardando(false);
    }
  }

  async function guardarCapacidad() {
    const n = parseInt(draftCapacidad, 10);
    if (!Number.isFinite(n) || n < 1) {
      setError("La capacidad debe ser un número mayor a cero.");
      return;
    }
    if (await guardar("capacidad_diaria", String(n))) setCapacidad(String(n));
  }

  async function guardarDias() {
    if (draftDias.length === 0) {
      setError("Debe haber al menos un día de entrega activo.");
      return;
    }
    const ordenados = [...draftDias].sort((a, b) => a - b);
    if (await guardar("dias_entrega", JSON.stringify(ordenados))) setDiasActivos(ordenados);
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
          Lo que rige la operación diaria de LUMO. Lo que todavía vive en código aparece como solo lectura.
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
          descripcion="Máximo de botellas por día. El flujo de reserva de Mi LUMO rechaza pedidos que superen este número."
          accion={
            editando === "capacidad" ? (
              <BotonSecundario onClick={() => setEditando(null)} label="Cancelar" />
            ) : (
              <BotonSecundario
                onClick={() => {
                  setDraftCapacidad(capacidad);
                  setError(null);
                  setEditando("capacidad");
                }}
                label="Editar"
              />
            )
          }
          guardado={guardado === "capacidad_diaria"}
        >
          {editando === "capacidad" ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={1}
                value={draftCapacidad}
                onChange={(e) => setDraftCapacidad(e.target.value)}
                className="w-28 rounded-xl px-4 py-2.5 font-inter text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" }}
              />
              <span className="font-inter text-xs" style={{ color: "#555" }}>botellas</span>
              <BotonGuardar onClick={guardarCapacidad} disabled={guardando} />
            </div>
          ) : (
            <p className="font-cormorant text-2xl" style={{ color: "#F5F0E8" }}>
              {capacidad ? `${capacidad} botellas` : "Sin configurar"}
            </p>
          )}
        </Card>

        <Card
          titulo="Días activos de entrega"
          descripcion="Días en los que LUMO entrega. Las vistas de Semana y Compras siempre muestran lunes a sábado."
          accion={
            editando === "dias" ? (
              <BotonSecundario onClick={() => setEditando(null)} label="Cancelar" />
            ) : (
              <BotonSecundario
                onClick={() => {
                  setDraftDias(diasActivos);
                  setError(null);
                  setEditando("dias");
                }}
                label="Editar"
              />
            )
          }
          guardado={guardado === "dias_entrega"}
        >
          {editando === "dias" ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {DIAS.map((d) => {
                  const activo = draftDias.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      onClick={() =>
                        setDraftDias((prev) =>
                          prev.includes(d.value) ? prev.filter((x) => x !== d.value) : [...prev, d.value]
                        )
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
              <BotonGuardar onClick={guardarDias} disabled={guardando} />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {DIAS.map((d) => {
                const activo = diasActivos.includes(d.value);
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
          )}
        </Card>

        <CardLectura
          titulo="Hora límite de cambios"
          descripcion="Los clientes pueden cancelar o mover pedidos hasta esta hora del día anterior."
          valor="8:00 PM"
          nota="Este valor se administra desde código por ahora (isCutoffPassed en lib/dates.ts). Moverlo a configuración requiere volver asíncrona una función que hoy se evalúa de forma síncrona en Mi LUMO."
        />

        <CardLectura
          titulo="Rangos de entrega"
          descripcion="Opciones de hora estimada al marcar un pedido como envasado."
          valor={DELIVERY_RANGES.join(" · ")}
          nota="Este valor se administra desde código por ahora (DELIVERY_RANGES en lib/constants.ts)."
        />
      </Seccion>

      {/* ── Contacto ── */}
      <Seccion titulo="Contacto">
        <CardLectura
          titulo="WhatsApp de LUMO"
          descripcion="Número al que escriben los clientes desde Mi LUMO y desde el seguimiento de pedido."
          valor={`+${LUMO_WHATSAPP}`}
          nota="Este valor se administra desde código por ahora (LUMO_WHATSAPP en lib/constants.ts). Moverlo a Supabase implica un fallback en las páginas públicas: pendiente de decidir."
        />
      </Seccion>

      {/* ── Sistema ── */}
      <Seccion titulo="Sistema">
        <CardLectura
          titulo="Precios por fórmula"
          descripcion="El precio de cada fórmula ya se edita en Finanzas."
          enlace={{ href: "/admin/finanzas", label: "Ir a Finanzas" }}
        />
        <CardLectura
          titulo="Recetas y gramaje"
          descripcion="El gramaje por botella se edita en Recetas y alimenta el desglose de Hoy y la lista de Compras."
          enlace={{ href: "/admin/recetas", label: "Ir a Recetas" }}
        />
        <CardLectura
          titulo="Duración de sesión Mi LUMO"
          descripcion="Cuánto tiempo permanece válida la sesión de un cliente."
          valor={`${SESSION_MAX_AGE_MS / (24 * 60 * 60 * 1000)} días`}
          nota="Este valor se administra desde código por ahora (SESSION_MAX_AGE_MS en lib/constants.ts). Es compartido con la verificación de token del servidor."
        />
        <CardLectura
          titulo="Estados de pedido"
          descripcion="pendiente → confirmado → preparado (envasado) → entregado. Cancelado y eliminado se muestran en Hoy pero no cuentan para producción."
          nota="Este valor se administra desde código por ahora (ESTADOS en lib/constants.ts)."
        />
      </Seccion>
    </div>
  );
}

/* ── Bloques ── */

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
  accion,
  guardado,
  children,
}: {
  titulo: string;
  descripcion: string;
  accion?: React.ReactNode;
  guardado?: boolean;
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
            {guardado && (
              <span className="font-inter text-xs" style={{ color: "#6DBF67" }}>✓ Guardado</span>
            )}
          </div>
          <p className="font-inter text-xs mt-1 leading-relaxed" style={{ color: "#8A8A8A" }}>
            {descripcion}
          </p>
        </div>
        {accion}
      </div>
      {children}
    </article>
  );
}

function CardLectura({
  titulo,
  descripcion,
  valor,
  nota,
  enlace,
}: {
  titulo: string;
  descripcion: string;
  valor?: string;
  nota?: string;
  enlace?: { href: string; label: string };
}) {
  return (
    <article
      className="rounded-2xl p-5"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1" style={{ minWidth: "min(100%, 15rem)" }}>
          <p className="font-inter text-sm font-medium" style={{ color: "#F5F0E8" }}>{titulo}</p>
          <p className="font-inter text-xs mt-1 leading-relaxed" style={{ color: "#8A8A8A" }}>
            {descripcion}
          </p>
        </div>
        {enlace ? (
          <Link
            href={enlace.href}
            className="rounded-lg px-3 py-2 font-inter text-xs whitespace-nowrap"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#C0B8AE" }}
          >
            {enlace.label}
          </Link>
        ) : (
          <span className="font-inter text-xs whitespace-nowrap" style={{ color: "#555" }}>
            Solo lectura
          </span>
        )}
      </div>
      {valor && (
        <p className="font-cormorant text-2xl mt-3" style={{ color: "#F5F0E8" }}>{valor}</p>
      )}
      {nota && (
        <p className="font-inter text-xs mt-2.5 leading-relaxed" style={{ color: "#555" }}>{nota}</p>
      )}
    </article>
  );
}

function BotonSecundario({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg px-3 py-2 font-inter text-xs whitespace-nowrap"
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#C0B8AE" }}
    >
      {label}
    </button>
  );
}

function BotonGuardar({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg px-4 py-2.5 font-inter text-xs font-medium self-start"
      style={{
        background: "rgba(74,94,58,0.2)",
        color: "#6DBF67",
        border: "1px solid rgba(74,94,58,0.4)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {disabled ? "Guardando..." : "Guardar"}
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
