"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#F4EFE7" }}
    >
      <div className="text-center max-w-sm">
        <span
          className="font-cormorant text-lg tracking-[0.3em] font-semibold block mb-6"
          style={{ color: "#4A5E3A" }}
        >
          L U M O
        </span>
        <h1 className="font-cormorant font-semibold text-2xl mb-2" style={{ color: "#2D2D2D" }}>
          Algo salió mal
        </h1>
        <p className="font-inter text-sm mb-6" style={{ color: "#8A8A7A" }}>
          Hubo un error inesperado. Puedes intentar de nuevo.
        </p>
        <button
          onClick={reset}
          className="font-inter text-sm px-6 py-3 rounded-xl spring-press"
          style={{ background: "#4A5E3A", color: "#F4EFE7" }}
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
