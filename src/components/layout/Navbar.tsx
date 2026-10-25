"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Menu, X, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Discover Awards", href: "/events" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070a14]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-md shadow-violet-600/30 ring-1 ring-violet-400/40 transition-transform group-hover:scale-105">
            <Award className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-violet-200 transition-colors">
                Votely
              </span>
              <Badge variant="glow" className="text-[10px] py-0 px-2 uppercase tracking-wider font-semibold">
                Awards
              </Badge>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Verified Online Awards Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-white ${
                  isActive ? "text-violet-400 font-semibold" : "text-slate-300"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA actions */}
        <div className="hidden lg:flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-sm">
              Organizer Login
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primaryGlow" size="sm" className="flex items-center gap-2">
              <span>Create an awards event for free</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/register" className="sm:hidden">
            <Button variant="primaryGlow" size="sm" className="text-xs px-2.5 h-8">
              Create Event
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-[#0b0f1e] px-4 pt-3 pb-6 md:hidden">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 text-base font-medium transition-colors ${
                    isActive
                      ? "bg-violet-950/60 text-violet-300 font-semibold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full justify-center">
                  Organizer Login
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primaryGlow" className="w-full justify-center flex items-center gap-2">
                  <span>Create an awards event for free</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-violet-400" />
              <span>OTP Phone Verification & Server-enforced Vote Integrity</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
