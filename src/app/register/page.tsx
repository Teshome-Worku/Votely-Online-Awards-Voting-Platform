"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, ArrowLeft, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { registerAction } from "@/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    organization: "",
    phoneNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("password", formData.password);
      if (formData.organization) data.append("organization", formData.organization);
      if (formData.phoneNumber) data.append("phoneNumber", formData.phoneNumber);

      const result = await registerAction(data);

      if (!result.success) {
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
        if (result.error) {
          setGeneralError(result.error);
        }
        setLoading(false);
        return;
      }

      // Success -> Redirect to dashboard
      router.push(result.redirectUrl || "/dashboard");
      router.refresh();
    } catch {
      setGeneralError("An unexpected error occurred during registration. Please try again.");
      setLoading(false);
    }
  };

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
        <div className="w-full max-w-xl space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-[#0d1326] p-8 sm:p-10 shadow-2xl space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="glow">Organizer Registration</Badge>
                <span className="text-xs text-slate-400">Step 1 of 1</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Create Your Organizer Account
              </h1>
              <p className="text-sm text-slate-400">
                Register to configure categories, nominees, and publish verified awards competitions.
              </p>
            </div>

            {generalError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Full Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Abebe Bikila"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-400">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Organization / Company Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Addis Creative Arts Guild"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Work Email *
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="organizer@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={loading}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-400">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+251 9... / +1..."
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password *
                </label>
                <Input
                  type="password"
                  required
                  placeholder="At least 8 characters (letters & numbers)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                />
                {fieldErrors.password ? (
                  <p className="text-xs text-red-400">{fieldErrors.password}</p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Must be at least 8 characters and include both letters and numbers.
                  </p>
                )}
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
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Register & Open Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Already have an organizer account?</span>
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
