import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WaitlistSection from "@/components/WaitlistSection";

export default function PilotoPage() {
  return (
    <main style={{ background: "#F4EFE7", minHeight: "100svh", display: "flex", flexDirection: "column" }}>
      <header>
        <Navbar theme="light" />
      </header>
      <div style={{ flex: 1 }}>
        <WaitlistSection />
      </div>
      <Footer theme="light" />
    </main>
  );
}
