import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PromesaSection from "@/components/landing/PromesaSection";
import FilosofiaSection from "@/components/landing/FilosofiaSection";
import EditorialBreak from "@/components/landing/EditorialBreak";
import ProcesoTimeline from "@/components/landing/ProcesoTimeline";
import FormulasSection from "@/components/FormulasSection";
import ExperienciaSection from "@/components/landing/ExperienciaSection";
import FaqSection from "@/components/landing/FaqSection";
import CierreSection from "@/components/landing/CierreSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <header>
        <Navbar />
      </header>

      {/* Conocer la marca */}
      <HeroSection />

      {/* Entender la filosofía */}
      <PromesaSection />
      <FilosofiaSection />

      <EditorialBreak>Las ideas, por sí solas, no bastan.</EditorialBreak>

      {/* Entender cómo trabajamos */}
      <ProcesoTimeline />

      {/* Conocer los productos */}
      <FormulasSection />

      <EditorialBreak>El cuidado no termina cuando cerramos la botella.</EditorialBreak>

      {/* Conocer la experiencia */}
      <ExperienciaSection />

      {/* Resolver dudas */}
      <FaqSection />

      {/* Reservar */}
      <CierreSection />

      <Footer />
    </main>
  );
}
