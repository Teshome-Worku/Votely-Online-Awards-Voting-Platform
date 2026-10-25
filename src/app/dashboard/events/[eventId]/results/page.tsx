import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizer } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { calculateEventResults } from "@/lib/results";
import { FinalizationPanel } from "@/components/events/FinalizationPanel";
import { ResultsBreakdown } from "@/components/events/ResultsBreakdown";
import {
  Award,
  ArrowLeft,
  ShieldCheck,
  History,
  FileCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Event Results & Standings | Votely",
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventResultsPage({ params }: PageProps) {
  const { eventId } = await params;
  const user = await requireOrganizer();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  // Strict ownership guard
  if (!event || event.organizerId !== user.id) {
    notFound();
  }

  // Calculate real standings directly from database votes
  const results = await calculateEventResults(eventId);
  if (!results) {
    notFound();
  }

  // Retrieve official audit log entries for this event
  const auditLogs = await prisma.auditLog.findMany({
    where: { eventId },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0a0e1e] px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 ring-1 ring-violet-400/40">
                <Award className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Votely</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Results & Standings
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/events/${event.id}`}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Event Overview</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Top Banner */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1428] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="glow" className="flex items-center gap-1.5">
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>Official Standings</span>
                </Badge>
                {results.resultsPublished && (
                  <Badge variant="live" className="text-[10px]">
                    Publicly Published
                  </Badge>
                )}
                <span className="text-xs text-slate-400 font-mono">
                  Slug: /events/{event.slug}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                {event.name} — Results
              </h1>
              <p className="text-xs text-slate-400">
                Real-time vote tallies, competitor rankings, and certified finalization controls.
              </p>
            </div>
          </div>

          {/* Finalization & Publication Control Panel */}
          <FinalizationPanel results={results} />

          {/* Detailed Standings & Nominee Leaderboards */}
          <ResultsBreakdown results={results} />

          {/* Certified Historical Audit Trail */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1428] p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <History className="h-5 w-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-white">Event Audit Log</h3>
                <p className="text-xs text-slate-400">
                  Tamper-evident record of all finalization, publication, and authorized correction events.
                </p>
              </div>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No audit actions recorded yet for this event.</p>
            ) : (
              <div className="space-y-2.5">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-800/80 bg-[#080d1e] p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-white">{log.action}</span>
                        <span className="text-slate-400 ml-2">by {log.user.name}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono sm:text-right">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
