"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

/* ── Design tokens ── */
const T = {
  text:       "#1A1A1A",
  textSub:    "#6A6A6A",
  textMuted:  "#9A9A9A",
  border:     "rgba(0,0,0,0.10)",
  cardBg:     "rgba(255,255,255,0.65)",
  cardBorder: "rgba(0,0,0,0.08)",
  btnPrimary: "#0D0D0D",
  btnText:    "#F4EFE7",
  green:      "#4A5E3A",
  red:        "#7A2030",
  error:      "#7A2030",
};

type FormData = {
  nombre: string;
  sabor_rating: number;
  sensacion_sabor: string;
  frescura_rating: number;
  experiencia_lumo: string;
  recomendacion: string[];
  precio_justo: string;
  razon_adopcion: string[];
  mejora_abierta: string;
};

const TOTAL_STEPS = 9;

const SENSACION_OPTIONS = [
  "Fresco y ligero",
  "Naturalmente dulce",
  "Intenso / con carácter",
  "Muy cítrico",
  "Bien balanceado",
];

const EXPERIENCIA_OPTIONS = [
  "Muy premium",
  "Cuidada y diferente",
  "Buena, pero simple",
  "Normal",
];

const RECOMENDACION_OPTIONS = [
  "A alguien que entrena",
  "A alguien que trabaja en oficina",
  "A alguien que quiere desayunar más ligero",
  "A alguien que cuida lo que consume",
  "A alguien que busca algo práctico por la mañana",
  "No lo recomendaría todavía",
];

const PRECIO_OPTIONS = ["$75", "$85", "$95+"];

const RAZON_OPTIONS = [
  "Cuidar mejor lo que consumo",
  "Ahorrar tiempo en la mañana",
  "Tener algo fresco antes de empezar el día",
  "Complementar mi rutina de ejercicio",
  "Sentir que empiezo el día mejor",
  "No lo integraría a mi rutina por ahora",
];

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div style={{ background: "#F4EFE7", minHeight: "100svh" }} />}>
      <FeedbackContent />
    </Suspense>
  );
}

function FeedbackContent() {
  const searchParams = useSearchParams();
  const pedidoToken = searchParams.get("pedido") ?? undefined;
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [clientName, setClientName] = useState("");
  const [numeroPedido, setNumeroPedido] = useState<number | null>(null);
  const [existingFeedback, setExistingFeedback] = useState(false);
  const [addendum, setAddendum] = useState("");
  const [addendumSent, setAddendumSent] = useState(false);
  const [data, setData] = useState<FormData>({
    nombre: "",
    sabor_rating: 0,
    sensacion_sabor: "",
    frescura_rating: 0,
    experiencia_lumo: "",
    recomendacion: [],
    precio_justo: "",
    razon_adopcion: [],
    mejora_abierta: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!pedidoToken) return;
    (async () => {
      const { data: pedido } = await supabase
        .from("pedidos")
        .select("clientes(nombre), numero_pedido")
        .eq("token", pedidoToken)
        .single();
      const nombre = (pedido as { clientes: { nombre: string } | null; numero_pedido: number | null } | null)?.clientes?.nombre;
      const numPedido = (pedido as { numero_pedido: number | null } | null)?.numero_pedido ?? null;
      if (nombre) {
        setClientName(nombre);
        setData((d) => ({ ...d, nombre }));
      }
      if (numPedido) setNumeroPedido(numPedido);

      const { data: existing } = await supabase
        .from("feedback")
        .select("id")
        .eq("pedido_token", pedidoToken)
        .limit(1);
      if (existing && existing.length > 0) setExistingFeedback(true);
    })();
  }, [pedidoToken]);

  function goTo(next: number, dir: "forward" | "backward") {
    setDirection(dir);
    setAnimKey((k) => k + 1);
    setStep(next);
    setErrors({});
  }

  function next() {
    if (!validate()) return;
    if (step === 9) {
      submit();
      return;
    }
    goTo(step + 1, "forward");
  }

  function back() {
    goTo(step - 1, "backward");
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (step === 1 && !data.nombre.trim()) e.nombre = "Ingresa tu nombre.";
    if (step === 2 && !data.sabor_rating) e.sabor_rating = "Selecciona una calificación.";
    if (step === 3 && !data.sensacion_sabor) e.sensacion_sabor = "Selecciona una opción.";
    if (step === 4 && !data.frescura_rating) e.frescura_rating = "Selecciona una calificación.";
    if (step === 5 && !data.experiencia_lumo) e.experiencia_lumo = "Selecciona una opción.";
    if (step === 6 && data.recomendacion.length === 0) e.recomendacion = "Selecciona al menos una opción.";
    if (step === 7 && !data.precio_justo) e.precio_justo = "Selecciona una opción.";
    if (step === 8 && data.razon_adopcion.length === 0) e.razon_adopcion = "Selecciona al menos una opción.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    const payload = {
      ...data,
      pedido_token: pedidoToken || null,
      numero_pedido: numeroPedido || null,
      recomendacion: data.recomendacion.join(" | "),
      razon_adopcion: data.razon_adopcion.join(" | "),
      mejora_abierta: data.mejora_abierta.trim() || null,
      submitted_at: new Date().toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error("Submit error:", e);
    }
    goTo(10, "forward");
  }

  const animStyle = {
    animation: `${direction === "forward" ? "stepInRight" : "stepInLeft"} 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
  };

  return (
    <>
      <style>{`
        @keyframes stepInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes stepInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>

      <main style={{ background: "#F4EFE7", minHeight: "100svh" }}>
      <header>
        <Navbar theme="light" />
      </header>
      <section
        className="px-5 md:px-12 pt-28 pb-14 md:pt-32 md:pb-24 flex flex-col items-center"
        aria-label="Formulario de feedback"
      >
        <div className="w-full max-w-md flex flex-col gap-6">
          {/* Progress bar */}
          {step >= 1 && step <= TOTAL_STEPS && (
            <div className="flex flex-col gap-2">
              <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.10)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(step / TOTAL_STEPS) * 100}%`, backgroundColor: T.green }}
                />
              </div>
              <p className="font-inter text-xs text-right" style={{ color: T.textMuted }}>
                {step} / {TOTAL_STEPS}
              </p>
            </div>
          )}

          {/* Already submitted */}
          {existingFeedback && step === 0 && (
            <div className="flex flex-col gap-6" style={{ animation: "stepInRight 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
              <div className="flex flex-col gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(74,94,58,0.12)", border: "1.5px solid #4A5E3A" }}
                >
                  <CheckIcon />
                </div>
                <h2
                  className="font-cormorant font-light"
                  style={{ fontSize: "clamp(2rem, 8vw, 3rem)", lineHeight: 1.1, color: T.text }}
                >
                  Ya recibimos tu retroalimentación{numeroPedido ? ` del pedido #${numeroPedido}` : ""}.
                </h2>
                <p className="font-inter leading-relaxed" style={{ fontSize: "clamp(0.85rem, 3.3vw, 1rem)", color: T.textSub }}>
                  Si quieres agregar algo más, escríbelo aquí abajo.
                </p>
              </div>
              {addendumSent ? (
                <div className="flex flex-col gap-4 items-center">
                  <p className="font-inter text-sm" style={{ color: T.green }}>Comentario adicional enviado. Gracias.</p>
                  <Link
                    href="/mi-lumo"
                    className="w-full inline-flex items-center justify-between font-inter font-medium rounded-full spring-press"
                    style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)", padding: "0.9rem 1.5rem", background: T.btnPrimary, color: T.btnText }}
                  >
                    Volver a LUMO <span aria-hidden="true">→</span>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <LightTextarea
                    placeholder="Comentario adicional (opcional)"
                    value={addendum}
                    onChange={setAddendum}
                  />
                  <button
                    onClick={async () => {
                      if (!addendum.trim()) return;
                      try {
                        await fetch("/api/feedback", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ pedido_token: pedidoToken, addendum: addendum.trim() }),
                        });
                      } catch {}
                      setAddendumSent(true);
                    }}
                    disabled={!addendum.trim()}
                    className="w-full inline-flex items-center justify-between font-inter font-medium rounded-full spring-press disabled:opacity-40"
                    style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)", padding: "0.9rem 1.5rem", background: T.btnPrimary, color: T.btnText }}
                  >
                    Enviar comentario <span aria-hidden="true">→</span>
                  </button>
                  <Link
                    href="/mi-lumo"
                    className="w-full inline-flex items-center justify-center font-inter spring-press py-2"
                    style={{ fontSize: "clamp(0.82rem, 3.2vw, 0.95rem)", color: T.textSub }}
                  >
                    ← Volver a LUMO
                  </Link>
                </div>
              )}
            </div>
          )}

          {(!existingFeedback || step > 0) && <div key={animKey} style={animStyle}>
            {/* 0: Intro */}
            {step === 0 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <h2
                    className="font-cormorant font-light"
                    style={{ fontSize: "clamp(2.6rem, 10vw, 3.8rem)", lineHeight: 1.1, color: T.text }}
                  >
                    Gracias por probar LUMO.
                  </h2>
                  <p
                    className="font-inter leading-relaxed"
                    style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)", color: T.textSub }}
                  >
                    Tu opinión nos ayuda a ajustar sabor, presentación y experiencia antes del lanzamiento formal.
                  </p>
                </div>
                <button
                  onClick={() => goTo(clientName ? 2 : 1, "forward")}
                  className="w-full inline-flex items-center justify-between font-inter font-medium rounded-full spring-press"
                  style={{
                    fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)",
                    padding: "0.9rem 1.5rem",
                    background: T.btnPrimary,
                    color: T.btnText,
                  }}
                >
                  Comenzar <span aria-hidden="true">→</span>
                </button>
              </div>
            )}

            {/* 1: Nombre */}
            {step === 1 && (
              <StepShell label="¿Cómo te llamas?" onNext={next} onBack={back} showBack={false}>
                <LightInput
                  placeholder="Nombre"
                  value={data.nombre}
                  onChange={(v) => setData((d) => ({ ...d, nombre: v }))}
                  error={errors.nombre}
                  onEnter={next}
                  autoFocus
                />
              </StepShell>
            )}

            {/* 2: Sabor rating */}
            {step === 2 && (
              <StepShell label="¿Cómo calificarías el sabor?" onNext={next} onBack={back}>
                {errors.sabor_rating && (
                  <p className="font-inter text-xs mb-1" style={{ color: T.error }} role="alert">
                    {errors.sabor_rating}
                  </p>
                )}
                <RatingPills
                  value={data.sabor_rating}
                  onChange={(v) => setData((d) => ({ ...d, sabor_rating: v }))}
                  leftLabel="No me encantó"
                  rightLabel="Excelente"
                />
              </StepShell>
            )}

            {/* 3: Sensación sabor */}
            {step === 3 && (
              <StepShell label="¿Qué describiría mejor el sabor?" onNext={next} onBack={back}>
                {errors.sensacion_sabor && (
                  <p className="font-inter text-xs mb-1" style={{ color: T.error }} role="alert">
                    {errors.sensacion_sabor}
                  </p>
                )}
                <OptionCards
                  options={SENSACION_OPTIONS}
                  value={data.sensacion_sabor}
                  onChange={(v) => setData((d) => ({ ...d, sensacion_sabor: v }))}
                />
              </StepShell>
            )}

            {/* 4: Frescura rating */}
            {step === 4 && (
              <StepShell label="¿Qué tan fresco lo sentiste?" onNext={next} onBack={back}>
                {errors.frescura_rating && (
                  <p className="font-inter text-xs mb-1" style={{ color: T.error }} role="alert">
                    {errors.frescura_rating}
                  </p>
                )}
                <RatingPills
                  value={data.frescura_rating}
                  onChange={(v) => setData((d) => ({ ...d, frescura_rating: v }))}
                  leftLabel="Normal"
                  rightLabel="Muy fresco"
                />
              </StepShell>
            )}

            {/* 5: Experiencia LUMO */}
            {step === 5 && (
              <StepShell label="¿Cómo percibiste la experiencia LUMO?" onNext={next} onBack={back}>
                {errors.experiencia_lumo && (
                  <p className="font-inter text-xs mb-1" style={{ color: T.error }} role="alert">
                    {errors.experiencia_lumo}
                  </p>
                )}
                <OptionCards
                  options={EXPERIENCIA_OPTIONS}
                  value={data.experiencia_lumo}
                  onChange={(v) => setData((d) => ({ ...d, experiencia_lumo: v }))}
                />
              </StepShell>
            )}

            {/* 6: Recomendación (max 2) */}
            {step === 6 && (
              <StepShell label="¿A quién se lo recomendarías?" sublabel="Selecciona hasta 2 opciones." onNext={next} onBack={back}>
                {errors.recomendacion && (
                  <p className="font-inter text-xs mb-1" style={{ color: T.error }} role="alert">
                    {errors.recomendacion}
                  </p>
                )}
                <MultiOptionCards
                  options={RECOMENDACION_OPTIONS}
                  value={data.recomendacion}
                  max={2}
                  onChange={(v) => setData((d) => ({ ...d, recomendacion: v }))}
                />
              </StepShell>
            )}

            {/* 7: Precio justo */}
            {step === 7 && (
              <StepShell label="¿Qué precio sentirías justo por una botella de LUMO?" onNext={next} onBack={back}>
                {errors.precio_justo && (
                  <p className="font-inter text-xs mb-1" style={{ color: T.error }} role="alert">
                    {errors.precio_justo}
                  </p>
                )}
                <OptionCards
                  options={PRECIO_OPTIONS}
                  value={data.precio_justo}
                  onChange={(v) => setData((d) => ({ ...d, precio_justo: v }))}
                />
              </StepShell>
            )}

            {/* 8: Razón de adopción (max 2) */}
            {step === 8 && (
              <StepShell label="Si LUMO formara parte de tu mañana, ¿cuál sería la razón principal?" sublabel="Selecciona hasta 2 opciones." onNext={next} onBack={back}>
                {errors.razon_adopcion && (
                  <p className="font-inter text-xs mb-1" style={{ color: T.error }} role="alert">
                    {errors.razon_adopcion}
                  </p>
                )}
                <MultiOptionCards
                  options={RAZON_OPTIONS}
                  value={data.razon_adopcion}
                  max={2}
                  onChange={(v) => setData((d) => ({ ...d, razon_adopcion: v }))}
                />
              </StepShell>
            )}

            {/* 9: Mejora abierta (optional) */}
            {step === 9 && (
              <StepShell
                label="¿Qué ajustarías para hacerlo mejor?"
                sublabel="Sabor, intensidad, tamaño, presentación, entrega…"
                onNext={next}
                onBack={back}
                nextLabel="Enviar feedback →"
              >
                <LightTextarea
                  placeholder="Tu comentario (opcional)"
                  value={data.mejora_abierta}
                  onChange={(v) => setData((d) => ({ ...d, mejora_abierta: v }))}
                />
              </StepShell>
            )}

            {/* 10: Confirmación */}
            {step === 10 && (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-5">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(74,94,58,0.12)", border: "1.5px solid #4A5E3A" }}
                  >
                    <CheckIcon />
                  </div>

                  <h2
                    className="font-cormorant font-light"
                    style={{ fontSize: "clamp(2.4rem, 9.5vw, 3.6rem)", lineHeight: 1.1, color: T.text }}
                  >
                    Gracias por formar parte del primer piloto de LUMO.
                  </h2>

                  <p
                    className="font-inter leading-relaxed"
                    style={{ fontSize: "clamp(0.85rem, 3.3vw, 1rem)", color: T.textSub }}
                  >
                    Tu feedback ayuda a construir los siguientes lotes.
                  </p>

                  <Link
                    href="/mi-lumo"
                    className="w-full inline-flex items-center justify-between font-inter font-medium rounded-full spring-press"
                    style={{
                      fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)",
                      padding: "0.9rem 1.5rem",
                      background: T.btnPrimary,
                      color: T.btnText,
                    }}
                  >
                    Volver a Mi LUMO <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            )}
          </div>}
        </div>
      </section>
      </main>
    </>
  );
}

/* ── Step shell ── */
function StepShell({
  label,
  sublabel,
  children,
  onNext,
  onBack,
  showBack = true,
  nextLabel = "Continuar →",
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  showBack?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h2
          className="font-cormorant font-light"
          style={{ fontSize: "clamp(2rem, 8vw, 3rem)", lineHeight: 1.15, color: "#1A1A1A" }}
        >
          {label}
        </h2>
        {sublabel && (
          <p className="font-inter" style={{ fontSize: "clamp(0.78rem, 3vw, 0.9rem)", color: "#6A6A6A" }}>
            {sublabel}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
      <div className="flex flex-col gap-3">
        <button
          onClick={onNext}
          className="w-full inline-flex items-center justify-between font-inter font-medium rounded-full spring-press"
          style={{
            fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)",
            padding: "0.9rem 1.5rem",
            background: "#0D0D0D",
            color: "#F4EFE7",
          }}
        >
          {nextLabel} <span aria-hidden="true">{nextLabel.includes("→") ? "" : "→"}</span>
        </button>
        {showBack && (
          <button
            onClick={onBack}
            className="w-full inline-flex items-center justify-center font-inter spring-press py-2"
            style={{ fontSize: "clamp(0.82rem, 3.2vw, 0.95rem)", color: "#6A6A6A" }}
          >
            ← Regresar
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Rating pills (1-5) ── */
function RatingPills({
  value,
  onChange,
  leftLabel,
  rightLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3 justify-center">
        {[1, 2, 3, 4, 5].map((n) => {
          const sel = value === n;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="w-12 h-12 rounded-full font-inter font-medium transition-all spring-press flex items-center justify-center"
              style={{
                fontSize: "1rem",
                background: sel ? "rgba(74,94,58,0.12)" : "rgba(255,255,255,0.65)",
                border: sel ? "1.5px solid #4A5E3A" : "1px solid rgba(0,0,0,0.08)",
                color: sel ? "#4A5E3A" : "#6A6A6A",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow: sel ? "0 0 20px rgba(74,94,58,0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between px-1">
        <span className="font-inter" style={{ fontSize: "clamp(0.7rem, 2.5vw, 0.78rem)", color: "#9A9A9A" }}>
          {leftLabel}
        </span>
        <span className="font-inter" style={{ fontSize: "clamp(0.7rem, 2.5vw, 0.78rem)", color: "#9A9A9A" }}>
          {rightLabel}
        </span>
      </div>
    </div>
  );
}

/* ── Option cards (single select) ── */
function OptionCards({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => {
        const sel = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="w-full text-left px-5 py-4 rounded-2xl font-inter transition-all spring-press"
            style={{
              fontSize: "clamp(0.88rem, 3.4vw, 1rem)",
              background: sel ? "rgba(74,94,58,0.12)" : "rgba(255,255,255,0.65)",
              border: sel ? "1.5px solid #4A5E3A" : "1px solid rgba(0,0,0,0.08)",
              color: sel ? "#4A5E3A" : "#6A6A6A",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: sel ? "0 0 20px rgba(74,94,58,0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
              fontWeight: sel ? 500 : 400,
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ── Multi-select option cards (max N) ── */
function MultiOptionCards({
  options,
  value,
  max,
  onChange,
}: {
  options: string[];
  value: string[];
  max: number;
  onChange: (v: string[]) => void;
}) {
  function toggle(opt: string) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else if (value.length < max) {
      onChange([...value, opt]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map((opt) => {
        const isFirst = value[0] === opt;
        const isSecond = value.length > 1 && value[1] === opt;
        const sel = value.includes(opt);
        const disabled = !sel && value.length >= max;

        return (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            disabled={disabled}
            className="w-full text-left px-5 py-4 rounded-2xl font-inter transition-all spring-press"
            style={{
              fontSize: "clamp(0.88rem, 3.4vw, 1rem)",
              background: sel
                ? "rgba(74,94,58,0.12)"
                : "rgba(255,255,255,0.65)",
              border: sel
                ? "1.5px solid #4A5E3A"
                : "1px solid rgba(0,0,0,0.08)",
              color: sel
                ? "#4A5E3A"
                : disabled
                ? "#C0C0C0"
                : "#6A6A6A",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: sel ? "0 0 20px rgba(74,94,58,0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
              fontWeight: sel ? 500 : 400,
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? "default" : "pointer",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ── Light input ── */
function LightInput({
  placeholder,
  value,
  onChange,
  error,
  onEnter,
  autoFocus,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  onEnter?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        className="w-full rounded-2xl px-5 py-4 font-inter outline-none"
        style={{
          fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)",
          color: "#1A1A1A",
          background: "rgba(255,255,255,0.7)",
          border: error ? "1px solid rgba(122,32,48,0.5)" : "1px solid rgba(0,0,0,0.10)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(0,0,0,0.30)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "rgba(122,32,48,0.5)" : "rgba(0,0,0,0.10)";
        }}
      />
      {error && (
        <p className="font-inter text-xs px-1" style={{ color: "#7A2030" }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Light textarea ── */
function LightTextarea({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={4}
      className="w-full rounded-2xl px-5 py-4 font-inter outline-none resize-none"
      style={{
        fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)",
        color: "#1A1A1A",
        background: "rgba(255,255,255,0.7)",
        border: "1px solid rgba(0,0,0,0.10)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        transition: "border-color 0.2s ease",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,0,0,0.30)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,0,0,0.10)";
      }}
    />
  );
}

function CheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4A5E3A"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
