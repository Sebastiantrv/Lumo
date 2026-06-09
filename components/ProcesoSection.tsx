const steps = [
  { num: "01", label: "Seleccionamos ingredientes" },
  { num: "02", label: "Prensamos en frío" },
  { num: "03", label: "Embotellamos cada mañana" },
  { num: "04", label: "Entregamos lotes limitados" },
];

export default function ProcesoSection() {
  return (
    <section
      id="proceso"
      className="px-6 md:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center"
      aria-label="Nuestro proceso"
    >
      {/* Left — steps */}
      <div className="flex flex-col gap-6">
        <h2 className="font-cormorant text-4xl md:text-5xl lg:text-6xl font-light text-[#F5F0E8] leading-tight">
          Hecho con intención
        </h2>

        <div className="flex flex-col mt-4">
          {steps.map((step, i) => (
            <div key={step.num}>
              <div className="flex items-center gap-5 py-4">
                <span className="font-cormorant text-2xl font-light text-[#4A5E3A] min-w-[2.5rem]">
                  {step.num}
                </span>
                <p className="font-inter text-[#F5F0E8] text-base font-light">
                  {step.label}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className="h-px bg-[#F5F0E8]/10 ml-[3.5rem]" />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-start gap-3 mt-2">
          <LeafIcon />
          <p className="font-inter text-[#8A8A8A] text-sm leading-relaxed">
            Cada lote se prepara por la mañana para conservar frescura, sabor y
            nutrientes.
          </p>
        </div>

        <a
          href="#piloto"
          className="inline-flex items-center gap-2 self-start border border-[#F5F0E8]/30 text-[#F5F0E8] font-inter font-medium text-sm px-6 py-3 rounded-full hover:border-[#F5F0E8]/60 transition-colors mt-2"
        >
          Unirme al piloto
          <span aria-hidden="true">→</span>
        </a>
      </div>

      {/* Right — bottle placeholder */}
      <div className="flex justify-center md:justify-end">
        <div className="relative">
          {/* Floating ingredient blobs */}
          <div className="absolute -top-6 -right-6 w-16 h-16 bg-[#4A5E3A]/20 rounded-full blur-xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#4A5E3A]/15 rounded-full blur-2xl" />
          <div className="absolute top-1/3 -left-4 w-8 h-8 bg-[#4A5E3A]/25 rounded-full blur-lg" />

          <div className="relative w-52 h-[340px] md:w-60 md:h-[380px] bg-gradient-to-b from-[#1a2414] to-[#0f170a] rounded-[40px] border border-[#4A5E3A]/25 flex flex-col items-center justify-center gap-3 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-[#4A5E3A]/20 border border-[#4A5E3A]/40 flex items-center justify-center">
              <LeafIconSmall />
            </div>
            <div className="text-center px-4">
              <p className="font-cormorant text-[#F5F0E8]/90 text-xl font-semibold tracking-widest">
                LUMO
              </p>
              <div className="h-px w-14 bg-[#4A5E3A]/60 mx-auto my-2" />
              <p className="font-cormorant text-[#4A5E3A] text-sm font-medium tracking-wider italic">
                VERDE FRESCO
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-1 text-center px-6">
              <p className="font-inter text-[#8A8A8A]/50 text-[10px] tracking-widest uppercase">
                Cold Pressed
              </p>
              <p className="font-inter text-[#8A8A8A]/30 text-[9px]">
                Hecho cada mañana
              </p>
            </div>
          </div>

          <div className="absolute -inset-10 bg-[#4A5E3A]/08 rounded-full blur-3xl -z-10" />
        </div>
      </div>
    </section>
  );
}

function LeafIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4A5E3A"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 flex-shrink-0"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function LeafIconSmall() {
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
