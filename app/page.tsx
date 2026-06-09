import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FormulasSection from "@/components/FormulasSection";
import ProcesoSection from "@/components/ProcesoSection";
import WaitlistSection from "@/components/WaitlistSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <header>
        <Navbar />
      </header>
      <HeroSection />
      <div className="mx-6 md:mx-12 h-px bg-[#F5F0E8]/8" />
      <FormulasSection />
      <div className="mx-6 md:mx-12 h-px bg-[#F5F0E8]/8" />
      <ProcesoSection />
      <div className="mx-6 md:mx-12 h-px bg-[#F5F0E8]/8" />
      <WaitlistSection />
      <Footer />
    </main>
  );
}
