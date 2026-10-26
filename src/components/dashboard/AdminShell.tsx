"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  Users,
  ShieldCheck,
  History,
  Award,
  ExternalLink,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Database,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/actions/auth";
import type { SafeUser } from "@/lib/auth";

interface AdminShellProps {
  user: SafeUser;
  stats: {
    totalUsers: number;
    organizersCount: number;
    adminsCount: number;
    totalEvents: number;
    auditLogsCount: number;
  };
  children: React.ReactNode;
}

export function AdminShell({ user, stats, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const navItems = [
    {
      label: "Platform Overview",
      href: "/admin",
      icon: LayoutDashboard,
      count: null,
      isActive: pathname === "/admin",
    },
    {
      label: "Users & Organizers",
      href: "/admin#users",
      icon: Users,
      count: stats.organizersCount,
    },
    {
      label: "Platform Administrators",
      href: "/admin#admins",
      icon: ShieldCheck,
      count: stats.adminsCount,
    },
    {
      label: "Security Audit Trail",
      href: "/admin#audit",
      icon: History,
      count: stats.auditLogsCount,
    },
    {
      label: "Platform Competitions",
      href: "/admin#events",
      icon: Award,
      count: stats.totalEvents,
    },
  ];

  const adminInitials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "PA";

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0a0c1a] border-r border-red-950/40 text-slate-200">
      <div className="space-y-6 p-5">
        {/* Brand Header */}
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-violet-700 ring-1 ring-red-400/40 shadow-lg shadow-red-900/30 transition-transform group-hover:scale-105">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block leading-none">
                Votely
              </span>
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block mt-1">
                Platform Admin
              </span>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Platform Status Card */}
        <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-red-300 font-semibold flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" />
              <span>System Core</span>
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-snug">
            Supabase PostgreSQL • Server Enforcement Active
          </p>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 block">
            System Administration
          </span>
          <nav className="space-y-1" aria-label="Admin navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    item.isActive
                      ? "bg-red-950/40 text-red-100 border border-red-800/60 font-semibold shadow-inner"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        item.isActive ? "text-red-400" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.count !== null && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400">
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
      <div className="border-t border-red-950/40 p-4 space-y-3 bg-[#080914]">
        <div className="rounded-2xl border border-red-900/30 bg-[#0d0c1e] p-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-950 border border-red-500/40 text-red-300 font-bold text-xs">
              {adminInitials}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                {user.name}
              </span>
              <span className="text-[10px] text-red-300/80 block truncate font-mono">
                {user.email}
              </span>
            </div>
          </div>
          <Badge variant="warning" className="text-[9px] px-1.5 py-0 bg-red-950 border-red-600/40 text-red-300">
            ADMIN
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
              className="w-full inline-flex items-center justify-center gap-1.5 text-[11px] text-red-300 hover:text-red-200 py-1.5 rounded-lg hover:bg-red-950/40 transition-colors"
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
        <header className="sticky top-0 z-20 border-b border-red-950/40 bg-[#0a0c1a]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-400 font-bold flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Platform Administration</span>
              </span>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-slate-300 font-semibold">System Oversight</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="glow" className="border-red-500/40 bg-red-950/40 text-red-200 text-xs hidden sm:inline-flex">
              Root Authority
            </Badge>

            <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
              <div className="h-7 w-7 rounded-lg bg-red-950 border border-red-500/40 text-red-300 flex items-center justify-center font-bold text-xs">
                {adminInitials}
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
