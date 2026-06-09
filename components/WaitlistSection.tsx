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
      className="px-6 md:px-12 py-24 md:py-32 flex flex-col items-center text-center"
      aria-label="Unirse al piloto"
    >
      <div className="max-w-md w-full flex flex-col items-center gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-cormorant text-4xl md:text-5xl font-light text-[#F5F0E8]">
            Únete al piloto
          </h2>
          <p className="font-inter text-[#8A8A8A] text-base">
            Cupos limitados por semana.
          </p>
        </div>

        {status === "success" ? (
          <div className="w-full border border-[#4A5E3A]/40 rounded-card p-6 bg-[#4A5E3A]/10">
            <p className="font-cormorant text-xl text-[#F5F0E8] mb-1">
              ¡Listo!
            </p>
            <p className="font-inter text-[#8A8A8A] text-sm">
              Te avisaremos cuando haya un cupo disponible.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-3"
            noValidate
          >
            <div className="flex flex-col gap-1">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="tu@correo.com"
                className={`w-full bg-transparent border rounded-card px-4 py-3 font-inter text-[#F5F0E8] text-sm placeholder-[#8A8A8A]/50 outline-none focus:border-[#F5F0E8]/50 transition-colors ${
                  status === "error"
                    ? "border-[#7A2030]/70"
                    : "border-[#F5F0E8]/20"
                }`}
                aria-label="Correo electrónico"
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "email-error" : undefined}
                required
              />
              {status === "error" && (
                <p
                  id="email-error"
                  className="font-inter text-[#7A2030] text-xs text-left px-1"
                  role="alert"
                >
                  Ingresa un correo válido.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#F5F0E8] text-[#0D0D0D] font-inter font-medium text-sm px-6 py-3 rounded-full hover:bg-white transition-colors"
            >
              Quiero unirme →
            </button>
          </form>
        )}

        <p className="font-inter text-[#8A8A8A]/50 text-xs">
          Sin spam. Sin compromisos. Solo acceso al piloto.
        </p>
      </div>
    </section>
  );
}
