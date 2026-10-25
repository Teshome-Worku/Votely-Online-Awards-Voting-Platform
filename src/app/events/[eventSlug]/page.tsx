import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ShieldCheck, ArrowLeft, AlertCircle, Clock, Layers } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
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

  // Retrieve event from PostgreSQL
  const dbEvent = await prisma.event.findUnique({
    where: { slug: eventSlug },
    include: { organizer: true },
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
                  <strong>Organizer Preview Mode:</strong> This awards event is currently in <strong>Draft</strong> status and is completely hidden from public visitors until you publish it.
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
          <div className="rounded-3xl border border-slate-800 bg-[#0c1226] p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                {getPublicStatusBadge(dbEvent.status)}
                <span className="text-xs text-slate-400">
                  Organized by: <strong className="text-slate-200">{dbEvent.organizer.organization || dbEvent.organizer.name}</strong>
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                {dbEvent.name}
              </h1>

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
                  <span>Server-enforced OTP ballot integrity</span>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Placeholder / Phase 4 Scope */}
          <div className="rounded-3xl border border-slate-800/80 bg-[#0a0f20] p-8 sm:p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-950/60 border border-violet-500/30 text-violet-400">
              <Layers className="h-7 w-7" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-xl font-bold text-white">Award Categories & Nominees</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Categories and verified nominee rosters for this event will be officially listed once configured in Phase 4.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
