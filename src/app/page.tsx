import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { MantraRibbon } from "@/components/sections/MantraRibbon";
import { AboutStrip } from "@/components/sections/AboutStrip";
import { SanghaStats } from "@/components/sections/SanghaStats";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { MantraSection } from "@/components/sections/MantraSection";
import { FormSection } from "@/components/sections/FormSection";
import { Footer } from "@/components/sections/Footer";
import { LotusDivider } from "@/components/decor/LotusDivider";
import { getBrandLogoSrc } from "@/lib/brand";

export default function HomePage() {
  const logoSrc = getBrandLogoSrc();
  return (
    <main>
      <Navbar logoSrc={logoSrc} />
      <Hero />
      <MantraRibbon />
      <AboutStrip />
      <LotusDivider />
      <HowItWorks />
      <MantraSection />
      <FormSection />
      <SanghaStats />
      <Footer logoSrc={logoSrc} />
    </main>
  );
}
