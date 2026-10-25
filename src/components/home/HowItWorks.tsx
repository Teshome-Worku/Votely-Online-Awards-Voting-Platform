import { Layers, Share2, Smartphone, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  {
    step: "01",
    title: "Create Event & Categories",
    description:
      "Sign in as an organizer, add your event branding, configure award categories, and list your nominees with photos and bios.",
    icon: Layers,
    badge: "Organizer Step",
  },
  {
    step: "02",
    title: "Configure Rules & Publish",
    description:
      "Set your voting window and enforce rules (e.g. 1 vote per phone number per category). Publish to generate a unique public event URL.",
    icon: Share2,
    badge: "Unique Event Link",
  },
  {
    step: "03",
    title: "Frictionless Voter OTP",
    description:
      "Voters open your event link, pick their nominees, and verify their phone via a fast SMS OTP. No voter registration or password needed.",
    icon: Smartphone,
    badge: "Voter Experience",
  },
  {
    step: "04",
    title: "Audit & Announce Winners",
    description:
      "Monitor participation in real-time, inspect server-verified tallies, resolve ties if needed, and publish official final results.",
    icon: Award,
    badge: "Transparent Results",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-20 bg-[#070b16] border-y border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-semibold tracking-wider uppercase text-violet-400">
            Engineered for Integrity
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How Votely Powers Seamless Awards
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            From event creation to certified winner announcements, our end-to-end awards platform
            guarantees verified participation and server-enforced vote integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative rounded-2xl border border-slate-800 bg-[#0c1224]/80 p-6 flex flex-col justify-between hover:border-violet-500/40 hover:bg-[#0e162c] transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-extrabold text-slate-700 group-hover:text-violet-500/50 transition-colors">
                      {item.step}
                    </span>
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-violet-950/60 border border-violet-500/20 text-violet-300">
                      {item.badge}
                    </span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-violet-600/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-violet-600 group-hover:text-white transition-all">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-200 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="/how-it-works">
            <Button variant="outline" className="text-sm">
              <span>Read the detailed organizer & voter guide</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
