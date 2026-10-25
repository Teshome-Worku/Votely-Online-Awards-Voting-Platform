import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DiscoverySection } from "@/components/home/DiscoverySection";
import { Trophy, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Discover Awards | Votely",
  description: "Browse verified online awards competitions and vote for your favorite nominees.",
};

export default function EventsDiscoveryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      <Navbar />
      <main className="flex-1">
        {/* Page Banner */}
        <div className="border-b border-slate-800 bg-[#090d1f] py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Trophy className="h-4 w-4" />
                  <span>Public Directory</span>
                </div>
                <h1 className="text-3xl font-extrabold sm:text-4xl text-white">
                  Discover Awards Competitions
                </h1>
                <p className="mt-2 text-slate-400 max-w-2xl text-sm sm:text-base">
                  Explore verified awards competitions across creative, cultural, tech, and community sectors. Each event features an independent voting schedule and server-checked OTP ballot rules.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/auth/register">
                  <Button variant="primaryGlow" size="sm">
                    Host an Award Event
                  </Button>
                </Link>
                <Link href="/how-it-works">
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4" />
                    <span>Voting Rules</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Discovery Interface */}
        <DiscoverySection />
      </main>
      <Footer />
    </div>
  );
}
