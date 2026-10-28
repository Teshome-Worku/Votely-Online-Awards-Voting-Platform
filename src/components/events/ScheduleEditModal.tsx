"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Calendar,
  Clock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateEventScheduleAction } from "@/actions/event";
import type { EventStatus } from "@prisma/client";

interface ScheduleEditModalProps {
  eventId: string;
  eventName: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  votingStartsAt: string;
  votingEndsAt: string;
}

export function ScheduleEditModal({
  eventId,
  eventName,
  status,
  startDate,
  endDate,
  votingStartsAt,
  votingEndsAt,
}: ScheduleEditModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [success, setSuccess] = React.useState(false);

  // Format incoming ISO strings to local datetime string (YYYY-MM-DDTHH:mm)
  const formatForInput = (iso: string) => {
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      const year = d.getFullYear();
      const month = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const hours = pad(d.getHours());
      const minutes = pad(d.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return "";
    }
  };

  const [form, setForm] = React.useState({
    startDate: formatForInput(startDate),
    endDate: formatForInput(endDate),
    votingStartsAt: formatForInput(votingStartsAt),
    votingEndsAt: formatForInput(votingEndsAt),
  });

  const isLocked = status === "FINALIZED" || status === "ARCHIVED";
  const isLive = status === "LIVE";

  const handleOpen = () => {
    setGeneralError(null);
    setFieldErrors({});
    setSuccess(false);
    setForm({
      startDate: formatForInput(startDate),
      endDate: formatForInput(endDate),
      votingStartsAt: formatForInput(votingStartsAt),
      votingEndsAt: formatForInput(votingEndsAt),
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Client-side quick chronological validation
    const s = new Date(form.startDate).getTime();
    const eTime = new Date(form.endDate).getTime();
    const vs = new Date(form.votingStartsAt).getTime();
    const ve = new Date(form.votingEndsAt).getTime();

    const errors: Record<string, string> = {};

    if (eTime <= s) {
      errors.endDate = "Event conclusion must be after the start date.";
    }
    if (vs < s) {
      errors.votingStartsAt = "Voting cannot open before the event start date.";
    }
    if (ve <= vs) {
      errors.votingEndsAt = "Voting close date must be after voting open date.";
    }
    if (ve > eTime) {
      errors.votingEndsAt = "Voting cannot extend past the event conclusion date.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("startDate", form.startDate);
      data.append("endDate", form.endDate);
      data.append("votingStartsAt", form.votingStartsAt);
      data.append("votingEndsAt", form.votingEndsAt);

      const res = await updateEventScheduleAction(eventId, data);

      if (!res.success) {
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        setGeneralError(res.error || "Failed to update schedule.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1000);
    } catch {
      setGeneralError("An unexpected error occurred while saving the schedule.");
    } finally {
      setLoading(false);
    }
  };

  // If locked, render informative button that cannot be edited
  if (isLocked) {
    return (
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-slate-500" />
          <span>Schedule Certified & Locked</span>
        </span>
        <Badge variant="outline" className="text-[10px] text-slate-500">
          Immutable
        </Badge>
      </div>
    );
  }

  return (
    <>
      {/* Trigger Button inside Schedules Card */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="w-full text-xs flex items-center justify-center gap-2 hover:border-violet-500/50 hover:bg-violet-950/20 text-slate-200"
        >
          <CalendarClock className="h-3.5 w-3.5 text-violet-400" />
          <span>{isLive ? "Extend / Adjust Deadlines" : "Change Event Schedule"}</span>
        </Button>
      </div>

      {/* Modal Dialog Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-[#0d1326] p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="glow" className="text-[10px]">
                    Schedule Management
                  </Badge>
                  <span className="text-xs text-slate-400">• Status: <strong>{status}</strong></span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Adjust Competition Timeline
                </h3>
                <p className="text-xs text-slate-400 truncate max-w-sm">
                  {eventName}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Context Alert based on Status */}
            {isLive ? (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-300 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Voting is currently Live!</strong> You can extend the <strong>voting close deadline</strong> and <strong>event end date</strong>. Historical start times cannot be altered while voting is in progress.
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-3.5 text-xs text-violet-300 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  You can freely adjust both the overall event window and the voting dates. All dates must follow proper chronological order.
                </div>
              </div>
            )}

            {/* Error & Success States */}
            {generalError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {success && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Schedule successfully updated! Refreshing...</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Event Window */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-violet-400" />
                  <span>Overall Event Window</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      Event Starts
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={form.startDate}
                      disabled={loading || isLive}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="text-xs h-9"
                    />
                    {fieldErrors.startDate && (
                      <p className="text-[11px] text-red-400">{fieldErrors.startDate}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      Event Concludes
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={form.endDate}
                      disabled={loading}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="text-xs h-9"
                    />
                    {fieldErrors.endDate && (
                      <p className="text-[11px] text-red-400">{fieldErrors.endDate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Voting Window */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Voting Window</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      Voting Opens
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={form.votingStartsAt}
                      disabled={loading || isLive}
                      onChange={(e) => setForm({ ...form, votingStartsAt: e.target.value })}
                      className="text-xs h-9"
                    />
                    {fieldErrors.votingStartsAt && (
                      <p className="text-[11px] text-red-400">{fieldErrors.votingStartsAt}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">
                      Voting Closes
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={form.votingEndsAt}
                      disabled={loading}
                      onChange={(e) => setForm({ ...form, votingEndsAt: e.target.value })}
                      className="text-xs h-9"
                    />
                    {fieldErrors.votingEndsAt && (
                      <p className="text-[11px] text-red-400">{fieldErrors.votingEndsAt}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() => setIsOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primaryGlow"
                  size="sm"
                  disabled={loading || success}
                  className="text-xs gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Schedule...</span>
                    </>
                  ) : (
                    <span>Save Schedule Changes</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
