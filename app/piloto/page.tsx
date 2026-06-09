import Navbar from "@/components/Navbar";
import WaitlistSection from "@/components/WaitlistSection";

export default function PilotoPage() {
  return (
    <main style={{ background: "#F4EFE7", minHeight: "100svh" }}>
      <header>
        <Navbar />
      </header>
      <WaitlistSection />
    </main>
  );
}
