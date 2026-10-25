"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  Lock,
  Globe,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  finalizeResultsAction,
  publishResultsAction,
  unpublishResultsAction,
  correctFinalizedResultsAction,
} from "@/actions/results";
import type { EventResultsData } from "@/lib/results";

interface FinalizationPanelProps {
  results: EventResultsData;
}

export function FinalizationPanel({ results }: FinalizationPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");

  const isClosed = results.status === "CLOSED";
  const isFinalized = results.status === "FINALIZED" || results.status === "ARCHIVED";

  async function handleFinalize() {
    if (!confirm("Are you sure you want to finalize and certify results? This will record a durable immutable snapshot and lock the outcome.")) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await finalizeResultsAction({
      eventId: results.eventId,
      note: "Certified by organizer",
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to finalize results.");
    } else {
      setSuccess(`Results certified successfully! Snapshot version ${res.version} created.`);
      router.refresh();
    }
  }

  async function handleTogglePublish(publish: boolean) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = publish
      ? await publishResultsAction(results.eventId)
      : await unpublishResultsAction(results.eventId);

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to update publication status.");
    } else {
      setSuccess(publish ? "Results are now published to the public!" : "Results unpublished from public view.");
      router.refresh();
    }
  }

  async function handleCorrectionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!correctionNote.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await correctFinalizedResultsAction({
      eventId: results.eventId,
      correctionNote,
    });

    setLoading(false);
    if (!res.success) {
      setError(res.error || "Failed to record correction.");
    } else {
      setSuccess(`Correction recorded cleanly as Snapshot version ${res.version}.`);
      setShowCorrectionModal(false);
      setCorrectionNote("");
      router.refresh();
    }
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0d1428] p-6 sm:p-8 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-violet-400" />
              <span>Winner Finalization & Publication</span>
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Control official certification, create durable audit snapshots, and manage public visibility.
          </p>
        </div>

        <div>
          {isFinalized ? (
            <Badge variant="glow" className="flex items-center gap-1.5 px-3 py-1">
              <Lock className="h-3 w-3" />
              <span>Certified (v{results.snapshotVersion || 1})</span>
            </Badge>
          ) : isClosed ? (
            <Badge variant="warning" className="px-3 py-1">
              Ready for Finalization
            </Badge>
          ) : (
            <Badge variant="outline" className="px-3 py-1">
              Status: {results.status}
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* State 1: Event not yet closed */}
      {!isClosed && !isFinalized && (
        <div className="rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4 text-xs text-amber-200/90 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            <span>Finalization Preconditions</span>
          </div>
          <p>
            Results can only be certified and finalized once the event has transitioned to <strong>CLOSED</strong>. Voting is currently {results.status.toLowerCase()}. You can monitor live standings below in real time.
          </p>
        </div>
      )}

      {/* State 2: Event CLOSED - Ready to finalize */}
      {isClosed && !isFinalized && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-violet-800/40 bg-violet-950/20 p-4 text-xs text-violet-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-violet-300">
              <Award className="h-4 w-4" />
              <span>Ready for Final Certification</span>
            </div>
            <p>
              The event is closed. Finalizing will calculate the definitive standings, identify winners, resolve ties via the transparent <strong>Co-Winners Policy</strong>, and create an immutable cryptographic snapshot.
            </p>
          </div>

          <Button
            type="button"
            variant="primaryGlow"
            onClick={handleFinalize}
            disabled={loading}
            className="w-full sm:w-auto text-xs flex items-center gap-2"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
            <span>Finalize & Certify Results</span>
          </Button>
        </div>
      )}

      {/* State 3: Event FINALIZED - Publication Controls */}
      {isFinalized && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-[#070b18] p-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Certification Record
              </span>
              <p className="text-sm font-semibold text-white">
                Snapshot v{results.snapshotVersion || 1}
              </p>
              <p className="text-xs text-slate-400">
                Finalized {results.finalizedAt ? new Date(results.finalizedAt).toLocaleString() : "Recently"} by {results.finalizedByName || "Organizer"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#070b18] p-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Public Results State
              </span>
              <div>
                {results.resultsPublished ? (
                  <Badge variant="live" className="text-xs">
                    Published Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-slate-400">
                    Unpublished (Hidden)
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {results.resultsPublished
                  ? `Live since ${results.resultsPublishedAt ? new Date(results.resultsPublishedAt).toLocaleDateString() : "recently"}`
                  : "Results are hidden from public visitors."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {results.resultsPublished ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleTogglePublish(false)}
                  disabled={loading}
                  className="text-xs flex items-center gap-1.5 text-amber-300 border-amber-900/50 hover:bg-amber-950/30"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Unpublish Results</span>
                </Button>

                <a
                  href={`/events/${results.eventSlug}/results`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-4"
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>View Public Results Page</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </>
            ) : (
              <Button
                type="button"
                variant="primaryGlow"
                size="sm"
                onClick={() => handleTogglePublish(true)}
                disabled={loading}
                className="text-xs flex items-center gap-1.5"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Publish Results to Public</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCorrectionModal(true)}
              className="text-xs text-slate-400 hover:text-white"
            >
              <span>Record Authorized Correction</span>
            </Button>
          </div>

          {/* Modal for authorized correction */}
          {showCorrectionModal && (
            <div className="p-4 rounded-2xl border border-slate-700 bg-[#090e21] space-y-3">
              <h4 className="text-xs font-bold text-white">Record Authorized Correction</h4>
              <p className="text-[11px] text-slate-400">
                Any official correction creates an incremented snapshot version (v{(results.snapshotVersion || 1) + 1}) and logs the actor and reason in the permanent audit trail.
              </p>
              <form onSubmit={handleCorrectionSubmit} className="space-y-3">
                <textarea
                  value={correctionNote}
                  onChange={(e) => setCorrectionNote(e.target.value)}
                  placeholder="Explain reason for correction or recount certification..."
                  className="w-full text-xs rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  rows={2}
                  required
                />
                <div className="flex items-center gap-2">
                  <Button type="submit" variant="primaryGlow" size="sm" disabled={loading} className="text-xs">
                    Save Correction & Log Audit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCorrectionModal(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
