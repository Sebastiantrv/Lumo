"use client";

import Image from "next/image";
import { useState } from "react";
import Reveal from "./landing/Reveal";
import SectionMarker from "./landing/SectionMarker";
import { PLANO } from "./landing/tokens";

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
    iconImg: "/icon-verde.png",
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
    iconImg: "/icon-rojo.png",
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
    iconImg: "/icon-tropical.png",
    icon: <PineappleIcon color="#B8860B" />,
    accentColor: "#B8860B",
    glowColor: "rgba(184, 134, 11, 0.15)",
  },
];

const SI_ENCONTRARAS = [
  "Ingredientes reales",
  "Información nutrimental",
  "Bioactivos destacados",
  "Producción diaria",
];

const NO_ENCONTRARAS = [
  "Azúcar añadida",
  "Conservadores",
  "Colorantes",
  "Concentrados",
];

export default function FormulasSection() {
  return (
    <section
      id="formulas"
      className="px-6 md:px-12 lg:px-20"
      style={{
        // No seam here: the ingredient band above opens this chapter,
        // and the two share one plane.
        background: PLANO.base,
        paddingTop: "clamp(3rem, 8vw, 5rem)",
        paddingBottom: "clamp(5rem, 12vw, 8rem)",
      }}
      aria-label="Nuestras fórmulas"
    >
      <div className="max-w-6xl mx-auto">
        <SectionMarker num="04" label="Las fórmulas" />

        <Reveal y={16} duration={1.1}>
          <div style={{ maxWidth: 620, marginBottom: "clamp(3rem, 8vw, 4.5rem)" }}>
            <h2
              className="font-cormorant font-light text-[#F5F0E8]"
              style={{
                fontSize: "clamp(1.9rem, 5.6vw, 2.9rem)",
                lineHeight: 1.18,
                letterSpacing: "-0.015em",
                marginBottom: "1.5rem",
              }}
            >
              Tres perfiles. Un mismo estándar.
            </h2>
            <p className="font-inter" style={{ fontSize: "0.95rem", lineHeight: 1.85, color: "#8A8A8A" }}>
              Cada receta fue diseñada para ofrecer un perfil distinto de sabor, utilizando
              ingredientes reales cuidadosamente seleccionados.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          {products.map((product, i) => (
            <Reveal key={product.id} delay={i * 0.1} y={20} duration={1}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        {/* ── Lo que encontrarás / lo que no ──
            Rendered once. These are brand-level promises, identical across
            all three formulas — repeating them per card would be noise. */}
        <Reveal y={18} duration={1.05}>
          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{
              marginTop: "clamp(3rem, 8vw, 4.5rem)",
              border: "1px solid rgba(245,240,232,0.09)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <ListaPromesa
              title="Lo que encontrarás"
              items={SI_ENCONTRARAS}
              tone="si"
            />
            <ListaPromesa
              title="Lo que no encontrarás"
              items={NO_ENCONTRARAS}
              tone="no"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ListaPromesa({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "si" | "no";
}) {
  const esSi = tone === "si";
  const color = esSi ? "#4A5E3A" : "#6A6A6A";

  return (
    <div
      className={esSi ? "md:border-r" : ""}
      style={{
        padding: "clamp(1.75rem, 5vw, 2.5rem)",
        borderRightColor: "rgba(245,240,232,0.09)",
        borderTop: "0",
      }}
    >
      <h3
        className="font-inter uppercase"
        style={{ fontSize: 10, letterSpacing: "0.2em", color, marginBottom: "1.5rem" }}
      >
        {title}
      </h3>
      <ul className="flex flex-col gap-3.5">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-3">
            <span style={{ color, flexShrink: 0, display: "flex" }} aria-hidden="true">
              {esSi ? <CheckMark /> : <CrossMark />}
            </span>
            <span
              className="font-inter"
              style={{
                fontSize: "0.88rem",
                color: esSi ? "#F5F0E8" : "#7A7A7A",
                textDecoration: esSi ? "none" : "none",
              }}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CheckMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);
  const [iconError, setIconError] = useState(false);

  return (
    <article
      className={`rounded-2xl p-6 md:p-9 grid grid-cols-[1fr_auto] lg:grid-cols-1 gap-6 items-center h-full ${product.glassClass}`}
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div
        className="absolute top-0 left-8 right-8 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${product.accentColor}50, transparent)` }}
      />

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex-shrink-0 overflow-hidden">
            {!iconError ? (
              <img src={product.iconImg} alt="" loading="lazy" onError={() => setIconError(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div className="w-full h-full rounded-full flex items-center justify-center"
                style={{ background: `${product.accentColor}18`, border: `1px solid ${product.accentColor}40` }}>
                {product.icon}
              </div>
            )}
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

      {/* Bottle image — narrow phones need the width back for the ingredient list */}
      <div
        className="relative flex-shrink-0 -my-2 -mr-1 lg:mx-auto lg:my-0"
        style={{ width: "clamp(104px, 30vw, 145px)", aspectRatio: "145 / 231" }}
      >
        {!imgError ? (
          <Image
            src={product.bottleImg}
            alt={product.name}
            fill
            loading="lazy"
            className="object-contain object-right drop-shadow-2xl"
            sizes="(max-width: 480px) 30vw, 145px"
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
