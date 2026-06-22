"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <h1 className="font-cormorant text-xl mb-2" style={{ color: "#F5F0E8" }}>
        Algo salió mal
      </h1>
      <p className="font-inter text-sm mb-4" style={{ color: "#8A8A8A" }}>
        {error.message || "Error inesperado"}
      </p>
      <button
        onClick={reset}
        className="font-inter text-sm px-5 py-2 rounded-xl"
        style={{ background: "rgba(74,94,58,0.2)", color: "#4A5E3A", border: "1px solid rgba(74,94,58,0.4)" }}
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
