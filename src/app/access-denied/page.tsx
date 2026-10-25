import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Access Denied | Votely",
};

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070a14] text-slate-100 px-4">
      <div className="max-w-md w-full rounded-3xl border border-red-500/30 bg-[#0d1224] p-8 sm:p-10 text-center space-y-6 shadow-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-950/60 border border-red-500/30 text-red-400">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white">403 — Access Denied</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            You do not have the required permissions to access the Platform Administration area. Administrative rights require explicit platform provisioning.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="primaryGlow" className="w-full text-xs">
              Return to Organizer Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full text-xs flex items-center justify-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Public Homepage</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
