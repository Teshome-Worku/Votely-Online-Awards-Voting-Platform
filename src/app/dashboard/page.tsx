import Link from "next/link";
import { requireOrganizer } from "@/lib/guard";
import { logoutAction } from "@/actions/auth";
import { Award, Plus, LogOut, ShieldCheck, Trophy, Calendar, Layers, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Organizer Dashboard | Votely",
  description: "Manage your online awards competitions, categories, nominees, and voting results.",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireOrganizer();

  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      {/* Dashboard Top Navigation */}
      <header className="border-b border-slate-800 bg-[#0a0e1e] px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 ring-1 ring-violet-400/40 transition-transform group-hover:scale-105">
                <Award className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Votely</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <Badge variant="glow" className="hidden sm:inline-flex">
              Organizer Dashboard
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-white">{user.name}</span>
              <span className="text-xs text-slate-400">{user.email}</span>
            </div>

            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/80"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Welcome Banner */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1428] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Welcome back, {user.name}
                </h1>
                <Badge variant="success" className="text-[10px]">
                  {user.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-400">
                {user.organization ? `${user.organization} • ` : ""}
                Account Role: <strong className="text-violet-300">{user.role}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Public Site</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Useful Empty State (No fabricated events per PRS instructions) */}
          <div className="rounded-3xl border border-dashed border-slate-800 bg-[#0a0f20]/60 p-10 sm:p-14 text-center max-w-3xl mx-auto space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-950/60 border border-violet-500/20 text-violet-400">
              <Trophy className="h-8 w-8" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Create your first awards event
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                You haven&apos;t created any awards competitions yet. Start by defining your event profile, adding categories, uploading nominees, and configuring voting limits.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="primaryGlow"
                size="lg"
                className="px-6 py-5 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                title="Event creation will be unlocked in Phase 3"
              >
                <Plus className="h-4 w-4" />
                <span>Create your first event</span>
              </Button>
              <p className="text-[11px] text-slate-500 mt-2">
                Phase 2 foundation complete. Full event creation and category management will be enabled in Phase 3.
              </p>
            </div>

            {/* Event Roadmap Checklist */}
            <div className="pt-6 border-t border-slate-800 text-left">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                What you can do once your event is live
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0d1428] space-y-2">
                  <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold">
                    <Layers className="h-4 w-4" />
                    <span>Categories & Nominees</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Add award categories, nominee bios, portraits, and display order.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0d1428] space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                    <Calendar className="h-4 w-4" />
                    <span>Voting Schedule & Rules</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Set start/end dates and limit voting to 1 vote per verified phone number.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0d1428] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Audit & Results</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Review tamper-evident voting counts and publish certified winners.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
