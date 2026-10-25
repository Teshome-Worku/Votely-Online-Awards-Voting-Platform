import { Shield, KeyRound, Database, FileCheck, AlertTriangle } from "lucide-react";

export function TrustSection() {
  const pillars = [
    {
      icon: KeyRound,
      title: "One-Time Password (OTP) Verification",
      description:
        "Every vote submission requires a valid, short-lived SMS OTP sent directly to the voter's phone number. This prevents automated bots, disposable email farms, and script-based ballot stuffing.",
    },
    {
      icon: Database,
      title: "Server-Enforced Atomic Constraints",
      description:
        "Voting eligibility and single-vote limits are locked within database transactions on the server. Client-side requests cannot bypass voting rules or submit duplicate ballots.",
    },
    {
      icon: FileCheck,
      title: "Tamper-Evident Audit Trail",
      description:
        "Key administrative lifecycle changes—including schedule modifications, category adjustments, and result finalization—are logged in an audit ledger for full accountability.",
    },
    {
      icon: Shield,
      title: "Strict Organizer Isolation",
      description:
        "Multi-tenant security guarantees that organizers can only view and manage their own events. Raw system data and administrative operations remain strictly partitioned.",
    },
  ];

  return (
    <section className="py-20 bg-[#060914] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
            Transparency & Compliance
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built on Uncompromising Voting Integrity
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Awards only hold value when winners are chosen fairly. Votely pairs a frictionless voter experience with rigorous backend safeguards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-[#0a0f21]/70 p-6 flex items-start gap-4 hover:border-violet-500/30 transition-colors"
              >
                <div className="p-3 rounded-xl bg-violet-950/70 border border-violet-500/20 text-violet-400 shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsible Verification Notice */}
        <div className="mt-10 rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 sm:p-5 flex items-start gap-3.5 max-w-3xl mx-auto">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-300 space-y-1 leading-relaxed">
            <p className="font-semibold text-amber-300">
              Clear Verification Disclosure
            </p>
            <p className="text-slate-400">
              Phone OTP establishes control over a real mobile telephone number. It ensures that ballots are backed by real phone ownership, but does not claim full national ID verification. Votely operates with total transparency about what each verification layer provides.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
