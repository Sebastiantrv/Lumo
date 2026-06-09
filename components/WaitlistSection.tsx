"use client";

import { useState } from "react";

export default function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }
    console.log("Waitlist submission:", { email, timestamp: new Date().toISOString() });
    setStatus("success");
    setEmail("");
  }

  return (
    <section
      id="piloto"
      className="px-5 md:px-12 py-20 md:py-32 flex flex-col items-center text-center"
      aria-label="Unirse al piloto"
    >
      <div className="max-w-md w-full flex flex-col items-center gap-8">
        <div className="flex flex-col gap-3">
          <h2
            className="font-cormorant font-light text-[#F5F0E8] spring-in"
            style={{ fontSize: "clamp(2.6rem, 10vw, 4rem)", animationDelay: "0.04s" }}
          >
            Únete al piloto
          </h2>
          <p
            className="font-inter text-[#8A8A8A] spring-in"
            style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.125rem)", animationDelay: "0.10s" }}
          >
            Cupos limitados por semana.
          </p>
        </div>

        {status === "success" ? (
          <div className="w-full rounded-2xl p-8 glass-verde spring-in">
            <p className="font-cormorant text-2xl text-[#F5F0E8] mb-2">¡Listo!</p>
            <p className="font-inter text-[#8A8A8A] text-sm">
              Te avisaremos cuando haya un cupo disponible.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-3.5 spring-in"
            style={{ animationDelay: "0.18s" }}
            noValidate
          >
            <div className="flex flex-col gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="tu@correo.com"
                className="w-full bg-transparent rounded-2xl px-5 py-4 font-inter text-[#F5F0E8] text-sm md:text-base placeholder-[#8A8A8A]/40 outline-none"
                style={{
                  border: status === "error" ? "1px solid rgba(122,32,48,0.6)" : "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.07) inset",
                  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.12) inset";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = status === "error" ? "rgba(122,32,48,0.6)" : "rgba(255,255,255,0.10)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.07) inset";
                }}
                aria-label="Correo electrónico"
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "email-error" : undefined}
                required
              />
              {status === "error" && (
                <p id="email-error" className="font-inter text-[#7A2030] text-xs text-left px-1" role="alert">
                  Ingresa un correo válido.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#F5F0E8] text-[#0D0D0D] font-inter font-medium text-sm md:text-base px-6 py-4 rounded-full spring-press"
              style={{ boxShadow: "0 4px 24px rgba(245, 240, 232, 0.12)" }}
            >
              Quiero unirme →
            </button>
          </form>
        )}

        <p
          className="font-inter text-[#8A8A8A]/40 text-xs spring-in"
          style={{ animationDelay: "0.28s" }}
        >
          Sin spam. Sin compromisos. Solo acceso al piloto.
        </p>
      </div>
    </section>
  );
}
