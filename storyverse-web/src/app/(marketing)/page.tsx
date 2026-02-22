import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorksSection } from "@/components/marketing/HowItWorksSection";
import { CatalogPreviewSection } from "@/components/marketing/CatalogPreviewSection";
import { CtaSection } from "@/components/marketing/CtaSection";
import { getFullCatalog } from "@/lib/agents/catalog";

export const dynamic = "force-dynamic";

export default async function MarketingPage() {
  const catalog = await getFullCatalog();

  return (
    <>
      <Header />
      <main className="pt-14">
        <HeroSection />
        <HowItWorksSection />
        <CatalogPreviewSection catalog={catalog} />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
