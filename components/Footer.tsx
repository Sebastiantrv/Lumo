export default function Footer() {
  return (
    <footer className="px-4 md:px-10 py-6 mt-4 mx-3 mb-3 md:mx-5 md:mb-4 rounded-2xl glass">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <span className="font-cormorant text-lg tracking-[0.35em] font-semibold text-[#F5F0E8]/50">
          L U M O
        </span>
        <p className="font-inter text-[#8A8A8A]/40 text-xs text-center">
          Jugos prensados en frío. Hechos cada mañana. Lotes limitados.
        </p>
        <p className="font-inter text-[#8A8A8A]/25 text-xs">
          © {new Date().getFullYear()} LUMO
        </p>
      </div>
    </footer>
  );
}
