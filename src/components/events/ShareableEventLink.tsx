"use client";

import * as React from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Share2,
  Globe,
  Send,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareableEventLinkProps {
  eventSlug: string;
  eventName: string;
  isPublic?: boolean;
  variant?: "fullBanner" | "compact" | "buttonOnly";
}

export function ShareableEventLink({
  eventSlug,
  eventName,
  isPublic = true,
  variant = "fullBanner",
}: ShareableEventLinkProps) {
  const [copied, setCopied] = React.useState(false);
  const [fullUrl, setFullUrl] = React.useState(`/events/${eventSlug}`);
  const [canShare, setCanShare] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        setFullUrl(`${window.location.origin}/events/${eventSlug}`);
      }
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        setCanShare(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [eventSlug]);

  const handleCopy = async () => {
    try {
      const urlToCopy =
        typeof window !== "undefined"
          ? `${window.location.origin}/events/${eventSlug}`
          : fullUrl;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(urlToCopy);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = urlToCopy;
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
        const urlToShare =
          typeof window !== "undefined"
            ? `${window.location.origin}/events/${eventSlug}`
            : fullUrl;

        await navigator.share({
          title: eventName,
          text: `Cast your verified vote for nominees in ${eventName} on Votely!`,
          url: urlToShare,
        });
      } catch {
        // User cancelled share dialog
      }
    }
  };

  // Button-only variant (useful for tables or quick action bars)
  if (variant === "buttonOnly") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className={`text-xs gap-1.5 transition-all ${
          copied ? "text-emerald-400 border-emerald-500/50 bg-emerald-950/20" : ""
        }`}
        title="Copy public event link to clipboard"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            <span>Copy Link</span>
          </>
        )}
      </Button>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 bg-[#070b18] border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-300 truncate">
          {fullUrl}
        </div>
        <Button
          type="button"
          variant="primaryGlow"
          size="sm"
          onClick={handleCopy}
          className="text-xs shrink-0 gap-1.5 h-8 px-3"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-300" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  // Full banner variant (designed for the event management overview)
  const shareText = encodeURIComponent(`Vote in ${eventName} on Votely: ${fullUrl}`);
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(`Vote in ${eventName}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${eventName} on Votely`)}&url=${encodeURIComponent(fullUrl)}`;

  return (
    <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-[#0e142b] via-[#0b1024] to-[#070a16] p-6 sm:p-7 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-400 flex items-center justify-center shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Public Shareable Event URL</span>
              {!isPublic && (
                <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/30">
                  Private Draft
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Share this exact link with voters, nominees, and sponsors across your social channels.
            </p>
          </div>
        </div>

        {/* Quick External Open */}
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors self-start sm:self-center"
        >
          <span>Preview Public Page</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Copy Field Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
        <div className="relative flex-1">
          <input
            type="text"
            readOnly
            value={fullUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="w-full rounded-xl border border-slate-700/80 bg-[#060a16] px-4 py-2.5 text-xs sm:text-sm font-mono text-violet-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <Button
          type="button"
          variant="primaryGlow"
          onClick={handleCopy}
          className={`h-10 px-5 text-xs font-semibold gap-2 shrink-0 transition-all ${
            copied ? "bg-emerald-600 hover:bg-emerald-500 text-white" : ""
          }`}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-white" />
              <span>Link Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy Event URL</span>
            </>
          )}
        </Button>
      </div>

      {/* Quick Share Buttons */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span className="text-[11px] font-medium text-slate-500">Quick Share:</span>

        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-emerald-950/40 hover:border-emerald-500/40 hover:text-emerald-300 transition-all text-[11px]"
          >
            <MessageSquare className="h-3 w-3 text-emerald-400" />
            <span>WhatsApp</span>
          </a>

          {/* Telegram */}
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-sky-950/40 hover:border-sky-500/40 hover:text-sky-300 transition-all text-[11px]"
          >
            <Send className="h-3 w-3 text-sky-400" />
            <span>Telegram</span>
          </a>

          {/* Twitter / X */}
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:text-white transition-all text-[11px]"
          >
            <Share2 className="h-3 w-3 text-slate-300" />
            <span>X (Twitter)</span>
          </a>

          {/* Native Web Share API if available on client */}
          {canShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-violet-950/40 hover:border-violet-500/40 hover:text-violet-300 transition-all text-[11px]"
            >
              <Share2 className="h-3 w-3 text-violet-400" />
              <span>More...</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
