import Link from "next/link";
import { requireOrganizer } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import {
  Award,
  Plus,
  Trophy,
  Calendar,
  Layers,
  ExternalLink,
  Radio,
  FileEdit,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EventStatus, Prisma } from "@prisma/client";

export const metadata = {
  title: "Organizer Dashboard | Votely",
  description: "Manage your online awards competitions, categories, nominees, and voting results.",
};

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

function getStatusBadge(status: EventStatus) {
  switch (status) {
    case "LIVE":
      return (
        <Badge variant="live" className="flex items-center gap-1.5 px-2.5 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-xs">Live for Voting</span>
        </Badge>
      );
    case "SCHEDULED":
      return (
        <Badge variant="warning" className="px-2.5 py-0.5 text-xs font-semibold">
          Scheduled
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge variant="secondary" className="px-2.5 py-0.5 text-xs">
          Voting Closed
        </Badge>
      );
    case "FINALIZED":
      return (
        <Badge variant="glow" className="px-2.5 py-0.5 text-xs font-semibold">
          Finalized & Certified
        </Badge>
      );
    case "DRAFT":
    default:
      return (
        <Badge variant="outline" className="px-2.5 py-0.5 text-xs">
          Draft (Private)
        </Badge>
      );
  }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireOrganizer();
  const { status: statusFilter } = await searchParams;

  // Retrieve organizer's own events from database with real category & nominee counts
  const whereClause: Prisma.EventWhereInput = {
    organizerId: user.id,
  };

  if (statusFilter && statusFilter !== "ALL") {
    if (statusFilter === "CLOSED") {
      whereClause.status = { in: ["CLOSED", "FINALIZED", "ARCHIVED"] };
    } else if (
      statusFilter === "LIVE" ||
      statusFilter === "SCHEDULED" ||
      statusFilter === "DRAFT"
    ) {
      whereClause.status = statusFilter;
    }
  }

  const [events, allCounts] = await Promise.all([
    prisma.event.findMany({
      where: whereClause,
      include: {
        categories: {
          select: {
            id: true,
            nominees: { select: { id: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.groupBy({
      by: ["status"],
      where: { organizerId: user.id },
      _count: { id: true },
    }),
  ]);

  const countMap: Record<string, number> = {};
  for (const c of allCounts) {
    countMap[c.status] = c._count.id;
  }

  const totalAll = Object.values(countMap).reduce((a, b) => a + b, 0);
  const liveCount = countMap["LIVE"] || 0;
  const scheduledCount = countMap["SCHEDULED"] || 0;
  const draftCount = countMap["DRAFT"] || 0;
  const closedCount =
    (countMap["CLOSED"] || 0) +
    (countMap["FINALIZED"] || 0) +
    (countMap["ARCHIVED"] || 0);

  const activeFilter = statusFilter || "ALL";

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-[#0d1428] via-[#0c1226] to-[#120e2e] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 font-mono">
              Welcome back
            </span>
            <Badge variant="glow" className="text-[10px] px-2 py-0">
              {user.organization || "Independent Organizer"}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
            Manage your online awards competitions, monitor live verified voter participation, and certify official winners.
          </p>
        </div>

        <div className="relative z-10 shrink-0 flex flex-wrap items-center gap-3">
          <Link href="/dashboard/events/new">
            <Button
              variant="primaryGlow"
              className="text-xs font-bold py-2.5 px-4 flex items-center gap-2 shadow-lg shadow-violet-900/40"
            >
              <Plus className="h-4 w-4" />
              <span>Create Awards Event</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Database-Backed Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Link
          href="/dashboard?status=ALL"
          className="group rounded-3xl border border-slate-800 bg-[#0a0f22] p-5 sm:p-6 space-y-2 hover:border-violet-500/40 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Competitions</span>
            <div className="h-8 w-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {totalAll}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">All owned awards events</p>
        </Link>

        <Link
          href="/dashboard?status=LIVE"
          className="group rounded-3xl border border-slate-800 bg-[#0a0f22] p-5 sm:p-6 space-y-2 hover:border-emerald-500/40 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Live Voting</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Radio className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>{liveCount}</span>
            {liveCount > 0 && (
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Accepting phone votes now</p>
        </Link>

        <Link
          href="/dashboard?status=SCHEDULED"
          className="group rounded-3xl border border-slate-800 bg-[#0a0f22] p-5 sm:p-6 space-y-2 hover:border-amber-500/40 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Scheduled</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {scheduledCount}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Voting opens in future</p>
        </Link>

        <Link
          href="/dashboard?status=CLOSED"
          className="group rounded-3xl border border-slate-800 bg-[#0a0f22] p-5 sm:p-6 space-y-2 hover:border-indigo-500/40 transition-all shadow-lg"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Closed & Finalized</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {closedCount}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Concluded or certified</p>
        </Link>
      </div>

      {/* Main Section Header with Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-400" />
            <span>Your Awards Competitions</span>
          </h2>
          <p className="text-xs text-slate-400">
            {totalAll === 0
              ? "Start by publishing your first online awards event."
              : `Showing ${events.length} of ${totalAll} total competitions.`}
          </p>
        </div>

        {totalAll > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#090d1c] border border-slate-800 text-xs">
            <Link
              href="/dashboard?status=ALL"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeFilter === "ALL"
                  ? "bg-violet-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All ({totalAll})
            </Link>
            <Link
              href="/dashboard?status=LIVE"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeFilter === "LIVE"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Live ({liveCount})
            </Link>
            <Link
              href="/dashboard?status=SCHEDULED"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeFilter === "SCHEDULED"
                  ? "bg-amber-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Scheduled ({scheduledCount})
            </Link>
            <Link
              href="/dashboard?status=DRAFT"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeFilter === "DRAFT"
                  ? "bg-slate-700 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Drafts ({draftCount})
            </Link>
            <Link
              href="/dashboard?status=CLOSED"
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeFilter === "CLOSED"
                  ? "bg-indigo-600 text-white font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Closed ({closedCount})
            </Link>
          </div>
        )}
      </div>

      {/* First-Time Organizer Empty State (When Total Events === 0) */}
      {totalAll === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-[#0c1224] p-8 sm:p-12 text-center shadow-2xl space-y-8 max-w-3xl mx-auto">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-400 shadow-xl shadow-violet-900/30">
            <Trophy className="h-8 w-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Create your first awards event
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              You haven&apos;t created any awards competitions yet. Set up your categories, nominate contenders, configure voting rules, and publish your unique event URL.
            </p>
          </div>

          {/* 3-Step Guided Process Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <div className="rounded-2xl border border-slate-800 bg-[#080d1e] p-4 space-y-2">
              <div className="flex items-center gap-2 text-violet-400 font-bold text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-900/60 text-[10px]">
                  1
                </span>
                <span>Schedule & Details</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Configure event dates, voting windows, and generate unique shareable event URLs.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#080d1e] p-4 space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-900/60 text-[10px]">
                  2
                </span>
                <span>Categories & Nominees</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Add award categories, nominee bios, and photos with built-in relational integrity.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#080d1e] p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-900/60 text-[10px]">
                  3
                </span>
                <span>Verified Phone Voting</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Operate live voting with SMS OTP challenges, duplicate prevention, and certified results.
              </p>
            </div>
          </div>

          <div>
            <Link href="/dashboard/events/new">
              <Button
                variant="primaryGlow"
                className="text-xs font-bold py-3 px-6 shadow-xl shadow-violet-900/40"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                <span>Create Your First Event</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Filtered Empty State (When Events exist overall, but none match current filter) */}
      {totalAll > 0 && events.length === 0 && (
        <div className="rounded-3xl border border-slate-800 bg-[#0a0f22] p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-300">
            No events found matching filter: &ldquo;{activeFilter}&rdquo;
          </p>
          <p className="text-xs text-slate-500">
            Try selecting a different status filter or create a new awards event.
          </p>
          <div className="pt-2">
            <Link href="/dashboard?status=ALL">
              <Button variant="outline" size="sm" className="text-xs">
                View All Events ({totalAll})
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Populated Events List */}
      {events.length > 0 && (
        <div className="grid grid-cols-1 gap-5">
          {events.map((event) => {
            const totalNominees = event.categories.reduce(
              (acc, c) => acc + c.nominees.length,
              0
            );

            return (
              <div
                key={event.id}
                className="rounded-3xl border border-slate-800 bg-[#0a0f22] p-6 sm:p-7 hover:border-slate-700/80 transition-all shadow-xl space-y-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      {getStatusBadge(event.status)}
                      <span className="text-xs text-slate-500 font-mono">
                        /events/{event.slug}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {event.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 max-w-3xl">
                      {event.description}
                    </p>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Link href={`/dashboard/events/${event.id}`}>
                      <Button variant="primaryGlow" size="sm" className="text-xs font-semibold">
                        <span>Manage Event</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </Link>

                    <Link href={`/dashboard/events/${event.id}/results`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs text-amber-300 border-amber-900/40 hover:bg-amber-950/30"
                      >
                        <Trophy className="h-3.5 w-3.5 mr-1 text-amber-400" />
                        <span>Standings</span>
                      </Button>
                    </Link>

                    <Link href={`/dashboard/events/${event.id}/edit`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        <FileEdit className="h-3.5 w-3.5 mr-1" />
                        <span>Edit</span>
                      </Button>
                    </Link>

                    <Link href={`/events/${event.slug}`} target="_blank">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Event Metadata Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-800/80 bg-[#080d1e] p-3 space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                      Roster Structure
                    </span>
                    <p className="font-semibold text-slate-200">
                      {event.categories.length} {event.categories.length === 1 ? "Category" : "Categories"} • {totalNominees} {totalNominees === 1 ? "Nominee" : "Nominees"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-[#080d1e] p-3 space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                      Voting Rule
                    </span>
                    <p className="font-semibold text-slate-200">
                      {event.votingRule === "ONE_VOTE_PER_EVENT"
                        ? "1 Vote / Event"
                        : "1 Vote / Category"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-[#080d1e] p-3 space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                      Voting Starts
                    </span>
                    <p className="font-semibold text-slate-200 truncate">
                      {new Date(event.votingStartsAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800/80 bg-[#080d1e] p-3 space-y-0.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-500">
                      Voting Ends
                    </span>
                    <p className="font-semibold text-slate-200 truncate">
                      {new Date(event.votingEndsAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
