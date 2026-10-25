"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Trophy, Calendar, Users, Eye, Sparkles, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Prototype demonstration card (explicitly labeled as prototype mockup per PRS)
const DEMO_EVENT = {
  id: "demo-sample-01",
  name: "Ethiopian Creative Arts & Music Awards 2026",
  slug: "ethiopian-creative-arts-2026",
  description:
    "Celebrating outstanding achievements across Ethiopian music, digital media, cinema, and cultural arts. Verified public voting powered by Votely OTP.",
  organizerName: "Addis Creative Guild",
  status: "live" as const,
  categoriesCount: 8,
  nomineesCount: 32,
  votingRule: "1 vote per category",
  votingEndsAt: "Nov 30, 2026",
  isDemonstration: true,
};

export function DiscoverySection() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [showDemoPreview, setShowDemoPreview] = React.useState(false);

  // In Phase 1, there are no live database events connected yet.
  const hasLiveEvents = false;

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

          {/* Search bar & filter */}
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
            { id: "finalized", label: "Results Published" },
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

        {/* Conditional rendering: Real events vs Graceful Empty State */}
        {!hasLiveEvents && !showDemoPreview ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-[#0a0e1e]/60 p-12 text-center max-w-2xl mx-auto space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-950/50 border border-violet-500/20 text-violet-400">
              <Trophy className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">
                No Public Awards Live at This Moment
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Votely is currently in its initial Phase 1 deployment. Once organizers publish their awards ceremonies,
                they will be indexed here.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/register">
                <Button variant="primaryGlow" size="sm">
                  Be the first to create an awards event
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDemoPreview(true)}
                className="flex items-center gap-1.5"
              >
                <Eye className="h-4 w-4" />
                <span>Preview Sample Award Card</span>
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 pt-2">
              Note: As per our PRS standards, Votely never invents fake competitions or fabricates voter statistics.
            </p>
          </div>
        ) : (
          /* When demonstration preview is toggled, display the preview clearly marked */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-violet-950/30 border border-violet-500/30 text-xs text-violet-300">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-400" />
                <span>
                  <strong>Prototype Demonstration Card:</strong> This is a labeled design template showcasing how published awards appear on Votely.
                </span>
              </div>
              <button
                onClick={() => setShowDemoPreview(false)}
                className="underline hover:text-white cursor-pointer ml-4 shrink-0"
              >
                Dismiss Preview
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-violet-500/30 bg-[#0d142b] p-6 flex flex-col justify-between hover:border-violet-400/60 transition-all shadow-lg shadow-violet-950/30">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="live" className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Voting</span>
                    </Badge>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-900/60 text-violet-300 border border-violet-500/30">
                      Design Sample
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 leading-snug">
                    {DEMO_EVENT.name}
                  </h3>
                  <p className="text-xs text-violet-300/80 mb-3 font-medium">
                    Organized by: {DEMO_EVENT.organizerName}
                  </p>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-6">
                    {DEMO_EVENT.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5 text-violet-400" />
                      <span>{DEMO_EVENT.categoriesCount} Categories</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-violet-400" />
                      <span>{DEMO_EVENT.nomineesCount} Nominees</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Calendar className="h-3.5 w-3.5 text-violet-400" />
                      <span>Closes: {DEMO_EVENT.votingEndsAt}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/events/${DEMO_EVENT.slug}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full justify-center">
                        View Event Page
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
