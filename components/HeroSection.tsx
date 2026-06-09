export default function HeroSection() {
  return (
    <section
      id="hero"
      className="px-6 md:px-12 py-16 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center min-h-[calc(100vh-80px)]"
    >
      {/* Left column */}
      <div className="flex flex-col gap-6">
        <h1 className="font-cormorant text-5xl md:text-6xl lg:text-7xl font-light leading-tight text-[#F5F0E8]">
          Prensados en frío.
          <br />
          Hechos cada mañana.
        </h1>

        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-[#F5F0E8]/40" />
          <LeafIcon />
        </div>

        <p className="font-inter text-[#8A8A8A] text-base md:text-lg leading-relaxed max-w-sm">
          Jugos naturales preparados en lotes limitados y entregados cada
          mañana.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <a
            href="/piloto"
            className="inline-flex items-center justify-center gap-2 bg-[#F5F0E8] text-[#0D0D0D] font-inter font-medium text-sm px-6 py-3 rounded-full hover:bg-white transition-colors"
          >
            Unirme al piloto
            <span aria-hidden="true">→</span>
          </a>
          <a
            href="/formulas"
            className="inline-flex items-center justify-center gap-2 border border-[#F5F0E8]/30 text-[#F5F0E8] font-inter font-medium text-sm px-6 py-3 rounded-full hover:border-[#F5F0E8]/60 transition-colors"
          >
            Ver fórmulas
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <LockIcon />
          <p className="font-inter text-[#8A8A8A] text-xs">
            Acceso exclusivo para un número limitado de personas cada semana.
          </p>
        </div>
      </div>

      {/* Right column — bottle placeholder */}
      <div className="flex justify-center md:justify-end">
        <div className="relative">
          <div className="w-48 h-80 md:w-56 md:h-96 bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-[40px] border border-[#F5F0E8]/10 flex flex-col items-center justify-center gap-3 shadow-2xl">
            <div className="w-8 h-8 rounded-full bg-[#7A2030]/30 border border-[#7A2030]/50 flex items-center justify-center">
              <BeetIcon color="#7A2030" />
            </div>
            <div className="text-center px-4">
              <p className="font-cormorant text-[#F5F0E8]/90 text-lg font-semibold tracking-widest">
                LUMO
              </p>
              <div className="h-px w-12 bg-[#7A2030]/60 mx-auto my-2" />
              <p className="font-cormorant text-[#7A2030] text-sm font-medium tracking-wider italic">
                ROJO VITAL
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-1 text-center">
              <p className="font-inter text-[#8A8A8A]/60 text-[10px] tracking-widest uppercase">
                Cold Pressed
              </p>
              <p className="font-inter text-[#8A8A8A]/40 text-[9px]">
                250 ml
              </p>
            </div>
          </div>
          {/* Decorative blurred glow */}
          <div className="absolute -inset-8 bg-[#7A2030]/10 rounded-full blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}

function LeafIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4A5E3A"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8A8A8A"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function BeetIcon({ color }: { color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="14" r="6" />
      <path d="M12 8V4" />
      <path d="M9 5c1 1 3 1 3 3" />
      <path d="M15 5c-1 1-3 1-3 3" />
    </svg>
  );
}
