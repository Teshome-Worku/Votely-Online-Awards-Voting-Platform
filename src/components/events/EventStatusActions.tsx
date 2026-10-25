"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateEventStatusAction } from "@/actions/event";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Loader2, Play, Calendar, Lock, CheckCircle2, RotateCcw } from "lucide-react";
import type { EventStatus } from "@prisma/client";

interface Props {
  eventId: string;
  currentStatus: EventStatus;
}

export function EventStatusActions({ eventId, currentStatus }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<EventStatus | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleTransition = async (target: EventStatus) => {
    setError(null);
    setSuccess(null);
    setLoading(target);

    try {
      const result = await updateEventStatusAction(eventId, target);
      if (!result.success) {
        setError(result.error || "Failed to update event status.");
        setLoading(null);
        return;
      }

      setSuccess(`Event lifecycle updated to ${target}.`);
      setLoading(null);
      router.refresh();
    } catch {
      setError("An unexpected error occurred during status transition.");
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        {currentStatus === "DRAFT" && (
          <>
            <Button
              variant="primaryGlow"
              size="sm"
              disabled={loading !== null}
              onClick={() => handleTransition("SCHEDULED")}
              className="flex items-center gap-1.5 text-xs"
            >
              {loading === "SCHEDULED" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Calendar className="h-3.5 w-3.5" />
              )}
              <span>Publish as Scheduled</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={loading !== null}
              onClick={() => handleTransition("LIVE")}
              className="flex items-center gap-1.5 text-xs"
            >
              {loading === "LIVE" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              <span>Launch Live Now</span>
            </Button>
          </>
        )}

        {currentStatus === "SCHEDULED" && (
          <>
            <Button
              variant="primaryGlow"
              size="sm"
              disabled={loading !== null}
              onClick={() => handleTransition("LIVE")}
              className="flex items-center gap-1.5 text-xs"
            >
              {loading === "LIVE" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              <span>Launch Live Voting</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={loading !== null}
              onClick={() => handleTransition("DRAFT")}
              className="flex items-center gap-1.5 text-xs"
            >
              {loading === "DRAFT" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
              <span>Revert to Draft</span>
            </Button>
          </>
        )}

        {currentStatus === "LIVE" && (
          <Button
            variant="secondary"
            size="sm"
            disabled={loading !== null}
            onClick={() => handleTransition("CLOSED")}
            className="flex items-center gap-1.5 text-xs"
          >
            {loading === "CLOSED" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-amber-400" />
            )}
            <span>Close Voting Window</span>
          </Button>
        )}

        {currentStatus === "CLOSED" && (
          <>
            <Button
              variant="primaryGlow"
              size="sm"
              disabled={loading !== null}
              onClick={() => handleTransition("FINALIZED")}
              className="flex items-center gap-1.5 text-xs"
            >
              {loading === "FINALIZED" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span>Certify & Finalize Event</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              disabled={loading !== null}
              onClick={() => handleTransition("LIVE")}
              className="flex items-center gap-1.5 text-xs"
            >
              {loading === "LIVE" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              <span>Reopen Live Voting</span>
            </Button>
          </>
        )}

        {currentStatus === "FINALIZED" && (
          <span className="text-xs text-slate-400 font-medium">
            Event is finalized. Official standings certified.
          </span>
        )}
      </div>
    </div>
  );
}
