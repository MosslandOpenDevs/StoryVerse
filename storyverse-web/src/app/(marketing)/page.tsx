import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { CatalogPreviewSection } from "@/components/marketing/CatalogPreviewSection";
import { CtaSection } from "@/components/marketing/CtaSection";

export default function MarketingPage() {
  return (
    <>
      <Header />
      <main className="pt-14">
        <HeroSection />
        <HowItWorksSection />
        <CatalogPreviewSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
