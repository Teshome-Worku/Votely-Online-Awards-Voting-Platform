import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { calculateEventResults } from "@/lib/results";
import { ResultsBreakdown } from "@/components/events/ResultsBreakdown";
import {
  Trophy,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Lock,
} from "lucide-react";

interface PageProps {
  params: Promise<{
    eventSlug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function PublicEventResultsPage({ params }: PageProps) {
  const { eventSlug } = await params;

  const event = await prisma.event.findUnique({
    where: { slug: eventSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      resultsPublished: true,
      resultsPublishedAt: true,
      finalizedAt: true,
    },
  });

  if (!event) {
    notFound();
  }

  // If results have not been finalized or published, show clear friendly state
  const isPubliclyAvailable = event.status === "FINALIZED" && event.resultsPublished;

  let results = null;
  if (isPubliclyAvailable) {
    results = await calculateEventResults(event.id);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      <Navbar />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Navigation */}
          <div>
            <Link
              href={`/events/${event.slug}`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Event Voting Overview</span>
            </Link>
          </div>

          {/* Hero Header */}
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0f1730] to-[#0a0e20] p-6 sm:p-10 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="glow" className="flex items-center gap-1.5 px-3 py-1">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold">Official Results</span>
              </Badge>
              {isPubliclyAvailable && (
                <Badge variant="success" className="flex items-center gap-1.5 px-3 py-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Certified & Published</span>
                </Badge>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              {event.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {event.description}
            </p>

            {isPubliclyAvailable && event.finalizedAt && (
              <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-violet-400" />
                <span>
                  Official results finalized on {new Date(event.finalizedAt).toLocaleDateString()} with tamper-proof audit snapshot.
                </span>
              </div>
            )}
          </div>

          {/* State 1: Unpublished or Pending */}
          {!isPubliclyAvailable && (
            <div className="rounded-3xl border border-slate-800 bg-[#0d1428] p-10 sm:p-16 text-center space-y-6 shadow-xl max-w-2xl mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                <Clock className="h-7 w-7" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Results Pending Official Release</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Official winners and standings for <strong>{event.name}</strong> have not been certified or publicly published yet. Please check back after voting concludes and results are certified.
                </p>
              </div>
              <div>
                <Link href={`/events/${event.slug}`}>
                  <Button variant="primaryGlow" size="sm" className="text-xs">
                    View Event Information
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* State 2: Published Official Results */}
          {isPubliclyAvailable && results && (
            <ResultsBreakdown results={results} isPublicView={true} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
