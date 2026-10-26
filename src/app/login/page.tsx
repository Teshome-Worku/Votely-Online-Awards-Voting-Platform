"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Award, ArrowLeft, ArrowRight, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { loginAction } from "@/actions/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = new FormData();
      data.append("email", email);
      data.append("password", password);

      const result = await loginAction(data);

      if (!result.success) {
        setError(result.error || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Successful login -> Redirect to dashboard or custom next
      const targetUrl = next.startsWith("/") && next !== "/login" ? next : result.redirectUrl || "/dashboard";
      router.push(targetUrl);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-[#0d1326] p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-950/60 border border-violet-500/30 text-violet-400 mb-2">
            <Lock className="h-6 w-6" />
          </div>
          <Badge variant="glow">Sign In</Badge>
          <h1 className="text-2xl font-extrabold text-white">
            Organizer Login
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to manage your awards competitions and view results.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Email Address
            </label>
            <Input
              type="email"
              required
              placeholder="organizer@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primaryGlow"
              disabled={loading}
              className="w-full py-5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Don&apos;t have an account?</span>
          <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium underline">
            Create an event for free
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#070a14]/90 px-4 py-4 sm:px-8 flex items-center justify-between">
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
        <React.Suspense fallback={<div className="text-slate-400 text-sm">Loading login...</div>}>
          <LoginForm />
        </React.Suspense>
      </main>
    </div>
  );
}
