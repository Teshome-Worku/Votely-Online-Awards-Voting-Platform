"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Trophy, Calendar, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PublicEventItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  organizerName: string;
  status: "DRAFT" | "SCHEDULED" | "LIVE" | "CLOSED" | "FINALIZED" | "ARCHIVED";
  startDate: string | Date;
  endDate: string | Date;
  votingStartsAt: string | Date;
  votingEndsAt: string | Date;
}

function getPublicStatusBadge(status: string) {
  switch (status) {
    case "LIVE":
      return (
        <Badge variant="live" className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Voting</span>
        </Badge>
      );
    case "SCHEDULED":
      return <Badge variant="warning">Voting Opens Soon</Badge>;
    case "CLOSED":
      return <Badge variant="secondary">Voting Closed</Badge>;
    case "FINALIZED":
      return <Badge variant="glow">Finalized</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function DiscoverySection({
  publishedEvents = [],
}: {
  publishedEvents?: PublicEventItem[];
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");

  // Filter published events
  const filteredEvents = publishedEvents.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizerName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedStatus === "all") return true;
    if (selectedStatus === "live") return event.status === "LIVE";
    if (selectedStatus === "upcoming") return event.status === "SCHEDULED";
    if (selectedStatus === "finalized") return event.status === "FINALIZED" || event.status === "CLOSED";
    return true;
  });

  const hasRealEvents = filteredEvents.length > 0;

  return (
    <section className="py-20 relative" id="discover">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <Badge variant="glow">Event Discovery</Badge>
              <span className="text-xs text-slate-400">Public Competitions</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Discover Published Awards
            </h2>
            <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-xl">
              Explore ongoing and upcoming awards events. When an organizer publishes their competition, it is discoverable here and through its unique URL.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search awards by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 text-sm bg-slate-900/90 border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-slate-800/80 mb-8">
          {[
            { id: "all", label: "All Events" },
            { id: "live", label: "Live Voting" },
            { id: "upcoming", label: "Upcoming" },
            { id: "finalized", label: "Results & Closed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedStatus === tab.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Real Events Grid */}
        {hasRealEvents ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-3xl border border-slate-800 bg-[#0d142b] p-6 flex flex-col justify-between hover:border-violet-500/40 transition-all shadow-xl group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    {getPublicStatusBadge(event.status)}
                    <span className="text-[11px] font-mono text-slate-400">
                      /events/{event.slug}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                      {event.name}
                    </h3>
                    <p className="text-xs text-violet-300/80 mt-1 font-medium">
                      Organized by: {event.organizerName}
                    </p>
                    <p className="text-sm text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-violet-400" />
                      <span>Event: {new Date(event.startDate).toLocaleDateString()} – {new Date(event.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Voting: {new Date(event.votingStartsAt).toLocaleDateString()} – {new Date(event.votingEndsAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-800/80">
                  <Link href={`/events/${event.slug}`} className="w-full">
                    <Button variant="primaryGlow" size="sm" className="w-full justify-center text-xs flex items-center gap-2">
                      <span>View Event Page</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Clean Production Empty State */
          <div className="rounded-3xl border border-dashed border-slate-800 bg-[#0a0e1e]/60 p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-950/50 border border-violet-500/20 text-violet-400">
              <Trophy className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">
                No Public Awards Live at This Moment
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Once organizers publish their competitions, they are indexed here for public discovery and verified voting.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button variant="primaryGlow" size="sm" className="flex items-center gap-2">
                  <span>Create an awards event</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="outline" size="sm">
                  <span>Learn how it works</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
