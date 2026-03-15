import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { CatalogPreviewSection } from "@/components/marketing/CatalogPreviewSection";
import { CtaSection } from "@/components/marketing/CtaSection";
import { MarketingQuickNav } from "@/components/marketing/MarketingQuickNav";
import { getFullCatalog } from "@/lib/agents/catalog";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const catalog = await getFullCatalog();

  return (
    <>
      <Header />
      <main id="main-content" aria-label="Main content" className="pt-14">
        <MarketingQuickNav />
        <HeroSection />
        <HowItWorksSection />
        <CatalogPreviewSection catalog={catalog} />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
