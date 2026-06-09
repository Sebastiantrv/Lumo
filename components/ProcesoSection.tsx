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
      className="px-5 md:px-12 py-14 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-12 items-center"
      aria-label="Nuestro proceso"
    >
      <div className="flex flex-col gap-8">
        <h2
          className="font-cormorant text-4xl md:text-5xl lg:text-6xl font-light text-[#F5F0E8] leading-tight spring-in"
          style={{ animationDelay: "0.04s" }}
        >
          Hecho con<br />intención
        </h2>

        <div
          className="flex flex-col rounded-2xl overflow-hidden glass spring-in"
          style={{ animationDelay: "0.14s" }}
        >
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="flex items-center gap-6 px-7 py-5 spring-press"
              style={{ borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
            >
              <span className="font-cormorant text-2xl font-light text-[#4A5E3A] min-w-[2.5rem]">
                {step.num}
              </span>
              <p className="font-inter text-[#F5F0E8] text-sm md:text-base font-light">
                {step.label}
              </p>
            </div>
          ))}
        </div>

        <div
          className="flex items-start gap-3 spring-in"
          style={{ animationDelay: "0.28s" }}
        >
          <LeafIcon />
          <p className="font-inter text-[#8A8A8A] text-sm md:text-base leading-relaxed">
            Cada lote se prepara por la mañana para conservar frescura, sabor y nutrientes.
          </p>
        </div>

        <a
          href="/piloto"
          className="inline-flex items-center gap-2 self-start font-inter font-medium text-sm md:text-base px-7 py-3.5 rounded-full spring-press glass text-[#F5F0E8] spring-in"
          style={{ animationDelay: "0.34s" }}
        >
          Unirme al piloto <span aria-hidden="true">→</span>
        </a>
      </div>

      <div
        className="flex justify-center md:justify-end spring-in"
        style={{ animation: "springInRight 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) both", animationDelay: "0.1s" }}
      >
        <div className="relative spring-press">
          <div className="absolute -top-8 -right-6 w-20 h-20 bg-[#4A5E3A]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-[#4A5E3A]/12 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 -left-5 w-10 h-10 bg-[#4A5E3A]/20 rounded-full blur-xl pointer-events-none" />

          <div
            className="relative w-52 h-[340px] md:w-64 md:h-[400px] rounded-[40px] glass-verde flex flex-col items-center justify-center gap-4"
            style={{ boxShadow: "0 24px 64px rgba(74, 94, 58, 0.2), 0 1px 0 rgba(74, 94, 58, 0.25) inset" }}
          >
            <div className="w-12 h-12 rounded-full glass-verde flex items-center justify-center">
              <LeafIconLg />
            </div>
            <div className="text-center px-6">
              <p className="font-cormorant text-[#F5F0E8]/90 text-xl font-semibold tracking-widest">LUMO</p>
              <div className="h-px w-14 bg-[#4A5E3A]/50 mx-auto my-3" />
              <p className="font-cormorant text-[#4A5E3A] text-sm font-medium tracking-wider italic">VERDE FRESCO</p>
            </div>
            <div className="flex flex-col gap-1.5 text-center px-6">
              <p className="font-inter text-[#8A8A8A]/40 text-[10px] tracking-widest uppercase">Cold Pressed</p>
              <p className="font-inter text-[#8A8A8A]/25 text-[9px]">Hecho cada mañana</p>
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function LeafIconLg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A5E3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}
