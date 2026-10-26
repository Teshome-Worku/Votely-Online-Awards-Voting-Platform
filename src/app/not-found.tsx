import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, Home, Trophy, ArrowRight, HelpCircle, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "404 — Page Not Found | Votely",
  description: "The page you are looking for does not exist on Votely.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24 relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="h-64 w-64 rounded-full bg-indigo-600/10 blur-2xl" />
        </div>

        <div className="relative max-w-xl w-full text-center space-y-8">
          {/* Badge & Icon */}
          <div className="space-y-4 flex flex-col items-center">
            <Badge variant="glow" className="px-3.5 py-1 text-xs font-semibold tracking-wider uppercase">
              404 — Error
            </Badge>

            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-950/40 border border-violet-500/30 text-violet-400 shadow-xl shadow-violet-900/20">
              <Compass className="h-10 w-10 animate-pulse" />
            </div>
          </div>

          {/* Heading and Description */}
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
              Page Not Found
            </h1>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              We couldn&apos;t find the page you were looking for. The link might be mistyped,
              the award event may have concluded, or the page has moved.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="primaryGlow" className="w-full sm:w-auto gap-2">
                <Home className="h-4 w-4" />
                <span>Return to Homepage</span>
              </Button>
            </Link>
            <Link href="/events" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto gap-2">
                <Trophy className="h-4 w-4 text-violet-400" />
                <span>Discover Awards</span>
              </Button>
            </Link>
          </div>

          {/* Quick Helpful Links */}
          <div className="pt-6 border-t border-slate-800/80">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mb-4">
              Looking for something specific?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <Link
                href="/login"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-950/60 text-violet-400 border border-violet-500/20">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-violet-300 transition-colors">
                      Organizer Portal
                    </div>
                    <div className="text-[11px] text-slate-400">Sign in to manage your events</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/how-it-works"
                className="group flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:border-violet-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/50">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-violet-300 transition-colors">
                      How Votely Works
                    </div>
                    <div className="text-[11px] text-slate-400">Learn about voting & awards</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
