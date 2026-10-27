"use client";

import * as React from "react";
import { Clock, CalendarCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@prisma/client";

interface EventCountdownTimerProps {
  votingStartsAt: string | Date;
  votingEndsAt: string | Date;
  status: EventStatus;
}

interface TimeRemaining {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateRemaining(targetTimestamp: number, currentTimestamp: number): TimeRemaining {
  const totalMs = Math.max(0, targetTimestamp - currentTimestamp);
  const totalSeconds = Math.floor(totalMs / 1000);

  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { totalMs, days, hours, minutes, seconds };
}

function useNow(): number | null {
  const subscribe = React.useCallback((callback: () => void) => {
    const id = setInterval(callback, 1000);
    return () => clearInterval(id);
  }, []);

  return React.useSyncExternalStore(
    subscribe,
    () => Date.now(),
    () => null
  );
}

export function EventCountdownTimer({
  votingStartsAt,
  votingEndsAt,
  status,
}: EventCountdownTimerProps) {
  const startMs = React.useMemo(
    () => new Date(votingStartsAt).getTime(),
    [votingStartsAt]
  );
  const endMs = React.useMemo(
    () => new Date(votingEndsAt).getTime(),
    [votingEndsAt]
  );

  const currentMs = useNow();

  // If rendering on server or before client mount, render placeholder
  if (currentMs === null) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-[#090e20]/60 p-5 animate-pulse flex items-center justify-center min-h-[120px]">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-4 w-4 animate-spin text-violet-400" />
          <span>Synchronizing voting timeline...</span>
        </div>
      </div>
    );
  }

  const isClosedStatus =
    status === "CLOSED" || status === "FINALIZED" || status === "ARCHIVED";

  // Determine active phase
  const isUpcoming = !isClosedStatus && currentMs < startMs;
  const isLive = !isClosedStatus && currentMs >= startMs && currentMs <= endMs;
  const isExpired = isClosedStatus || currentMs > endMs;

  const targetMs = isUpcoming ? startMs : endMs;
  const time = calculateRemaining(targetMs, currentMs);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border transition-all shadow-xl p-6 sm:p-7 ${
        isLive
          ? "border-emerald-500/40 bg-gradient-to-br from-[#0c1626] via-[#091522] to-[#070c18] shadow-emerald-950/20"
          : isUpcoming
          ? "border-violet-500/40 bg-gradient-to-br from-[#0e1329] via-[#0c1024] to-[#070a16] shadow-violet-950/20"
          : "border-slate-800 bg-gradient-to-br from-[#0c101c] to-[#070a14]"
      }`}
    >
      {/* Background ambient light */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl opacity-20"
        style={{
          backgroundColor: isLive
            ? "#10b981"
            : isUpcoming
            ? "#8b5cf6"
            : "#64748b",
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Header / Info Section */}
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            {isLive ? (
              <Badge
                variant="live"
                className="flex items-center gap-1.5 px-3 py-1 text-xs"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="h-2 w-2 rounded-full bg-emerald-400 absolute" />
                <span className="font-bold pl-1.5">Voting is Live Now</span>
              </Badge>
            ) : isUpcoming ? (
              <Badge
                variant="glow"
                className="flex items-center gap-1.5 px-3 py-1 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                <span className="font-bold">Voting Opens Soon</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs px-3 py-1 text-slate-400">
                <CalendarCheck2 className="h-3.5 w-3.5 mr-1" />
                <span>Voting Concluded</span>
              </Badge>
            )}

            <span className="text-xs text-slate-400 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>OTP Verified</span>
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            {isLive
              ? "Voting Closes In"
              : isUpcoming
              ? "Voting Window Starts In"
              : "Competition Window Ended"}
          </h3>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md">
            {isLive
              ? "Contenders are actively receiving votes. Cast your OTP-verified vote before the timer expires."
              : isUpcoming
              ? "Review official categories and nominees. The ballot will unlock automatically once voting begins."
              : "Votes are locked. Review category results or check final standings."}
          </p>
        </div>

        {/* Digital Countdown Timer Blocks */}
        {!isExpired ? (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* DAYS */}
            <div className="flex flex-col items-center justify-center min-w-[62px] sm:min-w-[76px] py-2.5 sm:py-3.5 px-2 rounded-2xl bg-[#060a16]/90 border border-slate-700/60 shadow-inner">
              <span className="text-2xl sm:text-4xl font-black font-mono text-white tracking-wider">
                {String(time.days).padStart(2, "0")}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                Days
              </span>
            </div>

            <span className="text-xl sm:text-2xl font-black font-mono text-violet-400/80 -mt-3">
              :
            </span>

            {/* HOURS */}
            <div className="flex flex-col items-center justify-center min-w-[62px] sm:min-w-[76px] py-2.5 sm:py-3.5 px-2 rounded-2xl bg-[#060a16]/90 border border-slate-700/60 shadow-inner">
              <span className="text-2xl sm:text-4xl font-black font-mono text-white tracking-wider">
                {String(time.hours).padStart(2, "0")}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                Hours
              </span>
            </div>

            <span className="text-xl sm:text-2xl font-black font-mono text-violet-400/80 -mt-3">
              :
            </span>

            {/* MINUTES */}
            <div className="flex flex-col items-center justify-center min-w-[62px] sm:min-w-[76px] py-2.5 sm:py-3.5 px-2 rounded-2xl bg-[#060a16]/90 border border-slate-700/60 shadow-inner">
              <span className="text-2xl sm:text-4xl font-black font-mono text-white tracking-wider">
                {String(time.minutes).padStart(2, "0")}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                Mins
              </span>
            </div>

            <span className="text-xl sm:text-2xl font-black font-mono text-violet-400/80 -mt-3">
              :
            </span>

            {/* SECONDS */}
            <div className="flex flex-col items-center justify-center min-w-[62px] sm:min-w-[76px] py-2.5 sm:py-3.5 px-2 rounded-2xl bg-[#060a16]/90 border border-slate-700/60 shadow-inner">
              <span
                className={`text-2xl sm:text-4xl font-black font-mono tracking-wider ${
                  isLive ? "text-emerald-400" : "text-violet-300"
                }`}
              >
                {String(time.seconds).padStart(2, "0")}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                Secs
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-[#060a16]/80 px-6 py-4 text-center shrink-0">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Final Status
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-200">
              Voting Closed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
