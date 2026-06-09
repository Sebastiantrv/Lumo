"use client";

import Image from "next/image";
import { useState } from "react";

type Product = {
  id: string;
  name: string;
  subtitle: string;
  ingredients: string[][];
  glassClass: string;
  bottleImg: string;
  iconImg: string;
  icon: React.ReactNode;
  accentColor: string;
  glowColor: string;
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
    glassClass: "glass-verde",
    bottleImg: "/bottle-verde.png",
    iconImg: "/icon-verde.jpeg",
    icon: <LeafIcon color="#4A5E3A" />,
    accentColor: "#4A5E3A",
    glowColor: "rgba(74, 94, 58, 0.15)",
  },
  {
    id: "rojo",
    name: "ROJO VITAL",
    subtitle: "Profundo, fresco y dulce.",
    ingredients: [
      ["Betabel", "Zanahoria", "Manzana"],
      ["Limón", "Jengibre", "Pepino"],
    ],
    glassClass: "glass-rojo",
    bottleImg: "/bottle-rojo.png",
    iconImg: "/icon-rojo.jpeg",
    icon: <BeetIcon color="#7A2030" />,
    accentColor: "#7A2030",
    glowColor: "rgba(122, 32, 48, 0.15)",
  },
  {
    id: "tropical",
    name: "TROPICAL HYDRATE",
    subtitle: "Brillante y refrescante.",
    ingredients: [["Piña", "Pepino", "Limón", "Jengibre"]],
    glassClass: "glass-tropical",
    bottleImg: "/bottle-tropical.png",
    iconImg: "/icon-tropical.jpeg",
    icon: <PineappleIcon color="#B8860B" />,
    accentColor: "#B8860B",
    glowColor: "rgba(184, 134, 11, 0.15)",
  },
];

export default function FormulasSection() {
  return (
    <section
      id="formulas"
      className="px-5 md:px-12 py-14 md:py-24"
      aria-label="Nuestras fórmulas"
    >
      <div className="mb-12 md:mb-16">
        <h2
          className="font-cormorant font-light italic text-[#F5F0E8] mb-3 spring-in"
          style={{ fontSize: "clamp(2.6rem, 10vw, 4rem)", animationDelay: "0.04s" }}
        >
          Fórmulas
        </h2>
        <p
          className="font-inter text-[#8A8A8A] spring-in"
          style={{ fontSize: "clamp(0.9rem, 3.5vw, 1.125rem)", animationDelay: "0.10s" }}
        >
          Lo que necesitas. Nada más.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:gap-5">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      <p
        className="mt-12 font-inter text-[#8A8A8A] text-sm text-center spring-in"
        style={{ animationDelay: "0.5s" }}
      >
        Sin conservadores. Sin sabores artificiales. Sin ingredientes innecesarios.
      </p>
    </section>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [imgError, setImgError] = useState(false);
  const [iconError, setIconError] = useState(false);

  return (
    <article
      className={`rounded-2xl p-6 md:p-9 grid grid-cols-[1fr_auto] gap-6 items-center spring-press spring-in ${product.glassClass}`}
      style={{
        animationDelay: `${0.18 + index * 0.12}s`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="absolute top-0 left-8 right-8 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${product.accentColor}50, transparent)` }}
      />

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `${product.accentColor}18`,
              border: `1px solid ${product.accentColor}40`,
              boxShadow: `0 0 20px ${product.glowColor}`,
            }}
          >
            {!iconError ? (
              <img src={product.iconImg} alt={product.name} onError={() => setIconError(true)}
                style={{ width: 28, height: 28, objectFit: "contain" }} />
            ) : product.icon}
          </div>
          <div>
            <h3
              className="font-inter font-bold tracking-widest text-[#F5F0E8] uppercase"
              style={{ fontSize: "clamp(0.75rem, 3vw, 1rem)" }}
            >
              {product.name}
            </h3>
            <p
              className="font-cormorant text-[#8A8A8A] italic mt-1"
              style={{ fontSize: "clamp(1rem, 4vw, 1.2rem)" }}
            >
              {product.subtitle}
            </p>
          </div>
        </div>

        <div className="h-px w-full" style={{ background: `${product.accentColor}22` }} />

        <div className="flex flex-col gap-2">
          {product.ingredients.map((line, i) => (
            <p key={i} className="font-inter text-[#8A8A8A]" style={{ fontSize: "clamp(0.8rem, 3.2vw, 1rem)" }}>
              {line.join("  ·  ")}
            </p>
          ))}
        </div>
      </div>

      {/* Bottle image */}
      <div className="relative flex-shrink-0 -my-2 -mr-1" style={{ width: 132, height: 210 }}>
        {!imgError ? (
          <Image
            src={product.bottleImg}
            alt={product.name}
            fill
            className="object-contain object-right drop-shadow-2xl"
            sizes="132px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full rounded-[20px] flex items-center justify-center"
            style={{
              background: `${product.accentColor}12`,
              border: `1px solid ${product.accentColor}30`,
            }}
          >
            {product.icon}
          </div>
        )}
        <div className="absolute -inset-4 rounded-full blur-2xl -z-10 opacity-15" style={{ backgroundColor: product.accentColor }} />
      </div>
    </article>
  );
}

function LeafIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  );
}

function BeetIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="14" r="6" />
      <path d="M12 8V4" />
      <path d="M9 5c1 1 3 1 3 3" />
      <path d="M15 5c-1 1-3 1-3 3" />
    </svg>
  );
}

function PineappleIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="14" rx="5" ry="6" />
      <path d="M12 8V4" />
      <path d="M9 6l3-3 3 3" />
      <path d="M9 10l3 2 3-2" />
    </svg>
  );
}
