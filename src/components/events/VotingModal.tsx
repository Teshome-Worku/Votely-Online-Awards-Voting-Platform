"use client";

import * as React from "react";
import { requestOtpAction, verifyOtpAction, submitVoteAction } from "@/actions/voting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  KeyRound,
  Users,
} from "lucide-react";

interface NomineeInfo {
  id: string;
  name: string;
  imageUrl?: string | null;
  categoryName: string;
  categoryId: string;
}

interface Props {
  eventId: string;
  eventName: string;
  selectedNominee: NomineeInfo | null;
  onClose: () => void;
}

export function VotingModal({ eventId, eventName, selectedNominee, onClose }: Props) {
  const [step, setStep] = React.useState<"phone" | "otp" | "confirmed">("phone");
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [challengeId, setChallengeId] = React.useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = React.useState<string>("");
  const [otp, setOtp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Confirmed receipt data
  const [receipt, setReceipt] = React.useState<{
    voteId: string;
    timestamp: string;
    nomineeName: string;
    categoryName: string;
    isDuplicateRetry?: boolean;
  } | null>(null);

  if (!selectedNominee) return null;

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await requestOtpAction(eventId, phoneNumber);
      if (!res.success || !res.challengeId) {
        setError(res.error || "Failed to dispatch verification code.");
        setLoading(false);
        return;
      }

      setChallengeId(res.challengeId);
      setMaskedPhone(res.maskedPhone || phoneNumber);
      setStep("otp");
      setLoading(false);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  // Step 2: Verify OTP & Submit Vote
  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeId) return;

    setError(null);
    setLoading(true);

    try {
      // 1. Verify OTP
      const verifyRes = await verifyOtpAction(challengeId, otp);
      if (!verifyRes.success || !verifyRes.voterSessionToken) {
        setError(verifyRes.error || "Incorrect or expired verification code.");
        setLoading(false);
        return;
      }

      // 2. Submit Vote atomically
      const voteRes = await submitVoteAction({
        voterSessionToken: verifyRes.voterSessionToken,
        eventId,
        categoryId: selectedNominee.categoryId,
        nomineeId: selectedNominee.id,
      });

      if (!voteRes.success || !voteRes.voteId) {
        setError(voteRes.error || "Could not record vote.");
        setLoading(false);
        return;
      }

      setReceipt({
        voteId: voteRes.voteId,
        timestamp: voteRes.timestamp || new Date().toISOString(),
        nomineeName: voteRes.nomineeName || selectedNominee.name,
        categoryName: voteRes.categoryName || selectedNominee.categoryName,
        isDuplicateRetry: voteRes.isDuplicateRetry,
      });

      setStep("confirmed");
      setLoading(false);
    } catch {
      setError("An unexpected error occurred during vote recording.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-[#0c1228] p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Selected Nominee Header Card */}
        <div className="flex items-center gap-3 p-3 rounded-2xl border border-slate-800 bg-[#0f1730] mb-6">
          {selectedNominee.imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={selectedNominee.imageUrl}
              alt={selectedNominee.name}
              className="h-12 w-12 rounded-xl object-cover border border-slate-700 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
              <Users className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-violet-400 uppercase tracking-wider">
              {selectedNominee.categoryName}
            </span>
            <h4 className="text-sm font-bold text-white truncate">
              {selectedNominee.name}
            </h4>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300 flex items-start gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Step 1: Phone Entry */}
        {step === "phone" && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Mobile Phone Number
                </label>
                <Badge variant="glow" className="text-[10px]">
                  SMS Verification
                </Badge>
              </div>
              <Input
                type="tel"
                required
                placeholder="e.g. +251 91 122 3344 or 0911223344"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                className="text-sm"
              />
              <p className="text-[11px] text-slate-400">
                Ethiopian and international numbers supported. You will receive a 6-digit SMS code.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-[11px] text-slate-400 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
              <span>
                Phone OTP verifies human possession of a real phone number to prevent bot automation. No password or account is required.
              </span>
            </div>

            <Button
              type="submit"
              variant="primaryGlow"
              disabled={loading}
              className="w-full py-5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Requesting Code...</span>
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4" />
                  <span>Send Verification Code</span>
                </>
              )}
            </Button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <form onSubmit={handleVerifyAndSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Enter 6-Digit Code
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  Sent to {maskedPhone}
                </span>
              </div>
              <Input
                type="text"
                required
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
                className="text-center font-mono tracking-widest text-lg h-12"
              />
              <p className="text-[11px] text-slate-400 text-center">
                Code expires in 5 minutes.
              </p>
            </div>

            <Button
              type="submit"
              variant="primaryGlow"
              disabled={loading}
              className="w-full py-5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying & Recording...</span>
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Verify & Cast Ballot</span>
                </>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("phone")}
                disabled={loading}
                className="text-xs text-violet-400 hover:text-violet-300 underline cursor-pointer"
              >
                Change phone number or resend
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Confirmed Receipt */}
        {step === "confirmed" && receipt && (
          <div className="space-y-5 text-center py-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">
                {receipt.isDuplicateRetry ? "Ballot Already Recorded" : "Vote Successfully Recorded!"}
              </h3>
              <p className="text-xs text-slate-400">
                Your vote for <strong className="text-violet-300">{receipt.nomineeName}</strong> has been server-enforced and logged.
              </p>
            </div>

            {/* Official Digital Ballot Receipt */}
            <div className="rounded-2xl border border-slate-800 bg-[#0a0f20] p-4 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Event</span>
                <span className="font-semibold text-white">{eventName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Category</span>
                <span className="font-semibold text-white">{receipt.categoryName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Nominee</span>
                <span className="font-semibold text-emerald-300">{receipt.nomineeName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Voter ID</span>
                <span className="font-mono text-slate-400">{maskedPhone}</span>
              </div>
              <div className="flex justify-between pt-1 text-[10px] text-slate-500 font-mono">
                <span>Receipt Ref</span>
                <span>{receipt.voteId.slice(-10)}</span>
              </div>
            </div>

            <Button
              onClick={onClose}
              variant="outline"
              className="w-full text-xs"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
