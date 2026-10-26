import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import {
  ShieldAlert,
  Users,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Award,
  History,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Platform Administration | Votely",
  description: "Platform-level administrative oversight and user management.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requirePlatformAdmin();

  // Load real database data in parallel
  const [users, events, auditLogs] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        organization: true,
        createdAt: true,
      },
    }),
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organizer: {
          select: { name: true, email: true, organization: true },
        },
        _count: {
          select: { categories: true, nominees: true, votes: true },
        },
      },
      take: 20,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        event: { select: { name: true, slug: true } },
      },
      take: 25,
    }),
  ]);

  const totalOrganizers = users.filter((u) => u.role === "ORGANIZER").length;
  const totalAdmins = users.filter((u) => u.role === "PLATFORM_ADMIN").length;
  const totalVotesAcrossPlatform = events.reduce((acc, ev) => acc + ev._count.votes, 0);

  return (
    <div className="space-y-8">
      {/* Top Admin Header Banner */}
      <div className="rounded-3xl border border-red-500/20 bg-gradient-to-r from-[#120a1c] via-[#0d0c1e] to-[#0a0e22] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Platform Oversight
            </h1>
            <Badge variant="warning" className="text-[10px] bg-red-950 border-red-700/50 text-red-200">
              Elevated Root Authority
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Manage provisioned accounts, monitor multi-tenant competition rosters, oversee cryptographic vote recording, and audit certified outcomes.
          </p>
        </div>

        <div className="relative z-10 shrink-0 flex items-center gap-3">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 border-slate-700 hover:bg-slate-800">
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Explore Public Awards</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Platform Real Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-3xl border border-slate-800 bg-[#0a0d1e] p-5 sm:p-6 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Registered Organizers</span>
            <Users className="h-4 w-4 text-violet-400" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {totalOrganizers}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Independent event organizers</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0a0d1e] p-5 sm:p-6 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Platform Administrators</span>
            <ShieldCheck className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {totalAdmins}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Root administrative operators</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0a0d1e] p-5 sm:p-6 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Awards Competitions</span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {events.length}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            {totalVotesAcrossPlatform.toLocaleString()} verified votes recorded
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0a0d1e] p-5 sm:p-6 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Security Audit Entries</span>
            <History className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {auditLogs.length}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Tamper-evident system logs</p>
        </div>
      </div>

      {/* Section 1: Registered Users & Organizers */}
      <div id="users" className="rounded-3xl border border-slate-800 bg-[#0a0d1e] p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-violet-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Registered Users & Organizers</h2>
              <p className="text-xs text-slate-400">
                All authenticated accounts with database-persisted roles and status.
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {users.length} {users.length === 1 ? "account" : "accounts"} provisioned
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <th className="pb-3 px-3">Name</th>
                <th className="pb-3 px-3">Email Address</th>
                <th className="pb-3 px-3">Organization</th>
                <th className="pb-3 px-3">Assigned Role</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-sans font-semibold text-white">
                    {u.name}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {u.email}
                  </td>
                  <td className="py-3 px-3 font-sans text-slate-400">
                    {u.organization || "—"}
                  </td>
                  <td className="py-3 px-3">
                    {u.role === "PLATFORM_ADMIN" ? (
                      <Badge variant="warning" className="text-[10px] bg-red-950/80 border-red-600/40 text-red-300">
                        PLATFORM_ADMIN
                      </Badge>
                    ) : (
                      <Badge variant="glow" className="text-[10px] bg-violet-950/60 text-violet-300">
                        ORGANIZER
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {u.status === "ACTIVE" ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-sans text-xs">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-red-400 font-sans text-xs">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Suspended</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-500 font-sans text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Platform Competitions Across All Organizers */}
      <div id="events" className="rounded-3xl border border-slate-800 bg-[#0a0d1e] p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Award className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Awards Competitions Platform-Wide</h2>
              <p className="text-xs text-slate-400">
                All organizer events hosted across the platform with live participation counts.
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {events.length} competitions
          </span>
        </div>

        {events.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No awards events registered on the platform yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="pb-3 px-3">Competition</th>
                  <th className="pb-3 px-3">Organizer</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Structure</th>
                  <th className="pb-3 px-3">Accepted Votes</th>
                  <th className="pb-3 px-3">Created</th>
                  <th className="pb-3 px-3 text-right">Public Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">
                      {ev.name}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {ev.organizer.name} ({ev.organizer.email})
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          ev.status === "LIVE"
                            ? "live"
                            : ev.status === "FINALIZED"
                            ? "glow"
                            : ev.status === "SCHEDULED"
                            ? "warning"
                            : "outline"
                        }
                        className="text-[10px]"
                      >
                        {ev.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-xs">
                      {ev._count.categories} Cats • {ev._count.nominees} Nominees
                    </td>
                    <td className="py-3 px-3 font-bold text-white font-mono">
                      {ev._count.votes.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-xs">
                      {new Date(ev.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/events/${ev.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 font-semibold"
                      >
                        <span>View</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Platform Security & Audit Trail */}
      <div id="audit" className="rounded-3xl border border-slate-800 bg-[#0a0d1e] p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <History className="h-5 w-5 text-indigo-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Platform Security & Audit Trail</h2>
              <p className="text-xs text-slate-400">
                Immutable ledger recording critical administrative and certification events.
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {auditLogs.length} audit records
          </span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No platform audit logs recorded yet.</p>
        ) : (
          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-800/80 bg-[#070b18] p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-950/80 border border-indigo-700/40 text-indigo-300">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{log.action}</span>
                      {log.event && (
                        <Badge variant="outline" className="text-[10px] text-slate-400">
                          {log.event.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Authorized by <strong className="text-slate-200">{log.user.name}</strong> ({log.user.email})
                    </p>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono shrink-0 sm:text-right">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
