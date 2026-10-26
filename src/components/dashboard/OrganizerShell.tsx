"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Award,
  Plus,
  LogOut,
  Calendar,
  FileEdit,
  Radio,
  Trophy,
  ExternalLink,
  Menu,
  X,
  LayoutDashboard,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/actions/auth";
import type { SafeUser } from "@/lib/auth";

export interface EventCounts {
  total: number;
  live: number;
  scheduled: number;
  drafts: number;
  closed: number;
}

interface OrganizerShellProps {
  user: SafeUser;
  counts: EventCounts;
  children: React.ReactNode;
}

export function OrganizerShell({ user, counts, children }: OrganizerShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatusFilter = searchParams.get("status") || "ALL";

  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      count: null,
      isActive: pathname === "/dashboard" && !searchParams.get("status"),
    },
    {
      label: "All Events",
      href: "/dashboard?status=ALL",
      icon: Layers,
      count: counts.total,
      badgeVariant: "outline" as const,
      isActive: pathname === "/dashboard" && currentStatusFilter === "ALL",
    },
    {
      label: "Live Voting",
      href: "/dashboard?status=LIVE",
      icon: Radio,
      count: counts.live,
      isLive: true,
      badgeVariant: "live" as const,
      isActive: pathname === "/dashboard" && currentStatusFilter === "LIVE",
    },
    {
      label: "Scheduled",
      href: "/dashboard?status=SCHEDULED",
      icon: Calendar,
      count: counts.scheduled,
      badgeVariant: "warning" as const,
      isActive: pathname === "/dashboard" && currentStatusFilter === "SCHEDULED",
    },
    {
      label: "Drafts",
      href: "/dashboard?status=DRAFT",
      icon: FileEdit,
      count: counts.drafts,
      badgeVariant: "outline" as const,
      isActive: pathname === "/dashboard" && currentStatusFilter === "DRAFT",
    },
    {
      label: "Closed & Finalized",
      href: "/dashboard?status=CLOSED",
      icon: Trophy,
      count: counts.closed,
      badgeVariant: "secondary" as const,
      isActive: pathname === "/dashboard" && currentStatusFilter === "CLOSED",
    },
  ];

  const userInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "OR";

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0a0e1e] border-r border-slate-800 text-slate-200">
      <div className="space-y-6 p-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 ring-1 ring-violet-400/40 shadow-lg shadow-violet-600/30 transition-transform group-hover:scale-105">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block leading-none">
                Votely
              </span>
              <span className="text-[10px] text-violet-400 font-medium uppercase tracking-wider block mt-1">
                Organizer Console
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <Link
          href="/dashboard/events/new"
          onClick={() => setMobileOpen(false)}
          className="block"
        >
          <Button
            variant="primaryGlow"
            className="w-full text-xs font-semibold py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
          >
            <Plus className="h-4 w-4" />
            <span>Create Awards Event</span>
          </Button>
        </Link>

        {/* Navigation Section */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 block">
            Competitions
          </span>
          <nav className="space-y-1" aria-label="Organizer navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    item.isActive
                      ? "bg-violet-600/20 text-white border border-violet-500/40 font-semibold shadow-inner"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        item.isActive
                          ? "text-violet-300"
                          : item.isLive
                          ? "text-emerald-400 animate-pulse"
                          : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== null && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        item.isLive && item.count > 0
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                          : item.isActive
                          ? "bg-violet-900/60 text-violet-200"
                          : "bg-slate-800/80 text-slate-400"
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Profile & Actions */}
      <div className="border-t border-slate-800/80 p-4 space-y-3 bg-[#080c1a]">
        <div className="rounded-2xl border border-slate-800 bg-[#0c1224] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600/30 border border-violet-500/30 text-violet-300 font-bold text-xs">
              {userInitials}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                {user.name}
              </span>
              <span className="text-[10px] text-slate-400 block truncate">
                {user.organization || user.email}
              </span>
            </div>
          </div>
          <Badge variant="glow" className="text-[9px] px-1.5 py-0">
            ORGANIZER
          </Badge>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Link
            href="/"
            target="_blank"
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-white py-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Public Site</span>
          </Link>

          <form action={logoutAction} className="flex-1">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] text-red-300/80 hover:text-red-200 py-1.5 rounded-lg hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-3 w-3" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#070a14] text-slate-100">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 sticky top-0 h-screen z-30 shadow-2xl">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {SidebarContent}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-[#0a0e1e]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                Organizer Dashboard
              </Link>
              {pathname !== "/dashboard" && (
                <>
                  <ChevronRight className="h-3 w-3 text-slate-600" />
                  <span className="text-violet-300 font-semibold truncate max-w-xs">
                    {pathname.includes("/new")
                      ? "Create Competition"
                      : pathname.includes("/edit")
                      ? "Edit Settings"
                      : pathname.includes("/results")
                      ? "Standings & Results"
                      : "Manage Event"}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Public Awards</span>
              </Button>
            </Link>

            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="h-7 w-7 rounded-lg bg-violet-600/30 text-violet-300 flex items-center justify-center font-bold text-xs">
                {userInitials}
              </div>
              <span className="text-xs font-semibold text-slate-200 hidden lg:inline">
                {user.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
