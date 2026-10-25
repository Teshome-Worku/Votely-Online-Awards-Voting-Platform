import Link from "next/link";
import { requireOrganizer } from "@/lib/guard";
import { logoutAction } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import {
  Award,
  Plus,
  LogOut,
  ShieldCheck,
  Trophy,
  Calendar,
  Layers,
  ExternalLink,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@prisma/client";

export const metadata = {
  title: "Organizer Dashboard | Votely",
  description: "Manage your online awards competitions, categories, nominees, and voting results.",
};

export const dynamic = "force-dynamic";

function getStatusBadge(status: EventStatus) {
  switch (status) {
    case "LIVE":
      return (
        <Badge variant="live" className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Voting</span>
        </Badge>
      );
    case "SCHEDULED":
      return <Badge variant="warning">Scheduled</Badge>;
    case "CLOSED":
      return <Badge variant="secondary">Voting Closed</Badge>;
    case "FINALIZED":
      return <Badge variant="glow">Finalized</Badge>;
    case "DRAFT":
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
}

export default async function DashboardPage() {
  const user = await requireOrganizer();

  // Retrieve organizer's own events from database
  const events = await prisma.event.findMany({
    where: { organizerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      {/* Dashboard Top Navigation */}
      <header className="border-b border-slate-800 bg-[#0a0e1e] px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 ring-1 ring-violet-400/40 transition-transform group-hover:scale-105">
                <Award className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Votely</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <Badge variant="glow" className="hidden sm:inline-flex">
              Organizer Dashboard
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-white">{user.name}</span>
              <span className="text-xs text-slate-400">{user.email}</span>
            </div>

            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/80"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Welcome Banner */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1428] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Welcome back, {user.name}
                </h1>
                <Badge variant="success" className="text-[10px]">
                  {user.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-400">
                {user.organization ? `${user.organization} • ` : ""}
                Account Role: <strong className="text-violet-300">{user.role}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard/events/new">
                <Button variant="primaryGlow" size="sm" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Awards Event</span>
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Public Site</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Real Events List or Empty State */}
          {events.length === 0 ? (
            /* Clear Empty State */
            <div className="rounded-3xl border border-dashed border-slate-800 bg-[#0a0f20]/60 p-10 sm:p-14 text-center max-w-3xl mx-auto space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-950/60 border border-violet-500/20 text-violet-400">
                <Trophy className="h-8 w-8" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Create your first awards event
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  You haven&apos;t created any awards competitions yet. Start by defining your event name, description, and voting dates.
                </p>
              </div>

              <div className="pt-2">
                <Link href="/dashboard/events/new">
                  <Button
                    variant="primaryGlow"
                    size="lg"
                    className="px-6 py-5 text-sm font-semibold inline-flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create your first event</span>
                  </Button>
                </Link>
              </div>

              {/* Event Roadmap Checklist */}
              <div className="pt-6 border-t border-slate-800 text-left">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  How event management works
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0d1428] space-y-2">
                    <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold">
                      <Calendar className="h-4 w-4" />
                      <span>1. Schedule & Details</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Configure event dates, voting windows, and generate unique event slugs.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0d1428] space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                      <Layers className="h-4 w-4" />
                      <span>2. Categories (Phase 4)</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Organize award categories and nominee rosters in the upcoming phase.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0d1428] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>3. Publish & Operate</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Transition from Draft to Scheduled/Live and manage voting lifecycle.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Events Table / Card Grid */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Your Awards Events</h2>
                  <p className="text-xs text-slate-400">
                    You have {events.length} event{events.length === 1 ? "" : "s"} under management.
                  </p>
                </div>

                <Link href="/dashboard/events/new">
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Event</span>
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="rounded-3xl border border-slate-800 bg-[#0d1326] p-6 flex flex-col justify-between hover:border-violet-500/40 transition-all shadow-xl group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        {getStatusBadge(evt.status)}
                        <span className="text-[11px] font-mono text-slate-400">
                          /events/{evt.slug}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                          {evt.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {evt.description}
                        </p>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-violet-400" />
                          <span>Event: {new Date(evt.startDate).toLocaleDateString()} – {new Date(evt.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-indigo-400" />
                          <span>Voting: {new Date(evt.votingStartsAt).toLocaleDateString()} – {new Date(evt.votingEndsAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      <Link href={`/dashboard/events/${evt.id}`} className="w-full">
                        <Button variant="primaryGlow" size="sm" className="w-full justify-center text-xs">
                          <span>Manage Event</span>
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                      </Link>

                      <Link href={`/events/${evt.slug}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2.5 text-slate-400 hover:text-white"
                          title="Preview public page"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
