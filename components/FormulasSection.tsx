type Product = {
  id: string;
  name: string;
  subtitle: string;
  ingredients: string[][];
  accentColor: string;
  bottleGradient: string;
  icon: React.ReactNode;
  bottleLabel: string;
};

const products: Product[] = [
  {
    id: "verde",
    name: "VERDE FRESCO",
    subtitle: "Ligero, herbal y cítrico.",
    ingredients: [
      ["Pepino", "Apio", "Manzana verde"],
      ["Limón", "Espinaca", "Jengibre"],
    ],
    accentColor: "#4A5E3A",
    bottleGradient: "from-[#1a2414] to-[#0f170a]",
    icon: <LeafIcon color="#4A5E3A" />,
    bottleLabel: "VERDE FRESCO",
  },
  {
    id: "rojo",
    name: "ROJO VITAL",
    subtitle: "Profundo, fresco y dulce.",
    ingredients: [
      ["Betabel", "Zanahoria", "Manzana"],
      ["Limón", "Jengibre", "Pepino"],
    ],
    accentColor: "#7A2030",
    bottleGradient: "from-[#200d10] to-[#130508]",
    icon: <BeetIcon color="#7A2030" />,
    bottleLabel: "ROJO VITAL",
  },
  {
    id: "tropical",
    name: "TROPICAL HYDRATE",
    subtitle: "Brillante y refrescante.",
    ingredients: [["Piña", "Pepino", "Limón", "Jengibre"]],
    accentColor: "#B8860B",
    bottleGradient: "from-[#1f1700] to-[#120e00]",
    icon: <PineappleIcon color="#B8860B" />,
    bottleLabel: "TROPICAL HYDRATE",
  },
];

export default function FormulasSection() {
  return (
    <section
      id="formulas"
      className="px-6 md:px-12 py-20 md:py-28"
      aria-label="Nuestras fórmulas"
    >
      {/* Header */}
      <div className="mb-12 md:mb-16">
        <h2 className="font-cormorant text-5xl md:text-6xl font-light italic text-[#F5F0E8] mb-3">
          Fórmulas
        </h2>
        <p className="font-inter text-[#8A8A8A] text-base md:text-lg">
          Lo que necesitas. Nada más.
        </p>
      </div>

      {/* Product cards */}
      <div className="flex flex-col gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Footer note */}
      <p className="mt-10 font-inter text-[#8A8A8A] text-sm text-center">
        Sin conservadores. Sin sabores artificiales. Sin ingredientes
        innecesarios.
      </p>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <article
      className="rounded-card border p-6 md:p-8 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center transition-all hover:border-opacity-60"
      style={{ borderColor: `${product.accentColor}40` }}
    >
      <div className="flex flex-col gap-4">
        {/* Icon + title row */}
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border flex items-center justify-center flex-shrink-0"
            style={{ borderColor: `${product.accentColor}70` }}
          >
            {product.icon}
          </div>
          <div>
            <h3 className="font-inter font-bold text-base tracking-widest text-[#F5F0E8] uppercase">
              {product.name}
            </h3>
            <p className="font-cormorant text-[#8A8A8A] text-base italic mt-0.5">
              {product.subtitle}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full opacity-20"
          style={{ backgroundColor: product.accentColor }}
        />

        {/* Ingredients */}
        <div className="flex flex-col gap-1">
          {product.ingredients.map((line, i) => (
            <p key={i} className="font-inter text-[#8A8A8A] text-sm">
              {line.join("  ·  ")}
            </p>
          ))}
        </div>
      </div>

      {/* Bottle placeholder */}
      <div className="flex justify-center md:justify-end">
        <div className="relative">
          <div
            className={`w-28 h-44 bg-gradient-to-b ${product.bottleGradient} rounded-[28px] border flex flex-col items-center justify-center gap-2`}
            style={{ borderColor: `${product.accentColor}30` }}
          >
            <p className="font-cormorant text-[#F5F0E8]/80 text-xs font-semibold tracking-widest">
              LUMO
            </p>
            <div
              className="h-px w-8 opacity-50"
              style={{ backgroundColor: product.accentColor }}
            />
            <p
              className="font-cormorant text-[10px] italic tracking-wide text-center px-2 leading-tight"
              style={{ color: product.accentColor }}
            >
              {product.bottleLabel}
            </p>
            <p className="font-inter text-[#8A8A8A]/40 text-[8px] mt-2 tracking-widest uppercase">
              Cold Pressed
            </p>
          </div>
          <div
            className="absolute -inset-4 rounded-full blur-2xl -z-10 opacity-20"
            style={{ backgroundColor: product.accentColor }}
          />
        </div>
      </div>
    </article>
  );
}

function LeafIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
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

function BeetIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
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

function PineappleIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="14" rx="5" ry="6" />
      <path d="M12 8V4" />
      <path d="M9 6l3-3 3 3" />
      <path d="M9 10l3 2 3-2" />
    </svg>
  );
}
