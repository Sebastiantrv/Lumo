export default function Footer() {
  return (
    <footer className="px-6 md:px-12 py-8 border-t border-[#F5F0E8]/10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-cormorant text-lg tracking-[0.35em] font-semibold text-[#F5F0E8]/60">
          L U M O
        </span>
        <p className="font-inter text-[#8A8A8A]/50 text-xs text-center">
          Jugos prensados en frío. Hechos cada mañana. Lotes limitados.
        </p>
        <p className="font-inter text-[#8A8A8A]/30 text-xs">
          © {new Date().getFullYear()} LUMO
        </p>
      </div>
    </footer>
  );
}
