import Link from "next/link";
import { ArrowRight, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrganizerCta() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-violet-500/30 bg-gradient-to-b from-[#131b38] to-[#0b0f22] p-8 sm:p-12 md:p-16 text-center overflow-hidden shadow-2xl shadow-violet-950/40">
          {/* Subtle glow circle */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

          <div className="relative max-w-2xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-950/60 px-3 py-1 text-xs font-medium text-violet-300">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              <span>Organizer Platform</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Ready to Host Your Awards Ceremony?
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Launch your online awards with categories, nominees, custom schedules, and guaranteed OTP-verified voting integrity. No development required.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="primaryGlow"
                  size="lg"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-6 h-auto text-base"
                >
                  <Trophy className="h-5 w-5 text-violet-300" />
                  <span>Create an awards event for free</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-6 py-6 h-auto text-base"
                >
                  Learn how it works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
