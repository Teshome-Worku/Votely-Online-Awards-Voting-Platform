"use client";

import * as React from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageSquare,
  Users,
  Trophy,
  ExternalLink,
  Sparkles,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface NomineeDetailInfo {
  id: string;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  categoryName: string;
  categoryId: string;
  displayOrder?: number;
}

interface NomineeDetailModalProps {
  nominee: NomineeDetailInfo;
  eventName: string;
  eventSlug: string;
  isLive: boolean;
  disabledLabel: string;
  onClose: () => void;
  onVote: () => void;
}

export function NomineeDetailModal({
  nominee,
  eventName,
  eventSlug,
  isLive,
  disabledLabel,
  onClose,
  onVote,
}: NomineeDetailModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [nomineeUrl, setNomineeUrl] = React.useState(`/events/${eventSlug}?nominee=${nominee.id}`);
  const [canShare, setCanShare] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setNomineeUrl(`${window.location.origin}/events/${eventSlug}?nominee=${nominee.id}`);
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        setCanShare(true);
      }
    }
  }, [eventSlug, nominee.id]);

  // Lock background scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(nomineeUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = nomineeUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Vote for ${nominee.name} in ${eventName}`,
          text: `Support ${nominee.name} nominated for ${nominee.categoryName} in ${eventName}! Cast your vote now:`,
          url: nomineeUrl,
        });
      } catch {
        // Share cancelled
      }
    }
  };

  const shareText = encodeURIComponent(
    `Vote for ${nominee.name} in "${nominee.categoryName}" at ${eventName}! Cast your verified vote on Votely: `
  );
  const encodedUrl = encodeURIComponent(nomineeUrl);

  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}${encodedUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${shareText}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-800 bg-[#0c1224] p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 h-9 w-9 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header / Nominee Hero */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-2">
          {nominee.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={nominee.imageUrl}
              alt={nominee.name}
              className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl object-cover border-2 border-violet-500/40 shadow-xl shadow-violet-950/30 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-3xl bg-violet-950/60 border-2 border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0 shadow-xl">
              <Users className="h-12 w-12" />
            </div>
          )}

          <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge variant="glow" className="text-xs px-2.5 py-0.5">
                <Trophy className="h-3 w-3 mr-1" />
                {nominee.categoryName}
              </Badge>
              <Badge variant="outline" className="text-xs px-2.5 py-0.5 text-slate-400">
                Official Nominee
              </Badge>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {nominee.name}
            </h2>

            <p className="text-xs text-slate-400">
              Competing in <strong className="text-slate-300">{eventName}</strong>
            </p>
          </div>
        </div>

        {/* Biography / Description Section */}
        <div className="space-y-2 rounded-2xl border border-slate-800/80 bg-[#090e1d]/70 p-4 sm:p-5">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-violet-400" />
            <span>Nominee Profile & Biography</span>
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
            {nominee.description || "No extended biography provided by the organizer for this nominee."}
          </p>
        </div>

        {/* Direct Nominee Share Link Section */}
        <div className="space-y-3 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/20 via-[#0a0f22] to-[#070b18] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center">
                <Share2 className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-white">Share Nominee Voting Link</span>
            </div>
            {copied && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                <Check className="h-3 w-3" /> Copied!
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400">
            Share this direct link with voters and supporters. Anyone opening this link lands directly on this nominee profile ready to vote.
          </p>

          {/* Copyable URL Bar */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={nomineeUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs text-slate-200 font-mono select-all focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <Button
              type="button"
              variant={copied ? "default" : "secondary"}
              size="sm"
              onClick={handleCopy}
              className={`text-xs gap-1.5 shrink-0 transition-all ${
                copied ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>
          </div>

          {/* Social Share Buttons */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </a>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-300 hover:text-sky-400 hover:border-sky-500/40 transition-all"
            >
              <Send className="h-3.5 w-3.5 text-sky-400" />
              <span>Telegram</span>
            </a>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-all"
            >
              <span className="font-bold text-xs">𝕏</span>
              <span>Post</span>
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-300 hover:text-blue-400 hover:border-blue-500/40 transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
              <span>LinkedIn</span>
            </a>

            {canShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 text-xs text-slate-300 hover:text-violet-300 hover:border-violet-500/40 transition-all"
              >
                <Share2 className="h-3.5 w-3.5 text-violet-400" />
                <span>More</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800/80">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto text-xs text-slate-400 hover:text-white"
          >
            Close
          </Button>

          {isLive ? (
            <Button
              type="button"
              variant="primaryGlow"
              size="default"
              onClick={() => {
                onClose();
                onVote();
              }}
              className="w-full sm:w-auto text-sm px-6 py-2.5 font-bold flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-violet-300" />
              <span>Vote Now</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="default"
              disabled
              className="w-full sm:w-auto text-xs opacity-60 cursor-not-allowed"
            >
              {disabledLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
