"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, ArrowLeft, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createEventAction } from "@/actions/event";

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  // Default suggested dates (starting today, running 30 days, voting open for the middle 2 weeks)
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultVotingStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultVotingEnd = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    startDate: defaultStart,
    endDate: defaultEnd,
    votingStartsAt: defaultVotingStart,
    votingEndsAt: defaultVotingEnd,
    bannerUrl: "",
    logoUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("startDate", formData.startDate);
      data.append("endDate", formData.endDate);
      data.append("votingStartsAt", formData.votingStartsAt);
      data.append("votingEndsAt", formData.votingEndsAt);
      if (formData.bannerUrl) data.append("bannerUrl", formData.bannerUrl);
      if (formData.logoUrl) data.append("logoUrl", formData.logoUrl);

      const result = await createEventAction(data);

      if (!result.success || !result.eventId) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        if (result.error) setGeneralError(result.error);
        setLoading(false);
        return;
      }

      // Successfully created -> navigate to event management page
      router.push(`/dashboard/events/${result.eventId}`);
      router.refresh();
    } catch {
      setGeneralError("An unexpected error occurred while creating the event.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070a14] text-slate-100">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-[#0a0e1e] px-4 py-4 sm:px-8">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 ring-1 ring-violet-400/40">
              <Award className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Votely</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="rounded-3xl border border-slate-800 bg-[#0d1326] p-8 sm:p-10 shadow-2xl space-y-6">
            <div className="space-y-2 border-b border-slate-800 pb-6">
              <Badge variant="glow">Event Initialization</Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Create New Awards Competition
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Define the title, description, and timeline for your awards. Newly created events start in <strong>Draft</strong> status and are strictly private until you publish them.
              </p>
            </div>

            {generalError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Awards Event Name *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Ethiopian Tech Leadership Awards 2026"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading}
                />
                {fieldErrors.name ? (
                  <p className="text-xs text-red-400">{fieldErrors.name}</p>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    A clean URL slug will be automatically generated from this name.
                  </p>
                )}
              </div>

              {/* Event Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Event Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the ceremony, eligible sectors, evaluation criteria, and voting instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={loading}
                  className="flex w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70 focus-visible:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                />
                {fieldErrors.description && (
                  <p className="text-xs text-red-400">{fieldErrors.description}</p>
                )}
              </div>

              {/* Event Schedule (Start / End) */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">
                  Event Duration & Voting Window
                </h3>
                <p className="text-xs text-slate-400">
                  Voting window must sit cleanly inside the overall event start and end dates.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Event Start Date *
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      disabled={loading}
                    />
                    {fieldErrors.startDate && (
                      <p className="text-xs text-red-400">{fieldErrors.startDate}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Event End Date *
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      disabled={loading}
                    />
                    {fieldErrors.endDate && (
                      <p className="text-xs text-red-400">{fieldErrors.endDate}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Voting Opens *
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={formData.votingStartsAt}
                      onChange={(e) => setFormData({ ...formData, votingStartsAt: e.target.value })}
                      disabled={loading}
                    />
                    {fieldErrors.votingStartsAt && (
                      <p className="text-xs text-red-400">{fieldErrors.votingStartsAt}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Voting Closes *
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={formData.votingEndsAt}
                      onChange={(e) => setFormData({ ...formData, votingEndsAt: e.target.value })}
                      disabled={loading}
                    />
                    {fieldErrors.votingEndsAt && (
                      <p className="text-xs text-red-400">{fieldErrors.votingEndsAt}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Branding URLs */}
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Optional Media & Branding
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">
                      Banner Image URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com/banner.jpg"
                      value={formData.bannerUrl}
                      onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                      disabled={loading}
                    />
                    {fieldErrors.bannerUrl && (
                      <p className="text-xs text-red-400">{fieldErrors.bannerUrl}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">
                      Logo Image URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      disabled={loading}
                    />
                    {fieldErrors.logoUrl && (
                      <p className="text-xs text-red-400">{fieldErrors.logoUrl}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submission Button */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
                <Link href="/dashboard">
                  <Button type="button" variant="ghost" disabled={loading} className="text-xs">
                    Cancel
                  </Button>
                </Link>

                <Button
                  type="submit"
                  variant="primaryGlow"
                  disabled={loading}
                  className="px-6 py-5 text-sm font-semibold flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Event...</span>
                    </>
                  ) : (
                    <>
                      <span>Save as Draft</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
