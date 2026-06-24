"use client";

import { useState } from "react";
import Link from "next/link";

/* ── Design tokens for light cream background ── */
const T = {
  text:        "#1A1A1A",
  textSub:     "#6A6A6A",
  textMuted:   "#9A9A9A",
  border:      "rgba(0,0,0,0.10)",
  borderFocus: "rgba(0,0,0,0.30)",
  inputBg:     "rgba(255,255,255,0.65)",
  cardBg:      "rgba(255,255,255,0.55)",
  cardBorder:  "rgba(0,0,0,0.08)",
  btnPrimary:  "#0D0D0D",
  btnText:     "#F4EFE7",
  btnBack:     "#6A6A6A",
  error:       "#7A2030",
};

type FormData = {
  nombre: string;
  whatsapp: string;
  area: string;
  formula: string;
  preferencia: string;
  restricciones: string;
};

const TOTAL_STEPS = 6;

const FORMULAS = [
  { id: "verde",    label: "Verde Fresco",    color: "#4A5E3A" },
  { id: "rojo",     label: "Rojo Vital",       color: "#7A2030" },
  { id: "tropical", label: "Tropical Hydrate", color: "#B8860B" },
  { id: "sorpresa", label: "Sorpréndeme",       color: "#5A6A7A" },
];

const PREFERENCIAS = [
  { id: "fresco",     label: "Más fresco / ligero" },
  { id: "dulce",      label: "Más dulce / frutal" },
  { id: "intenso",    label: "Más intenso / con jengibre" },
  { id: "balanceado", label: "Balanceado" },
];

const INGREDIENTES_POR_FORMULA = [
  {
    formula: "Verde Fresco",
    color: "#4A5E3A",
    ingredientes: ["Pepino", "Apio", "Manzana verde", "Limón", "Espinaca", "Jengibre"],
  },
  {
    formula: "Rojo Vital",
    color: "#7A2030",
    ingredientes: ["Betabel", "Zanahoria", "Manzana", "Limón", "Jengibre", "Pepino"],
  },
  {
    formula: "Tropical Hydrate",
    color: "#B8860B",
    ingredientes: ["Piña", "Pepino", "Limón", "Jengibre"],
  },
];

export default function WaitlistSection() {
  const [step, setStep]           = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey]     = useState(0);
  const [data, setData]           = useState<FormData>({
    nombre: "", whatsapp: "", area: "", formula: "", preferencia: "", restricciones: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [evitar, setEvitar] = useState<string[]>([]);
  const [codigoMiembro, setCodigoMiembro] = useState("");

  function goTo(next: number, dir: "forward" | "backward") {
    setDirection(dir);
    setAnimKey(k => k + 1);
    setStep(next);
    setErrors({});
  }

  function next()  { if (!validate()) return; goTo(step + 1, "forward"); }
  function back()  { goTo(step - 1, "backward"); }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (step === 1 && !data.nombre.trim())    e.nombre      = "Ingresa tu nombre.";
    if (step === 2 && !data.whatsapp.trim())  e.whatsapp    = "Ingresa tu WhatsApp.";
    if (step === 2 && data.whatsapp && !/^[\d\s\+\-\(\)]{7,}$/.test(data.whatsapp))
                                               e.whatsapp    = "Número no válido.";
    if (step === 3 && !data.area.trim())       e.area        = "Ingresa tu empresa.";
    if (step === 4 && !data.formula)           e.formula     = "Selecciona una fórmula.";
    if (step === 5 && !data.preferencia)       e.preferencia = "Selecciona una preferencia.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    const payload = {
      ...data,
      restricciones: evitar.length > 0 ? evitar.join(", ") : "Ninguno",
      timestamp: new Date().toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
    };
    try {
      const res = await fetch("/api/piloto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.codigo_miembro) setCodigoMiembro(json.codigo_miembro);
    } catch {
      alert("No se pudo completar tu registro. Verifica tu conexión e intenta de nuevo.");
      return;
    }
    goTo(7, "forward");
  }

  const animStyle = {
    animation: `${direction === "forward" ? "stepInRight" : "stepInLeft"} 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
  };

  return (
    <section
      id="piloto"
      className="px-5 md:px-12 lg:px-20 py-14 md:py-24 flex flex-col items-center"
      aria-label="Formulario del piloto"
    >
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* Progress bar */}
        {step >= 1 && step <= TOTAL_STEPS && (
          <div className="flex flex-col gap-2">
            <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.10)" }}>
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%`, backgroundColor: "#4A5E3A" }}
              />
            </div>
            <p className="font-inter text-xs text-right" style={{ color: T.textMuted }}>
              {step} / {TOTAL_STEPS}
            </p>
          </div>
        )}

        <div key={animKey} style={animStyle}>

          {/* 0: Intro */}
          {step === 0 && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h2
                  className="font-cormorant font-light"
                  style={{ fontSize: "clamp(2.6rem, 10vw, 3.8rem)", lineHeight: 1.1, color: T.text }}
                >
                  Solicita tu prueba.
                </h2>
                <p className="font-inter leading-relaxed" style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)", color: T.textSub }}>
                  LUMO se prepara en pequeños lotes cada mañana. Déjanos tus datos y te confirmaremos disponibilidad.
                </p>
              </div>
              <button
                onClick={() => goTo(1, "forward")}
                className="w-full inline-flex items-center justify-between font-inter font-medium rounded-full spring-press"
                style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)", padding: "0.9rem 1.5rem", background: T.btnPrimary, color: T.btnText }}
              >
                Iniciar solicitud <span aria-hidden="true">→</span>
              </button>
            </div>
          )}

          {/* 1: Nombre */}
          {step === 1 && (
            <StepShell label="¿Cómo te llamas?" onNext={next} onBack={back} showBack={false}>
              <LightInput placeholder="Nombre" value={data.nombre}
                onChange={v => setData(d => ({ ...d, nombre: v }))}
                error={errors.nombre} onEnter={next} autoFocus />
            </StepShell>
          )}

          {/* 2: WhatsApp */}
          {step === 2 && (
            <StepShell label="¿Dónde te confirmamos?" onNext={next} onBack={back}>
              <LightInput placeholder="WhatsApp" value={data.whatsapp} type="tel"
                onChange={v => setData(d => ({ ...d, whatsapp: v }))}
                error={errors.whatsapp} onEnter={next} autoFocus />
            </StepShell>
          )}

          {/* 3: Empresa */}
          {step === 3 && (
            <StepShell label="¿En qué empresa trabajas?"
              sublabel="Nos ayuda a saber dónde coordinar la entrega."
              onNext={next} onBack={back}>
              <LightInput placeholder="Nombre de tu empresa" value={data.area}
                onChange={v => setData(d => ({ ...d, area: v }))}
                error={errors.area} onEnter={next} autoFocus />
            </StepShell>
          )}

          {/* 4: Fórmula */}
          {step === 4 && (
            <StepShell label="¿Qué fórmula quieres probar?" onNext={next} onBack={back}>
              {errors.formula && <p className="font-inter text-xs mb-1" style={{ color: T.error }} role="alert">{errors.formula}</p>}
              <div className="flex flex-col gap-3">
                {FORMULAS.map(f => {
                  const sel = data.formula === f.id;
                  return (
                    <button key={f.id}
                      onClick={() => setData(d => ({ ...d, formula: f.id }))}
                      className="w-full text-left px-5 py-4 rounded-2xl font-inter transition-all spring-press"
                      style={{
                        fontSize: "clamp(0.88rem, 3.4vw, 1rem)",
                        background: sel ? `${f.color}15` : T.cardBg,
                        border: sel ? `1.5px solid ${f.color}` : `1px solid ${T.cardBorder}`,
                        color: sel ? f.color : T.textSub,
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        boxShadow: sel ? `0 0 20px ${f.color}18` : "0 2px 8px rgba(0,0,0,0.06)",
                        fontWeight: sel ? 500 : 400,
                      }}>
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {/* 5: Preferencia */}
          {step === 5 && (
            <StepShell label="¿Cómo lo prefieres?" onNext={next} onBack={back}>
              {errors.preferencia && <p className="font-inter text-xs mb-1" style={{ color: T.error }} role="alert">{errors.preferencia}</p>}
              <div className="flex flex-col gap-3">
                {PREFERENCIAS.map(p => {
                  const sel = data.preferencia === p.id;
                  return (
                    <button key={p.id}
                      onClick={() => setData(d => ({ ...d, preferencia: p.id }))}
                      className="w-full text-left px-5 py-4 rounded-2xl font-inter transition-all spring-press"
                      style={{
                        fontSize: "clamp(0.88rem, 3.4vw, 1rem)",
                        background: sel ? "rgba(74,94,58,0.12)" : T.cardBg,
                        border: sel ? "1.5px solid #4A5E3A" : `1px solid ${T.cardBorder}`,
                        color: sel ? "#4A5E3A" : T.textSub,
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        boxShadow: sel ? "0 0 20px rgba(74,94,58,0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
                        fontWeight: sel ? 500 : 400,
                      }}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {/* 6: Ingredientes a evitar */}
          {step === 6 && (
            <StepShell label="¿Hay algún ingrediente que prefieras evitar?"
              sublabel="Opcional — toca los que no te gusten."
              onNext={submit} onBack={back} nextLabel="Enviar solicitud →">
              <div className="flex flex-col gap-5">
                {INGREDIENTES_POR_FORMULA.map((grupo) => (
                  <div key={grupo.formula} className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg self-start"
                      style={{ background: `${grupo.color}14`, border: `1px solid ${grupo.color}35` }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: grupo.color }} />
                      <p className="font-cormorant font-semibold tracking-widest uppercase"
                        style={{ fontSize: "0.85rem", color: grupo.color }}>
                        {grupo.formula}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {grupo.ingredientes.map((ing) => {
                        const sel = evitar.includes(ing);
                        return (
                          <button key={ing} type="button"
                            onClick={() => setEvitar(prev => sel ? prev.filter(x => x !== ing) : [...prev, ing])}
                            className="px-3 py-1.5 rounded-full font-inter spring-press"
                            style={{
                              fontSize: "clamp(0.78rem, 3vw, 0.9rem)",
                              background: sel ? `${grupo.color}18` : T.cardBg,
                              border: sel ? `1.5px solid ${grupo.color}` : `1px solid ${T.cardBorder}`,
                              color: sel ? grupo.color : T.textSub,
                              boxShadow: sel ? `0 0 12px ${grupo.color}25` : "0 1px 4px rgba(0,0,0,0.06)",
                              transition: "all 0.2s ease",
                              fontWeight: sel ? 500 : 400,
                            }}>
                            {ing}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </StepShell>
          )}

          {/* 7: Bienvenida */}
          {step === 7 && (
            <div className="flex flex-col gap-8">
              <style>{`
                @keyframes welcomeFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes codeReveal { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
                @keyframes softGlow { 0%, 100% { box-shadow: 0 0 0 0 rgba(74,94,58,0); } 50% { box-shadow: 0 0 24px 4px rgba(74,94,58,0.08); } }
                @keyframes checkDraw { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
                @keyframes lineFade { from { width: 0; opacity: 0; } to { width: 48px; opacity: 1; } }
              `}</style>

              <div className="flex flex-col gap-5" style={{ animation: "welcomeFadeUp 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(74,94,58,0.12)", border: "1.5px solid #4A5E3A" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" style={{ strokeDasharray: 24, animation: "checkDraw 0.5s ease-out 0.3s both" }} />
                  </svg>
                </div>

                <h2 className="font-cormorant font-light"
                  style={{ fontSize: "clamp(2.2rem, 9vw, 3.2rem)", lineHeight: 1.1, color: T.text }}>
                  Bienvenido a LUMO.
                </h2>

                <p className="font-inter leading-relaxed" style={{ fontSize: "clamp(0.85rem, 3.3vw, 1rem)", color: T.textSub }}>
                  Tu registro está completo, {data.nombre.split(" ")[0]}.
                </p>
              </div>

              {/* Código LUMO */}
              {codigoMiembro && (
                <div
                  className="rounded-2xl p-7 text-center relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    border: `1px solid ${T.cardBorder}`,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    animation: "codeReveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both, softGlow 3s ease-in-out 1s infinite",
                  }}
                >
                  <p className="font-inter text-xs uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>
                    Tu código LUMO
                  </p>
                  <p className="font-cormorant font-light tracking-[0.18em]"
                    style={{ fontSize: "clamp(2.2rem, 9vw, 2.8rem)", color: "#4A5E3A", lineHeight: 1 }}>
                    {codigoMiembro}
                  </p>
                  <div className="mx-auto mt-4 mb-1" style={{ height: "1px", background: "rgba(74,94,58,0.15)", animation: "lineFade 0.8s ease-out 0.6s both" }} />
                  <p className="font-inter text-xs mt-3" style={{ color: T.textMuted, lineHeight: 1.5 }}>
                    Con este código accedes a Mi LUMO
                  </p>
                </div>
              )}

              {/* Balance de cortesía */}
              <div
                className="flex items-start gap-4 rounded-2xl p-5"
                style={{
                  background: "rgba(74,94,58,0.04)",
                  border: "1px solid rgba(74,94,58,0.10)",
                  animation: "welcomeFadeUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.45s both",
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(74,94,58,0.10)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div>
                  <p className="font-inter font-medium text-sm" style={{ color: "#1A1A1A" }}>
                    Tu Balance LUMO está listo
                  </p>
                  <p className="font-inter text-xs mt-1" style={{ color: T.textSub, lineHeight: 1.6 }}>
                    Hemos preparado un balance de cortesía para que reserves tus primeras botellas desde Mi LUMO.
                  </p>
                </div>
              </div>

              {/* Siguiente paso */}
              <div style={{ animation: "welcomeFadeUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.6s both" }}>
                <p className="font-inter text-xs mb-4" style={{ color: T.textMuted, lineHeight: 1.6 }}>
                  Ingresa con tu código y elige el día que quieres recibir tu LUMO.
                </p>

                <Link href="/mi-lumo"
                  className="w-full inline-flex items-center justify-between font-inter font-medium rounded-full spring-press"
                  style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)", padding: "0.9rem 1.5rem", background: T.btnPrimary, color: T.btnText }}>
                  Ir a Mi LUMO <span aria-hidden="true">→</span>
                </Link>

                <Link href="/formulas"
                  className="w-full inline-flex items-center justify-center font-inter spring-press py-3 mt-2"
                  style={{ fontSize: "clamp(0.82rem, 3.2vw, 0.95rem)", color: T.textMuted }}>
                  Explorar fórmulas
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

/* ── Step shell ── */
function StepShell({ label, sublabel, children, onNext, onBack, showBack = true, nextLabel = "Continuar →" }: {
  label: string; sublabel?: string; children: React.ReactNode;
  onNext: () => void; onBack: () => void; showBack?: boolean; nextLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h2 className="font-cormorant font-light"
          style={{ fontSize: "clamp(2rem, 8vw, 3rem)", lineHeight: 1.15, color: "#1A1A1A" }}>
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
        <button onClick={onNext}
          className="w-full inline-flex items-center justify-between font-inter font-medium rounded-full spring-press"
          style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)", padding: "0.9rem 1.5rem", background: "#0D0D0D", color: "#F4EFE7" }}>
          {nextLabel} <span aria-hidden="true">{nextLabel.includes("→") ? "" : "→"}</span>
        </button>
        {showBack && (
          <button onClick={onBack}
            className="w-full inline-flex items-center justify-center font-inter spring-press py-2"
            style={{ fontSize: "clamp(0.82rem, 3.2vw, 0.95rem)", color: "#6A6A6A" }}>
            ← Regresar
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Light input ── */
function LightInput({ placeholder, value, onChange, error, type = "text", onEnter, autoFocus }: {
  placeholder: string; value: string; onChange: (v: string) => void;
  error?: string; type?: string; onEnter?: () => void; autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <input type={type} value={value} autoFocus={autoFocus} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
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
        onFocus={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.30)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? "rgba(122,32,48,0.5)" : "rgba(0,0,0,0.10)"; }}
      />
      {error && <p className="font-inter text-xs px-1" style={{ color: "#7A2030" }} role="alert">{error}</p>}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
