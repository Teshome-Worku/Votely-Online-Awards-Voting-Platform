import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { DiscoverySection } from "@/components/home/DiscoverySection";
import { TrustSection } from "@/components/home/TrustSection";
import { OrganizerCta } from "@/components/home/OrganizerCta";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <DiscoverySection />
        <HowItWorks />
        <TrustSection />
        <OrganizerCta />
      </main>
      <Footer />
    </div>
  );
}
