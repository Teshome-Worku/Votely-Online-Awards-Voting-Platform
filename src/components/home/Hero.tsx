import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Smartphone, CheckCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 bg-radial-gradient" />
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-80 w-80 rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          {/* Top Pill / Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-950/40 px-3.5 py-1.5 text-xs font-medium text-violet-300 backdrop-blur-md shadow-sm shadow-violet-900/40">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>Ethiopian & Global Awards Platform • Version 1.0</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl leading-[1.15]">
            Professional Online Awards,{" "}
            <span className="text-gradient-violet">
              Transparent & Verified.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base text-slate-300 sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Create, manage, and publish your awards event in minutes without building a custom website.
            Voters participate securely via phone OTP verification—no voter accounts required.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button
                variant="primaryGlow"
                size="lg"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 text-base px-8 py-6 h-auto font-semibold"
              >
                <span>Create an awards event for free</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/events" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-base px-6 py-6 h-auto"
              >
                <Trophy className="h-4 w-4 text-violet-400" />
                <span>Discover Public Awards</span>
              </Button>
            </Link>
          </div>

          {/* Quick trust metrics */}
          <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-violet-950/60 text-violet-400 shrink-0">
                <Smartphone className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Phone OTP Security</p>
                <p className="text-[11px] text-slate-400">Verifies phone control; prevents bot and mass-script voting.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Server-Side Rules</p>
                <p className="text-[11px] text-slate-400">Strict database transactions prevent duplicate votes.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-violet-950/60 text-violet-400 shrink-0">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">Dedicated URLs</p>
                <p className="text-[11px] text-slate-400">Every published event receives a unique, shareable link.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
