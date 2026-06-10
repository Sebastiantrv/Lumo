"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/admin");
    } else {
      setError("Credenciales incorrectas.");
      setLoading(false);
    }
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#0D0D0D" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <span
            className="font-cormorant tracking-[0.35em] font-semibold"
            style={{ fontSize: "1.6rem", color: "#F5F0E8" }}
          >
            L U M O
          </span>
          <p
            className="font-inter mt-2"
            style={{ fontSize: "0.8rem", color: "#4A5E3A", letterSpacing: "0.15em" }}
          >
            ADMINISTRADOR
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              className="font-inter text-xs tracking-widest uppercase"
              style={{ color: "#8A8A8A" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3.5 font-inter text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#F5F0E8",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4A5E3A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              className="font-inter text-xs tracking-widest uppercase"
              style={{ color: "#8A8A8A" }}
            >
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl px-4 py-3.5 font-inter text-sm outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#F5F0E8",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#4A5E3A")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {error && (
            <p className="font-inter text-sm text-center" style={{ color: "#7A2030" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3.5 font-inter font-medium text-sm transition-opacity mt-2"
            style={{
              background: "#F5F0E8",
              color: "#0D0D0D",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
