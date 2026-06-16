import { Navbar } from "@/components/sections/Navbar";
import { FormSection } from "@/components/sections/FormSection";
import { Footer } from "@/components/sections/Footer";
import { getBrandLogoSrc } from "@/lib/brand";

export default function HomePage() {
  const logoSrc = getBrandLogoSrc();
  return (
    <main>
      <Navbar logoSrc={logoSrc} />
      <FormSection />
      <Footer logoSrc={logoSrc} />
    </main>
  );
}
