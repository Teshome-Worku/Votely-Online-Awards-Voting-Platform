import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Globe, Award, Shield, Check, Lock } from "lucide-react";

export const metadata = {
  title: "About Votely | Ethiopia & Global Awards Platform",
  description:
    "Votely was founded to bring credibility, transparency, and accessible online voting to awards competitions in Ethiopia and worldwide.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="border-b border-slate-800 bg-[#090d1f] py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="glow">About Votely</Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              A Trusted Standard for Online Awards
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              We empower organizations to celebrate human achievement with transparent, tamper-resistant digital voting.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Mission & Market */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Initial Market & Expansion
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Rooted in Ethiopia, Built for the World
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Awards in emerging markets face distinct hurdles: voters are predominantly mobile-first, and trust in online voting systems is historically challenged by bot scripts and unverified polling forms.
                </p>
                <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                  Votely solves this by anchoring voting verification directly to mobile numbers via reliable SMS OTP, removing the barrier of voter account creation while eliminating fraudulent duplicate votes.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-[#0c1228] p-8 space-y-4 shadow-xl">
                <div className="flex items-center gap-3 text-violet-400">
                  <Globe className="h-6 w-6" />
                  <h3 className="font-bold text-white text-lg">Market Focus</h3>
                </div>
                <ul className="space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Specialized SMS provider integration tailored for Ethiopian mobile telecom networks.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Mobile-first interface optimized for varying bandwidth conditions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Multi-regional compliance and scalable architecture ready for pan-African and global expansion.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Core Principles */}
            <div className="space-y-8 pt-8 border-t border-slate-800" id="transparency">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
                  Our Commitments
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Guiding Integrity Principles
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-800 bg-[#0c1228] p-6 space-y-3">
                  <Award className="h-6 w-6 text-violet-400" />
                  <h3 className="text-lg font-bold text-white">Awards-Only Scope</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Version 1 is laser-focused on awards competitions. We intentionally avoid political elections or arbitrary polls to ensure our voting mechanics are tuned to perfection.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0c1228] p-6 space-y-3">
                  <Shield className="h-6 w-6 text-violet-400" />
                  <h3 className="text-lg font-bold text-white">Server-Enforced Truth</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Voting limits are enforced by backend database constraints. No browser script, API tampering, or rapid retry can record duplicate votes.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0c1228] p-6 space-y-3" id="privacy">
                  <Lock className="h-6 w-6 text-violet-400" />
                  <h3 className="text-lg font-bold text-white">Data Minimization</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    We collect only the bare minimum required to enforce single-vote rules and deliver SMS OTP challenges. We do not sell voter data or profile individuals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
