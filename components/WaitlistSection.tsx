"use client";

import { useState } from "react";

/* ── Types ── */
type FormData = {
  nombre: string;
  whatsapp: string;
  area: string;
  formula: string;
  preferencia: string;
  restricciones: string;
};

const TOTAL_STEPS = 6; // steps 1-6 (excluding intro=0 and confirmation=7)

const FORMULAS = [
  { id: "verde",    label: "Verde Fresco",     color: "#4A5E3A" },
  { id: "rojo",     label: "Rojo Vital",        color: "#7A2030" },
  { id: "tropical", label: "Tropical Hydrate",  color: "#B8860B" },
  { id: "sorpresa", label: "Sorpréndeme",        color: "#8A8A8A" },
];

const PREFERENCIAS = [
  { id: "fresco",      label: "Más fresco / ligero" },
  { id: "dulce",       label: "Más dulce / frutal" },
  { id: "intenso",     label: "Más intenso / con jengibre" },
  { id: "balanceado",  label: "Balanceado" },
];

/* ── Main component ── */
export default function WaitlistSection() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [data, setData] = useState<FormData>({
    nombre: "", whatsapp: "", area: "",
    formula: "", preferencia: "", restricciones: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  function goTo(next: number, dir: "forward" | "backward") {
    setDirection(dir);
    setAnimKey(k => k + 1);
    setStep(next);
    setErrors({});
  }

  function next() {
    if (!validate()) return;
    goTo(step + 1, "forward");
  }

  function back() {
    goTo(step - 1, "backward");
  }

  function validate(): boolean {
    const e: Partial<FormData> = {};
    if (step === 1 && !data.nombre.trim())       e.nombre      = "Ingresa tu nombre.";
    if (step === 2 && !data.whatsapp.trim())      e.whatsapp    = "Ingresa tu WhatsApp.";
    if (step === 2 && data.whatsapp && !/^[\d\s\+\-\(\)]{7,}$/.test(data.whatsapp))
                                                   e.whatsapp    = "Número no válido.";
    if (step === 3 && !data.area.trim())           e.area        = "Ingresa tu área o piso.";
    if (step === 4 && !data.formula)               e.formula     = "Selecciona una fórmula.";
    if (step === 5 && !data.preferencia)           e.preferencia = "Selecciona una preferencia.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    const payload = {
      ...data,
      timestamp: new Date().toISOString(),
      source: "lumo-piloto-form",
    };
    console.log("LUMO form submission:", JSON.stringify(payload, null, 2));
    // TODO: POST to Airtable/webhook here
    goTo(7, "forward");
  }

  const animStyle = {
    animation: `${direction === "forward" ? "stepInRight" : "stepInLeft"} 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
  };

  return (
    <section
      id="piloto"
      className="px-5 md:px-12 py-14 md:py-24 flex flex-col items-center"
      aria-label="Formulario del piloto"
    >
      <div className="w-full max-w-md flex flex-col gap-6">

        {/* ── Progress bar (steps 1–6) ── */}
        {step >= 1 && step <= TOTAL_STEPS && (
          <div className="flex flex-col gap-2">
            <div className="w-full h-[2px] rounded-full bg-[#F5F0E8]/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(step / TOTAL_STEPS) * 100}%`,
                  backgroundColor: "#4A5E3A",
                }}
              />
            </div>
            <p className="font-inter text-[#8A8A8A]/60 text-xs text-right">
              {step} / {TOTAL_STEPS}
            </p>
          </div>
        )}

        {/* ── Step content (animated) ── */}
        <div key={animKey} style={animStyle}>

          {/* ── 0: Intro ── */}
          {step === 0 && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <h2
                  className="font-cormorant font-light text-[#F5F0E8]"
                  style={{ fontSize: "clamp(2.6rem, 10vw, 3.8rem)", lineHeight: 1.1 }}
                >
                  Solicita tu prueba.
                </h2>
                <p className="font-inter text-[#8A8A8A] leading-relaxed" style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)" }}>
                  LUMO se prepara en pequeños lotes cada mañana. Déjanos tus datos y te confirmaremos disponibilidad.
                </p>
              </div>
              <button
                onClick={() => goTo(1, "forward")}
                className="w-full inline-flex items-center justify-between bg-[#F5F0E8] text-[#0D0D0D] font-inter font-medium rounded-full spring-press"
                style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)", padding: "0.9rem 1.5rem" }}
              >
                Iniciar solicitud <span aria-hidden="true">→</span>
              </button>
            </div>
          )}

          {/* ── 1: Nombre ── */}
          {step === 1 && (
            <StepShell label="¿Cómo te llamas?" onNext={next} onBack={back} showBack={false}>
              <GlassInput
                placeholder="Nombre"
                value={data.nombre}
                onChange={v => setData(d => ({ ...d, nombre: v }))}
                error={errors.nombre}
                onEnter={next}
                autoFocus
              />
            </StepShell>
          )}

          {/* ── 2: WhatsApp ── */}
          {step === 2 && (
            <StepShell label="¿Dónde te confirmamos?" onNext={next} onBack={back}>
              <GlassInput
                placeholder="WhatsApp"
                value={data.whatsapp}
                onChange={v => setData(d => ({ ...d, whatsapp: v }))}
                error={errors.whatsapp}
                type="tel"
                onEnter={next}
                autoFocus
              />
            </StepShell>
          )}

          {/* ── 3: Área ── */}
          {step === 3 && (
            <StepShell
              label="¿En qué área o piso estás?"
              sublabel="Por ahora las entregas serán únicamente dentro de Swiss Re."
              onNext={next}
              onBack={back}
            >
              <GlassInput
                placeholder="Área / piso / referencia"
                value={data.area}
                onChange={v => setData(d => ({ ...d, area: v }))}
                error={errors.area}
                onEnter={next}
                autoFocus
              />
            </StepShell>
          )}

          {/* ── 4: Fórmula ── */}
          {step === 4 && (
            <StepShell label="¿Qué fórmula quieres probar?" onNext={next} onBack={back}>
              {errors.formula && (
                <p className="font-inter text-[#7A2030] text-xs mb-1" role="alert">{errors.formula}</p>
              )}
              <div className="flex flex-col gap-3">
                {FORMULAS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setData(d => ({ ...d, formula: f.id }))}
                    className="w-full text-left px-5 py-4 rounded-2xl font-inter transition-all spring-press"
                    style={{
                      fontSize: "clamp(0.88rem, 3.4vw, 1rem)",
                      background: data.formula === f.id ? `${f.color}18` : "rgba(255,255,255,0.04)",
                      border: data.formula === f.id ? `1.5px solid ${f.color}` : "1px solid rgba(255,255,255,0.08)",
                      color: data.formula === f.id ? "#F5F0E8" : "#8A8A8A",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      boxShadow: data.formula === f.id
                        ? `0 0 20px ${f.color}20, 0 1px 0 ${f.color}25 inset`
                        : "0 4px 12px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05) inset",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {/* ── 5: Preferencia ── */}
          {step === 5 && (
            <StepShell label="¿Cómo lo prefieres?" onNext={next} onBack={back}>
              {errors.preferencia && (
                <p className="font-inter text-[#7A2030] text-xs mb-1" role="alert">{errors.preferencia}</p>
              )}
              <div className="flex flex-col gap-3">
                {PREFERENCIAS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setData(d => ({ ...d, preferencia: p.id }))}
                    className="w-full text-left px-5 py-4 rounded-2xl font-inter transition-all spring-press"
                    style={{
                      fontSize: "clamp(0.88rem, 3.4vw, 1rem)",
                      background: data.preferencia === p.id ? "rgba(74,94,58,0.15)" : "rgba(255,255,255,0.04)",
                      border: data.preferencia === p.id ? "1.5px solid #4A5E3A" : "1px solid rgba(255,255,255,0.08)",
                      color: data.preferencia === p.id ? "#F5F0E8" : "#8A8A8A",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      boxShadow: data.preferencia === p.id
                        ? "0 0 20px rgba(74,94,58,0.2), 0 1px 0 rgba(74,94,58,0.2) inset"
                        : "0 4px 12px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05) inset",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </StepShell>
          )}

          {/* ── 6: Restricciones ── */}
          {step === 6 && (
            <StepShell
              label="¿Hay algún ingrediente que prefieras evitar?"
              onNext={submit}
              onBack={back}
              nextLabel="Enviar solicitud →"
            >
              <GlassTextarea
                placeholder="Opcional — escribe aquí si hay algo que prefieras evitar"
                value={data.restricciones}
                onChange={v => setData(d => ({ ...d, restricciones: v }))}
                autoFocus
              />
              <p className="font-inter text-[#8A8A8A]/50 text-xs mt-1">Campo opcional.</p>
            </StepShell>
          )}

          {/* ── 7: Confirmación ── */}
          {step === 7 && (
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(74,94,58,0.15)", border: "1.5px solid #4A5E3A" }}
                >
                  <CheckIcon />
                </div>
                <h2
                  className="font-cormorant font-light text-[#F5F0E8]"
                  style={{ fontSize: "clamp(2.4rem, 9.5vw, 3.6rem)", lineHeight: 1.1 }}
                >
                  Solicitud recibida.
                </h2>
                <div
                  className="rounded-2xl p-6 flex flex-col gap-3"
                  style={{
                    background: "rgba(74,94,58,0.08)",
                    border: "1px solid rgba(74,94,58,0.22)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                >
                  <p className="font-inter text-[#8A8A8A] leading-relaxed" style={{ fontSize: "clamp(0.85rem, 3.3vw, 1rem)" }}>
                    Revisaremos disponibilidad para el siguiente lote y te confirmaremos por WhatsApp.
                  </p>
                  <p className="font-cormorant text-[#4A5E3A] italic" style={{ fontSize: "clamp(1rem, 4vw, 1.2rem)" }}>
                    Gracias por querer probar LUMO.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

/* ── Reusable step shell ── */
function StepShell({
  label, sublabel, children, onNext, onBack, showBack = true, nextLabel = "Continuar →",
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
          className="font-cormorant font-light text-[#F5F0E8]"
          style={{ fontSize: "clamp(2rem, 8vw, 3rem)", lineHeight: 1.15 }}
        >
          {label}
        </h2>
        {sublabel && (
          <p className="font-inter text-[#8A8A8A]" style={{ fontSize: "clamp(0.78rem, 3vw, 0.9rem)" }}>
            {sublabel}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {children}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onNext}
          className="w-full inline-flex items-center justify-between bg-[#F5F0E8] text-[#0D0D0D] font-inter font-medium rounded-full spring-press"
          style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)", padding: "0.9rem 1.5rem" }}
        >
          {nextLabel} <span aria-hidden="true">{nextLabel.includes("→") ? "" : "→"}</span>
        </button>

        {showBack && (
          <button
            onClick={onBack}
            className="w-full inline-flex items-center justify-center font-inter text-[#8A8A8A] spring-press py-2"
            style={{ fontSize: "clamp(0.82rem, 3.2vw, 0.95rem)" }}
          >
            ← Regresar
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Glass input ── */
function GlassInput({
  placeholder, value, onChange, error, type = "text", onEnter, autoFocus,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  onEnter?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
        className="w-full bg-transparent rounded-2xl px-5 py-4 font-inter text-[#F5F0E8] placeholder-[#8A8A8A]/40 outline-none"
        style={{
          fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)",
          border: error ? "1px solid rgba(122,32,48,0.6)" : "1px solid rgba(255,255,255,0.10)",
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.07) inset",
          transition: "border-color 0.2s ease",
        }}
        onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; }}
        onBlur={e => { e.currentTarget.style.borderColor = error ? "rgba(122,32,48,0.6)" : "rgba(255,255,255,0.10)"; }}
      />
      {error && <p className="font-inter text-[#7A2030] text-xs px-1" role="alert">{error}</p>}
    </div>
  );
}

/* ── Glass textarea ── */
function GlassTextarea({
  placeholder, value, onChange, autoFocus,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <textarea
      value={value}
      autoFocus={autoFocus}
      placeholder={placeholder}
      rows={4}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-transparent rounded-2xl px-5 py-4 font-inter text-[#F5F0E8] placeholder-[#8A8A8A]/40 outline-none resize-none"
      style={{
        fontSize: "clamp(0.9rem, 3.5vw, 1.05rem)",
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.07) inset",
        transition: "border-color 0.2s ease",
      }}
      onFocus={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"; }}
      onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)"; }}
    />
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
