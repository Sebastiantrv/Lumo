export default function Footer({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const light = theme === "light";

  return (
    <footer
      className={`px-4 md:px-10 mt-4 mx-3 mb-3 md:mx-5 md:mb-4 rounded-2xl max-w-7xl lg:mx-auto ${light ? "" : "glass"}`}
      style={light
        ? { padding: "1rem 1.5rem", borderTop: "1px solid rgba(0,0,0,0.06)" }
        : { padding: "1.5rem 2.5rem" }
      }
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-2">
        <span
          className="font-cormorant tracking-[0.3em] font-semibold"
          style={{
            fontSize: light ? "0.85rem" : "1.125rem",
            color: light ? "rgba(0,0,0,0.25)" : "rgba(245,240,232,0.5)",
          }}
        >
          L U M O
        </span>
        <p
          className="font-inter text-xs text-center"
          style={{ color: light ? "rgba(0,0,0,0.2)" : "rgba(138,138,138,0.4)" }}
        >
          Prensado en frío · Cada mañana
        </p>
        <p
          className="font-inter text-xs"
          style={{ color: light ? "rgba(0,0,0,0.15)" : "rgba(138,138,138,0.25)" }}
        >
          © {new Date().getFullYear()} LUMO
        </p>
      </div>
    </footer>
  );
}
