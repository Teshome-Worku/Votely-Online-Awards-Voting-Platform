/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrganizer } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit3,
  ExternalLink,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventStatusActions } from "@/components/events/EventStatusActions";
import { CategoryManager } from "@/components/events/CategoryManager";
import { ShareableEventLink } from "@/components/events/ShareableEventLink";
import { ScheduleEditModal } from "@/components/events/ScheduleEditModal";
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
    <div className="space-y-8">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Competitions</span>
        </Link>
      </div>

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
              <Link href={`/dashboard/events/${event.id}/results`}>
                <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs text-amber-300 border-amber-800/40 hover:bg-amber-950/30">
                  <Trophy className="h-3.5 w-3.5 text-amber-400" />
                  <span>Standings & Results</span>
                </Button>
              </Link>

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

          {/* Prominent Shareable URL Component for Organizers */}
          <ShareableEventLink
            eventSlug={event.slug}
            eventName={event.name}
            isPublic={isPubliclyAvailable}
          />

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

              {(event.bannerUrl || event.logoUrl) && (
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Event Media & Branding
                  </span>
                  <div className="flex flex-wrap items-center gap-4">
                    {event.bannerUrl && (
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400">Banner</span>
                        <div className="h-20 w-36 rounded-xl border border-slate-700 overflow-hidden bg-slate-900">
                          <img
                            src={event.bannerUrl}
                            alt="Event Banner"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {event.logoUrl && (
                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400">Logo</span>
                        <div className="h-20 w-20 rounded-xl border border-slate-700 overflow-hidden bg-slate-900">
                          <img
                            src={event.logoUrl}
                            alt="Event Logo"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Timelines Card with Interactive Schedule Editing */}
            <div className="rounded-3xl border border-slate-800 bg-[#0d1326] p-6 sm:p-8 space-y-6 flex flex-col justify-between shadow-lg">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-400" />
                    <span>Schedules</span>
                  </h3>
                  <Badge variant="outline" className="text-[10px] uppercase font-mono">
                    {event.status}
                  </Badge>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-violet-400" />
                      <span>Event Window</span>
                    </span>
                    <p className="text-slate-200 pl-5 font-medium">
                      {new Date(event.startDate).toLocaleString()}
                    </p>
                    <p className="text-slate-400 pl-5 text-[11px]">to</p>
                    <p className="text-slate-200 pl-5 font-medium">
                      {new Date(event.endDate).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-1 pt-3 border-t border-slate-800">
                    <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Voting Window</span>
                    </span>
                    <p className="text-slate-200 pl-5 font-medium">
                      {new Date(event.votingStartsAt).toLocaleString()}
                    </p>
                    <p className="text-slate-400 pl-5 text-[11px]">to</p>
                    <p className="text-slate-200 pl-5 font-medium">
                      {new Date(event.votingEndsAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule Edit Button / Modal Trigger */}
              <ScheduleEditModal
                eventId={event.id}
                eventName={event.name}
                status={event.status}
                startDate={event.startDate.toISOString()}
                endDate={event.endDate.toISOString()}
                votingStartsAt={event.votingStartsAt.toISOString()}
                votingEndsAt={event.votingEndsAt.toISOString()}
              />
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
  );
}
