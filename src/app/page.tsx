import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { DiscoverySection, type PublicEventItem } from "@/components/home/DiscoverySection";
import { TrustSection } from "@/components/home/TrustSection";
import { OrganizerCta } from "@/components/home/OrganizerCta";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dbEvents = await prisma.event.findMany({
    where: {
      status: { in: ["LIVE", "SCHEDULED", "CLOSED", "FINALIZED"] },
    },
    include: {
      organizer: true,
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const publishedEvents: PublicEventItem[] = dbEvents.map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    description: e.description,
    organizerName: e.organizer.organization || e.organizer.name,
    status: e.status,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
    votingStartsAt: e.votingStartsAt.toISOString(),
    votingEndsAt: e.votingEndsAt.toISOString(),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <DiscoverySection publishedEvents={publishedEvents} />
        <HowItWorks />
        <TrustSection />
        <OrganizerCta />
      </main>
      <Footer />
    </div>
  );
}
