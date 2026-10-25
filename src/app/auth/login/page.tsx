"use client";

import * as React from "react";
import Link from "next/link";
import { Award, ArrowLeft, AlertCircle, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [notice, setNotice] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(true);
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
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-4 text-xs text-violet-200 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-violet-300">Phase 1 Architecture Boundary</p>
              <p className="text-slate-400 leading-relaxed">
                Organizer session cookies, secure tokens, and the PostgreSQL user schema are scheduled for Phase 2. This route confirms navigation integrity for Phase 1.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#0d1326] p-8 sm:p-10 shadow-2xl space-y-6">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-950/60 border border-violet-500/30 text-violet-400 mb-2">
                <Lock className="h-6 w-6" />
              </div>
              <Badge variant="glow">Organizer Portal</Badge>
              <h1 className="text-2xl font-extrabold text-white">
                Organizer Login
              </h1>
              <p className="text-xs text-slate-400">
                Access your awards dashboard and event management tools.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Organizer Email
                </label>
                <Input
                  type="email"
                  required
                  placeholder="organizer@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                </div>
                <Input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {notice && (
                <div className="p-3 rounded-xl bg-violet-950/50 border border-violet-500/40 text-xs text-violet-200">
                  <strong>Phase 1 Notice:</strong> Organizer authentication backend will be fully wired in Phase 2. Thank you for testing the interface flow!
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" variant="primaryGlow" className="w-full py-5 text-sm font-semibold flex items-center justify-center gap-2">
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>New organizer?</span>
              <Link href="/auth/register" className="text-violet-400 hover:text-violet-300 font-medium underline">
                Create an event for free
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
