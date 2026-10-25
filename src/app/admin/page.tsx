import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/guard";
import { logoutAction } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { ShieldAlert, Users, LogOut, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Platform Administration | Votely",
  description: "Platform-level administrative oversight and user management.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const adminUser = await requirePlatformAdmin();

  // Load registered users from database
  const users = await prisma.user.findMany({
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
  });

  const totalOrganizers = users.filter((u) => u.role === "ORGANIZER").length;
  const totalAdmins = users.filter((u) => u.role === "PLATFORM_ADMIN").length;

  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      {/* Admin Top Navigation */}
      <header className="border-b border-red-950/40 bg-[#0c0a1a] px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 ring-1 ring-violet-400/40">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Votely</span>
            </Link>
            <div className="h-4 w-px bg-slate-800 hidden sm:block" />
            <Badge variant="glow" className="border-red-500/40 bg-red-950/40 text-red-200">
              Platform Administration
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-white">{adminUser.name}</span>
              <span className="text-xs text-red-300">PLATFORM_ADMIN</span>
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

      {/* Main Admin Content */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Admin Header */}
          <div className="rounded-3xl border border-red-500/20 bg-[#0e0c1f] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Platform Oversight
                </h1>
                <Badge variant="warning" className="text-[10px]">
                  Elevated Permissions
                </Badge>
              </div>
              <p className="text-sm text-slate-400">
                Manage registered organizers, review platform health, and oversee security records.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="text-xs">
                  Organizer Dashboard
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs text-slate-400">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Public Site</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d1326] space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Registered Organizers
              </p>
              <p className="text-3xl font-extrabold text-white">{totalOrganizers}</p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d1326] space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Platform Administrators
              </p>
              <p className="text-3xl font-extrabold text-violet-300">{totalAdmins}</p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d1326] space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Database Status
              </p>
              <div className="flex items-center gap-2 pt-1">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300">PostgreSQL Active</span>
              </div>
            </div>
          </div>

          {/* Organizers Table */}
          <div className="rounded-3xl border border-slate-800 bg-[#0d1326] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-400" />
                <h2 className="text-lg font-bold text-white">Registered Users & Organizers</h2>
              </div>
              <span className="text-xs text-slate-400">
                {users.length} total account{users.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#0a0f20] text-xs uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Organization</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs">{u.email}</td>
                      <td className="px-6 py-4 text-slate-400">{u.organization || "—"}</td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={u.role === "PLATFORM_ADMIN" ? "glow" : "secondary"}
                          className="text-[10px]"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="success" className="text-[10px]">
                          {u.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
