import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PromesaSection from "@/components/landing/PromesaSection";
import FilosofiaSection from "@/components/landing/FilosofiaSection";
import EditorialBreak from "@/components/landing/EditorialBreak";
import ProcesoTimeline from "@/components/landing/ProcesoTimeline";
import IngredientesBand from "@/components/landing/IngredientesBand";
import FormulasSection from "@/components/FormulasSection";
import ExperienciaSection from "@/components/landing/ExperienciaSection";
import FaqSection from "@/components/landing/FaqSection";
import CierreSection from "@/components/landing/CierreSection";
import ScrollProgress from "@/components/landing/ScrollProgress";
import Footer from "@/components/Footer";

/**
 * Chapters alternate planes so every boundary is felt, not just read.
 * The editorial breaks stay on the plane of the chapter they close.
 *
 *   hero        base
 *   01 promesa  raised   ← the statement, largest type on the page
 *   02 filosofía base
 *      break     base
 *   03 proceso  raised
 *   04 fórmulas base     ← opened full-bleed by the ingredient band
 *      break     base
 *   05 experiencia raised
 *   06 preguntas base    ← deliberately the quietest
 *      cierre    deep
 */
export default function Home() {
  return (
    <main>
      <header>
        <Navbar />
      </header>

      <ScrollProgress />

      <HeroSection />

      <PromesaSection />
      <FilosofiaSection />

      <EditorialBreak tone="base">Las ideas, por sí solas, no bastan.</EditorialBreak>

      <ProcesoTimeline />

      <IngredientesBand />
      <FormulasSection />

      <EditorialBreak tone="base">El cuidado no termina cuando cerramos la botella.</EditorialBreak>

      <ExperienciaSection />
      <FaqSection />

      <CierreSection />

      <Footer />
    </main>
  );
}
