"use client";

import * as React from "react";
import Link from "next/link";
import { Award, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function RegisterPage() {
  const [formData, setFormData] = React.useState({
    organizerName: "",
    organization: "",
    email: "",
    phone: "",
    eventName: "",
  });
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#070a14]/90 px-4 py-4 sm:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 ring-1 ring-violet-400/40">
            <Award className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Votely</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Homepage</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl space-y-6">
          {/* Phase Boundary Notice Banner */}
          <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4 text-xs text-violet-200 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-violet-300">Phase 1 Onboarding Boundary</p>
              <p className="text-slate-400 leading-relaxed">
                Full session cookies, database credentials, and password authentication will be active in Phase 2. This interface provides a coherent onboarding experience for organizers planning upcoming awards events.
              </p>
            </div>
          </div>

          {!submitted ? (
            <div className="rounded-3xl border border-slate-800 bg-[#0d1326] p-8 sm:p-10 shadow-2xl space-y-6">
              <div className="space-y-2">
                <Badge variant="glow">Organizer Registration</Badge>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Create an Awards Event
                </h1>
                <p className="text-sm text-slate-400">
                  Register your organizer account and initiate your first online awards competition.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Your Full Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Abebe Bikila"
                    value={formData.organizerName}
                    onChange={(e) => setFormData({ ...formData, organizerName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Organization / Company Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Addis Creative Arts Guild"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Work Email *
                    </label>
                    <Input
                      type="email"
                      required
                      placeholder="organizer@domain.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Phone Number *
                    </label>
                    <Input
                      type="tel"
                      required
                      placeholder="+251 9... / +1..."
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Intended Awards Event Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Ethiopian Tech Leadership Awards 2026"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primaryGlow" className="w-full py-5 text-sm font-semibold flex items-center justify-center gap-2">
                    <span>Continue to Organizer Onboarding</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Already registered?</span>
                <Link href="/auth/login" className="text-violet-400 hover:text-violet-300 font-medium underline">
                  Organizer Login
                </Link>
              </div>
            </div>
          ) : (
            /* Onboarding Checklist Preview */
            <div className="rounded-3xl border border-slate-800 bg-[#0d1326] p-8 sm:p-10 shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Welcome, {formData.organizerName || "Organizer"}!
                  </h2>
                  <p className="text-xs text-slate-400">
                    Event Project: <strong className="text-violet-300">{formData.eventName || "Your Awards Event"}</strong>
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Organizer Launch Checklist (Phased Rollout)
                </p>

                <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-200">Phase 1: Public Website & Brand Exploration</p>
                    <p className="text-slate-400">Complete. The public layout and design system are live.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-violet-500/20 bg-violet-950/20 flex items-start gap-3">
                  <div className="h-4 w-4 rounded-full border border-violet-400 flex items-center justify-center text-[10px] text-violet-300 shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-violet-200">Phase 2: Organizer Authentication & Dashboard</p>
                    <p className="text-slate-400">Next phase. Credentials and organizer authorization will be activated.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 flex items-start gap-3 text-slate-500">
                  <div className="h-4 w-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="font-medium">Phase 3 & 4: Categories, Nominees & Dynamic Slugs</p>
                    <p className="text-slate-500">Configure award categories, nominees, and publish unique URLs.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Link href="/" className="w-full">
                  <Button variant="outline" className="w-full justify-center text-xs">
                    Return to Homepage
                  </Button>
                </Link>
                <Link href="/events" className="w-full">
                  <Button variant="primaryGlow" className="w-full justify-center text-xs">
                    Browse Public Awards
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
