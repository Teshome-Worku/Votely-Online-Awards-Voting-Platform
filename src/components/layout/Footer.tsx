import Link from "next/link";
import { Award, Shield, CheckCircle2, Globe2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#050811] text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & mission column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 ring-1 ring-violet-400/30">
                <Award className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Votely
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              The premier platform for professional online awards competitions.
              Empowering organizers in Ethiopia and worldwide to create, manage,
              and operate transparent, OTP-verified award events.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
              <Globe2 className="h-4 w-4 text-violet-400" />
              <span>Initial focus: Ethiopia • Ready for international scale</span>
            </div>
          </div>

          {/* Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/events" className="hover:text-violet-300 transition-colors">
                  Discover Awards
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-violet-300 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-violet-300 transition-colors">
                  Create an Event
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-violet-300 transition-colors">
                  Organizer Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Integrity Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Integrity & Trust
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Single-use OTP Verification</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Server-enforced Limits</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Immutable Audit Logs</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-violet-400" />
                <span>No Voter Account Required</span>
              </li>
            </ul>
          </div>

          {/* About & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Information
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-violet-300 transition-colors">
                  About Votely
                </Link>
              </li>
              <li>
                <Link href="/about#transparency" className="hover:text-violet-300 transition-colors">
                  Anti-Fraud Guidelines
                </Link>
              </li>
              <li>
                <Link href="/about#privacy" className="hover:text-violet-300 transition-colors">
                  Privacy & Data Minimalization
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and disclaimer */}
        <div className="mt-12 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Votely. Online Awards & Voting Platform (v1.0). All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Server-side verification</span>
            <span>•</span>
            <span>Zero duplicate votes</span>
            <span>•</span>
            <span>Transparent results</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
