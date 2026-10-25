import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, ShieldCheck, ArrowLeft, AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{
    eventSlug: string;
  }>;
}

export function generateStaticParams() {
  return [{ eventSlug: "ethiopian-creative-arts-2026" }];
}

// Sample categories and nominees for demonstration view per PRS Section 11 & Section 18
const DEMO_EVENT = {
  id: "demo-sample-01",
  slug: "ethiopian-creative-arts-2026",
  name: "Ethiopian Creative Arts & Music Awards 2026",
  description:
    "Celebrating outstanding achievements across Ethiopian music, digital media, cinema, and cultural arts. Verified public voting powered by Votely OTP.",
  organizerName: "Addis Creative Guild",
  status: "live",
  votingRule: "One vote per verified phone number per category",
  votingEndsAt: "November 30, 2026",
  categories: [
    {
      id: "cat-1",
      name: "Artist of the Year",
      nominees: [
        { id: "nom-1", name: "Rophnan", detail: "Electronic music pioneer & producer" },
        { id: "nom-2", name: "Danayt Mekbib", detail: "Acclaimed vocalist & composer" },
        { id: "nom-3", name: "Sami Dan", detail: "Contemporary reggae & fusion artist" },
      ],
    },
    {
      id: "cat-2",
      name: "Best New Digital Creator",
      nominees: [
        { id: "nom-4", name: "Addis Visuals Studio", detail: "Cultural cinematography collective" },
        { id: "nom-5", name: "Selam Storytellers", detail: "Independent documentary creators" },
      ],
    },
  ],
};

export default async function PublicEventPage({ params }: PageProps) {
  const { eventSlug } = await params;

  const isDemo = eventSlug === DEMO_EVENT.slug;

  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to all awards</span>
            </Link>
          </div>

          {isDemo ? (
            <div className="space-y-8">
              {/* Demonstration Notice Banner */}
              <div className="rounded-xl border border-violet-500/40 bg-violet-950/30 p-4 text-xs text-violet-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 text-violet-400 shrink-0" />
                  <span>
                    <strong>Prototype Public Event Page:</strong> Demonstrates the layout for published awards. Live organizer event creation and custom database slugs arrive in Phase 3.
                  </span>
                </div>
                <Badge variant="glow" className="shrink-0">
                  Phase 1 Preview Mode
                </Badge>
              </div>

              {/* Event Header Card */}
              <div className="rounded-3xl border border-slate-800 bg-[#0c1226] p-8 md:p-10 shadow-2xl relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="live" className="flex items-center gap-1.5 px-3 py-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-semibold">Live for Voting</span>
                    </Badge>
                    <span className="text-xs text-slate-400">
                      Organized by: <strong className="text-slate-200">{DEMO_EVENT.organizerName}</strong>
                    </span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                    {DEMO_EVENT.name}
                  </h1>

                  <p className="text-slate-300 max-w-3xl text-base sm:text-lg leading-relaxed">
                    {DEMO_EVENT.description}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-6 text-sm text-slate-400 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-violet-400" />
                      <span>{DEMO_EVENT.votingRule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-400" />
                      <span>Closes: {DEMO_EVENT.votingEndsAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories & Nominees Preview Section */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Award Categories</h2>
                  <p className="text-sm text-slate-400">
                    Voters can select one nominee per category and verify their vote via SMS OTP.
                  </p>
                </div>

                <div className="space-y-6">
                  {DEMO_EVENT.categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="rounded-2xl border border-slate-800/80 bg-[#0a0f20] p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-violet-400" />
                          <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                        </div>
                        <span className="text-xs text-slate-400">
                          {cat.nominees.length} Nominees
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                        {cat.nominees.map((nominee) => (
                          <div
                            key={nominee.id}
                            className="rounded-xl border border-slate-800 bg-[#0e162e] p-4 flex flex-col justify-between hover:border-violet-500/40 transition-colors group"
                          >
                            <div className="space-y-1 mb-4">
                              <h4 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                                {nominee.name}
                              </h4>
                              <p className="text-xs text-slate-400">{nominee.detail}</p>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="w-full text-xs justify-center"
                              title="Voting is enabled during live events in Phase 5"
                            >
                              Vote with OTP (Phase 5)
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Unregistered / Unknown Slug */
            <div className="rounded-2xl border border-slate-800 bg-[#0a0e1e] p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
                <AlertCircle className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-white">Event Not Found</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                The event slug &quot;{eventSlug}&quot; is either unpublished or not yet registered. In Phase 3, dynamic event slugs will be queried directly from the database.
              </p>
              <div className="pt-4 flex justify-center gap-3">
                <Link href="/events">
                  <Button variant="outline" size="sm">
                    Back to Public Directory
                  </Button>
                </Link>
                <Link href={`/events/${DEMO_EVENT.slug}`}>
                  <Button variant="primaryGlow" size="sm">
                    View Demo Sample Event
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
