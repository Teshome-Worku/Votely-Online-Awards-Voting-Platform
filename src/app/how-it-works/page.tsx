import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "How Votely Works | Transparent Awards Voting",
  description:
    "Learn how organizers create and manage online awards competitions, and how voters cast OTP-verified ballots securely without needing an account.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <section className="border-b border-slate-800 bg-[#090d1f] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="glow">Platform Architecture & Workflow</Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              How Votely Works
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Votely replaces custom development and messy ballot boxes with an elegant, tamper-resistant awards workflow engineered specifically for Ethiopian and global organizers.
            </p>
          </div>
        </section>

        {/* Two-Track Experience: Organizers vs Voters */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Track 1: The Organizer Experience */}
            <div className="rounded-3xl border border-slate-800 bg-[#0a0f20] p-8 md:p-12 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                    Track 1
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    For Awards Organizers
                  </h2>
                </div>
                <Link href="/auth/register">
                  <Button variant="primaryGlow" size="sm">
                    Create Your Event
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#0e162e] space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-white">Event & Category Setup</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Define your event profile, upload banners, and establish competitive categories (e.g., &ldquo;Best Mobile App&rdquo;, &ldquo;Artist of the Year&rdquo;). Add nominees with biographies and visual media.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#0e162e] space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-white">Enforce Voting Rules</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Set precise voting schedules (start date, end date) and configure voting restrictions (such as one verified vote per category). Generate a dedicated public URL like <code className="text-violet-300 bg-violet-950/60 px-1 py-0.5 rounded text-xs">votely.app/events/your-event</code>.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#0e162e] space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="text-lg font-bold text-white">Audit & Announce Winners</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Inspect incoming participation in real time. When voting closes, verify standings, resolve ties through documented processes, and publish official final results.
                  </p>
                </div>
              </div>
            </div>

            {/* Track 2: The Voter Experience */}
            <div className="rounded-3xl border border-slate-800 bg-[#0a0f20] p-8 md:p-12 space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Track 2
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                    For Public Voters
                  </h2>
                </div>
                <Badge variant="success" className="w-fit">
                  Zero Registration Required
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#0e162e] space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-white">Open the Event Link</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Click an organizer&apos;s shared link on social media, messaging apps, or discover it on the Votely homepage. Browse nominees across all active categories.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#0e162e] space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-white">Quick Phone OTP</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Select your preferred nominee and enter your Ethiopian or international mobile number. Receive a single-use 6-digit SMS code to verify your ballot.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-slate-800/80 bg-[#0e162e] space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="text-lg font-bold text-white">Instant Confirmation</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    The server checks the voting window, records the ballot atomically, and locks that phone number from voting again in that category. Instant on-screen receipt provided.
                  </p>
                </div>
              </div>
            </div>

            {/* Voting Integrity Guarantee */}
            <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 to-slate-900/60 p-8 sm:p-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-600 text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Why Phone OTP Beats Traditional Online Polls
                  </h3>
                  <p className="text-xs text-violet-300">
                    Eliminating disposable emails, VPN spoofing, and automated browser bots.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Single-use OTP code that expires in 5 minutes</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Atomic database transactions prevent duplicate votes</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Strict IP and telephone rate limits against abuse</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Zero passwords or account registrations for voters</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
