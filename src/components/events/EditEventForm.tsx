"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateEventAction } from "@/actions/event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { AlertCircle, Loader2, ArrowRight } from "lucide-react";

interface InitialData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  votingStartsAt: string;
  votingEndsAt: string;
  bannerUrl: string;
  logoUrl: string;
}

export function EditEventForm({ initialData }: { initialData: InitialData }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formData, setFormData] = React.useState(initialData);

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

      const result = await updateEventAction(initialData.id, data);

      if (!result.success) {
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        if (result.error) setGeneralError(result.error);
        setLoading(false);
        return;
      }

      router.push(`/dashboard/events/${initialData.id}`);
      router.refresh();
    } catch {
      setGeneralError("An unexpected error occurred while updating the event.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {generalError && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-xs text-red-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">
          Awards Event Name *
        </label>
        <Input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={loading}
        />
        {fieldErrors.name && (
          <p className="text-xs text-red-400">{fieldErrors.name}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300">
          Event Description *
        </label>
        <textarea
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          disabled={loading}
          className="flex w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70 focus-visible:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        />
        {fieldErrors.description && (
          <p className="text-xs text-red-400">{fieldErrors.description}</p>
        )}
      </div>

      {/* Schedules */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-violet-400">
          Event Duration & Voting Window
        </h3>

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

      {/* Media & Branding with File Upload */}
      <div className="space-y-4 pt-2 border-t border-slate-800/80">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Media & Branding
          </h3>
          <p className="text-[11px] text-slate-400">
            Choose files (.jpg, .png, .webp) directly from your device or paste an image URL.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <ImageUpload
              label="Awards Banner Image"
              description="Upload a landscape banner image for your event page (e.g. 1200x400)."
              value={formData.bannerUrl}
              onChange={(url) => setFormData({ ...formData, bannerUrl: url })}
              disabled={loading}
              aspectRatio="banner"
              placeholderText="https://example.com/banner.jpg"
            />
            {fieldErrors.bannerUrl && (
              <p className="text-xs text-red-400">{fieldErrors.bannerUrl}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <ImageUpload
              label="Awards Emblem or Logo"
              description="Upload your official competition logo or brand insignia."
              value={formData.logoUrl}
              onChange={(url) => setFormData({ ...formData, logoUrl: url })}
              disabled={loading}
              aspectRatio="square"
              placeholderText="https://example.com/logo.png"
            />
            {fieldErrors.logoUrl && (
              <p className="text-xs text-red-400">{fieldErrors.logoUrl}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
        <Link href={`/dashboard/events/${initialData.id}`}>
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
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <span>Update Event</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
