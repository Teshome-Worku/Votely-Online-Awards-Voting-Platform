import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizer } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import {
  Award,
  ArrowLeft,
  Calendar,
  Clock,
  Edit3,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventStatusActions } from "@/components/events/EventStatusActions";
import { CategoryManager } from "@/components/events/CategoryManager";
import type { EventStatus } from "@prisma/client";

export const metadata = {
  title: "Manage Awards Event | Votely",
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{
    eventId: string;
  }>;
}

function getStatusBadge(status: EventStatus) {
  switch (status) {
    case "LIVE":
      return (
        <Badge variant="live" className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Voting</span>
        </Badge>
      );
    case "SCHEDULED":
      return <Badge variant="warning">Scheduled</Badge>;
    case "CLOSED":
      return <Badge variant="secondary">Voting Closed</Badge>;
    case "FINALIZED":
      return <Badge variant="glow">Finalized & Certified</Badge>;
    case "DRAFT":
    default:
      return <Badge variant="outline">Draft (Private)</Badge>;
  }
}

export default async function EventManagePage({ params }: Props) {
  const { eventId } = await params;
  const user = await requireOrganizer();

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
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

  // Strict ownership check: Must exist and belong to the logged-in organizer
  if (!event || event.organizerId !== user.id) {
    notFound();
  }

  const isPubliclyAvailable = event.status !== "DRAFT" && event.status !== "ARCHIVED";

  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      {/* Top Header */}
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
              Event Management
            </span>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Top Title Bar */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1428] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                {getStatusBadge(event.status)}
                <span className="text-xs text-slate-400 font-mono">
                  Slug: /events/{event.slug}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                {event.name}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/dashboard/events/${event.id}/edit`}>
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Details</span>
                </Button>
              </Link>

              <Link href={`/events/${event.slug}`} target="_blank">
                <Button variant="primaryGlow" size="sm" className="flex items-center gap-1.5 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Public Event Page</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Lifecycle & Status Transition Controls */}
          <div className="rounded-3xl border border-slate-800 bg-[#0a0f21] p-6 sm:p-8 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Event Lifecycle Management</h2>
                <p className="text-xs text-slate-400">
                  Transition this event between allowed operational states. Server-enforced rules prevent invalid state changes.
                </p>
              </div>
              <div>
                {isPubliclyAvailable ? (
                  <Badge variant="success" className="text-[10px]">
                    Publicly Discoverable
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    Private to Organizer
                  </Badge>
                )}
              </div>
            </div>

            <EventStatusActions eventId={event.id} currentStatus={event.status} />
          </div>

          {/* Event Details & Schedule Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Description & Overview */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-[#0d1326] p-6 sm:p-8 space-y-4">
              <h3 className="text-base font-bold text-white">Event Description</h3>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>

              {event.bannerUrl && (
                <div className="pt-4 border-t border-slate-800">
                  <span className="text-xs font-semibold text-slate-400">Banner URL:</span>
                  <p className="text-xs font-mono text-violet-300 break-all">{event.bannerUrl}</p>
                </div>
              )}
            </div>

            {/* Timelines Card */}
            <div className="rounded-3xl border border-slate-800 bg-[#0d1326] p-6 sm:p-8 space-y-6">
              <h3 className="text-base font-bold text-white">Schedules</h3>

              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-violet-400" />
                    <span>Event Window</span>
                  </span>
                  <p className="text-slate-200 pl-5.5 font-medium">
                    {new Date(event.startDate).toLocaleString()}
                  </p>
                  <p className="text-slate-400 pl-5.5">to</p>
                  <p className="text-slate-200 pl-5.5 font-medium">
                    {new Date(event.endDate).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-1 pt-3 border-t border-slate-800">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    <span>Voting Window</span>
                  </span>
                  <p className="text-slate-200 pl-5.5 font-medium">
                    {new Date(event.votingStartsAt).toLocaleString()}
                  </p>
                  <p className="text-slate-400 pl-5.5">to</p>
                  <p className="text-slate-200 pl-5.5 font-medium">
                    {new Date(event.votingEndsAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category and Nominee Management Section */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1428] p-6 sm:p-8 shadow-xl">
            <CategoryManager
              eventId={event.id}
              eventStatus={event.status}
              categories={event.categories}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
