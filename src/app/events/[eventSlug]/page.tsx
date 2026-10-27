/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ShieldCheck, ArrowLeft, AlertCircle, Clock, Layers, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PublicEventVoting } from "@/components/events/PublicEventVoting";
import { EventCountdownTimer } from "@/components/events/EventCountdownTimer";
import type { EventStatus } from "@prisma/client";

interface PageProps {
  params: Promise<{
    eventSlug: string;
  }>;
}

export const dynamic = "force-dynamic";

function getPublicStatusBadge(status: EventStatus) {
  switch (status) {
    case "LIVE":
      return (
        <Badge variant="live" className="flex items-center gap-1.5 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">Live for Voting</span>
        </Badge>
      );
    case "SCHEDULED":
      return (
        <Badge variant="warning" className="px-3 py-1 font-semibold">
          Voting Opens Soon
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge variant="secondary" className="px-3 py-1">
          Voting Closed
        </Badge>
      );
    case "FINALIZED":
      return (
        <Badge variant="glow" className="px-3 py-1 font-semibold">
          Official Winners Finalized
        </Badge>
      );
    case "DRAFT":
    default:
      return (
        <Badge variant="outline" className="px-3 py-1">
          Draft (Preview Only)
        </Badge>
      );
  }
}

export default async function PublicEventPage({ params }: PageProps) {
  const { eventSlug } = await params;
  const currentUser = await getCurrentUser();

  // Retrieve event with real categories and nominees from PostgreSQL
  const dbEvent = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: {
      organizer: true,
      categories: {
        include: {
          nominees: {
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  // Handle DRAFT events: only the owner can view in private preview mode
  if (dbEvent && dbEvent.status === "DRAFT") {
    const isOwner = currentUser && currentUser.id === dbEvent.organizerId;
    if (!isOwner) {
      // Anonymous visitors or non-owners receive 404 / unpublished response
      notFound();
    }
  }

  // Handle non-existent slug
  if (!dbEvent) {
    notFound();
  }

  const isOwnerPreview = dbEvent.status === "DRAFT";
  const totalNominees = dbEvent.categories.reduce((acc, cat) => acc + cat.nominees.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Back Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Explore all awards</span>
            </Link>

            {currentUser && currentUser.id === dbEvent.organizerId && (
              <Link href={`/dashboard/events/${dbEvent.id}`}>
                <Button variant="outline" size="sm" className="text-xs">
                  Organizer Management Console
                </Button>
              </Link>
            )}
          </div>

          {/* Owner Draft Preview Banner */}
          {isOwnerPreview && (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Organizer Preview Mode:</strong> This awards event is currently in <strong>Draft</strong> status and is completely hidden from public visitors until published.
                </span>
              </div>
              <Link href={`/dashboard/events/${dbEvent.id}`}>
                <Button variant="primaryGlow" size="sm" className="text-xs shrink-0">
                  Manage & Publish
                </Button>
              </Link>
            </div>
          )}

          {/* Event Header Card */}
          <div className="rounded-3xl border border-slate-800 bg-[#0c1226] shadow-2xl relative overflow-hidden">
            {/* Optional Banner Image */}
            {dbEvent.bannerUrl && (
              <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden bg-slate-950 border-b border-slate-800">
                <img
                  src={dbEvent.bannerUrl}
                  alt={dbEvent.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1226] via-[#0c1226]/50 to-transparent" />
              </div>
            )}

            <div className="p-8 md:p-12 relative z-10 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                {getPublicStatusBadge(dbEvent.status)}
                <span className="text-xs text-slate-400">
                  Organized by: <strong className="text-slate-200">{dbEvent.organizer.organization || dbEvent.organizer.name}</strong>
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-400">
                  {dbEvent.categories.length} Categories ({totalNominees} Nominees)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {dbEvent.logoUrl && (
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shrink-0 shadow-lg">
                    <img
                      src={dbEvent.logoUrl}
                      alt={`${dbEvent.name} logo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                  {dbEvent.name}
                </h1>
              </div>

              <p className="text-slate-300 max-w-3xl text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                {dbEvent.description}
              </p>

              <div className="pt-4 flex flex-wrap gap-8 text-sm text-slate-400 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-400" />
                  <span>
                    Event Window: {new Date(dbEvent.startDate).toLocaleDateString()} – {new Date(dbEvent.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  <span>
                    Voting: {new Date(dbEvent.votingStartsAt).toLocaleDateString()} – {new Date(dbEvent.votingEndsAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>
                    {dbEvent.votingRule === "ONE_VOTE_PER_EVENT"
                      ? "Limit: 1 vote per verified phone across event"
                      : "Limit: 1 vote per verified phone per category"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Interactive Countdown Timer */}
          <EventCountdownTimer
            votingStartsAt={dbEvent.votingStartsAt.toISOString()}
            votingEndsAt={dbEvent.votingEndsAt.toISOString()}
            status={dbEvent.status}
          />

          {/* Published Results Banner */}
          {dbEvent.resultsPublished && dbEvent.status === "FINALIZED" && (
            <div className="rounded-3xl border border-amber-600/50 bg-gradient-to-r from-amber-950/40 via-violet-950/30 to-[#0c1226] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/30 flex items-center justify-center shrink-0">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Official Results & Winners Certified</h3>
                  <p className="text-xs text-slate-300">
                    The competition has concluded and official certified outcomes are now available to view.
                  </p>
                </div>
              </div>
              <Link href={`/events/${dbEvent.slug}/results`}>
                <Button variant="primaryGlow" size="sm" className="text-xs shrink-0 flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 text-amber-300" />
                  <span>View Official Results</span>
                </Button>
              </Link>
            </div>
          )}

          {/* Real Categories & Nominees Section */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Award Categories & Nominees</h2>
              <p className="text-sm text-slate-400">
                Explore official nominees competing in each category. Verified phone OTP voting is enforced on the server.
              </p>
            </div>

            {dbEvent.categories.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-[#0a0f20]/60 p-12 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-950/60 text-violet-400">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-white">No categories published yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  The organizer is currently setting up the official categories and nominee rosters for this event.
                </p>
              </div>
            ) : (
              <PublicEventVoting
                eventId={dbEvent.id}
                eventName={dbEvent.name}
                eventStatus={dbEvent.status}
                categories={dbEvent.categories}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
