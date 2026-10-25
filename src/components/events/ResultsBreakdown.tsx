import { Award, Trophy, Users, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EventResultsData, CategoryResult, NomineeResult } from "@/lib/results";

interface ResultsBreakdownProps {
  results: EventResultsData;
  isPublicView?: boolean;
}

export function ResultsBreakdown({ results, isPublicView = false }: ResultsBreakdownProps) {
  return (
    <div className="space-y-8">
      {/* Top Participation Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-800 bg-[#0d1428] p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span>Total Accepted Votes</span>
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {results.totalVotes.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">Enforced by cryptographic duplicate prevention</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0d1428] p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-violet-400" />
            <span>Verified Phone Voters</span>
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {results.totalUniqueVoters.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">Authenticated via SMS OTP</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-[#0d1428] p-5 space-y-1">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-400" />
            <span>Award Categories</span>
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white">
            {results.categories.length}
          </p>
          <p className="text-[11px] text-slate-400">Active competition categories</p>
        </div>
      </div>

      {/* Category Results Listing */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            <span>Category Standings & Outcomes</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {results.categories.length} {results.categories.length === 1 ? "category" : "categories"}
          </span>
        </div>

        {results.categories.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-[#090d1c] p-8 text-center text-xs text-slate-400">
            No categories defined for this awards event.
          </div>
        ) : (
          results.categories.map((category) => (
            <CategoryResultsCard
              key={category.categoryId}
              category={category}
              isPublicView={isPublicView}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CategoryResultsCard({
  category,
}: {
  category: CategoryResult;
  isPublicView: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-[#0a0f22] overflow-hidden shadow-lg transition-all">
      {/* Category Header */}
      <div className="border-b border-slate-800/80 bg-[#0e152e] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h4 className="text-base sm:text-lg font-bold text-white">{category.name}</h4>
            {category.winnerStatus === "CO_WINNERS" && (
              <Badge variant="warning" className="text-[10px] px-2 py-0.5">
                Co-Winners (Tie)
              </Badge>
            )}
            {category.winnerStatus === "NO_VOTES_CAST" && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-slate-400">
                No Votes
              </Badge>
            )}
          </div>
          {category.description && (
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{category.description}</p>
          )}
        </div>

        <div className="text-right sm:border-l sm:border-slate-800 sm:pl-5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
            Category Total
          </span>
          <span className="text-lg font-bold text-slate-100">
            {category.totalVotes.toLocaleString()} votes
          </span>
        </div>
      </div>

      {/* Outcome / Winner Announcement Banner */}
      {category.winnerStatus === "DECIDED" && category.winners[0] && (
        <div className="bg-gradient-to-r from-amber-950/40 via-violet-950/20 to-transparent border-b border-amber-900/30 px-5 py-3.5 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <span className="text-amber-300 font-bold">Category Winner: </span>
            <span className="text-white font-semibold">{category.winners[0].name}</span>
            <span className="text-slate-400 ml-2">
              ({category.winners[0].voteCount.toLocaleString()} votes, {category.winners[0].percentage}%)
            </span>
          </div>
        </div>
      )}

      {category.winnerStatus === "CO_WINNERS" && (
        <div className="bg-gradient-to-r from-yellow-950/40 via-amber-950/20 to-transparent border-b border-amber-800/40 px-5 py-3.5 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <span className="text-yellow-300 font-bold">Joint Co-Winners (Tie): </span>
            <span className="text-white font-semibold">
              {category.winners.map((w) => w.name).join(" & ")}
            </span>
            <span className="text-slate-400 ml-2">
              (Tied with {category.winners[0].voteCount.toLocaleString()} votes each)
            </span>
          </div>
        </div>
      )}

      {category.winnerStatus === "NO_VOTES_CAST" && (
        <div className="bg-slate-900/40 border-b border-slate-800 px-5 py-3 flex items-center gap-2 text-xs text-slate-400">
          <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
          <span>No accepted votes were submitted for this category.</span>
        </div>
      )}

      {/* Nominees Ranked Roster */}
      <div className="p-5 sm:p-6 space-y-4">
        {category.nominees.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No nominees listed in this category.</p>
        ) : (
          category.nominees.map((nominee) => (
            <NomineeResultRow
              key={nominee.nomineeId}
              nominee={nominee}
              hasVotes={category.hasVotes}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NomineeResultRow({
  nominee,
  hasVotes,
}: {
  nominee: NomineeResult;
  hasVotes: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        nominee.isWinner
          ? "border-amber-700/60 bg-amber-950/15"
          : "border-slate-800/80 bg-[#080c1d] hover:border-slate-700"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-3">
          {/* Rank Badge */}
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
              nominee.isWinner
                ? "bg-amber-500 text-slate-950 ring-2 ring-amber-400/40"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            #{nominee.rank}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{nominee.name}</span>
              {nominee.isWinner && (
                <Badge
                  variant={nominee.isTie ? "warning" : "success"}
                  className="text-[10px] px-2 py-0 font-bold"
                >
                  {nominee.isTie ? "Co-Winner" : "Winner"}
                </Badge>
              )}
            </div>
            {nominee.description && (
              <p className="text-xs text-slate-400 line-clamp-1">{nominee.description}</p>
            )}
          </div>
        </div>

        {/* Vote Counts */}
        <div className="text-right sm:shrink-0 flex items-center justify-between sm:justify-end gap-3">
          <span className="text-sm font-bold text-slate-200">
            {nominee.voteCount.toLocaleString()} {nominee.voteCount === 1 ? "vote" : "votes"}
          </span>
          <span className="text-xs font-semibold text-violet-400 font-mono w-12 text-right">
            {hasVotes ? `${nominee.percentage}%` : "—"}
          </span>
        </div>
      </div>

      {/* Percentage Progress Bar */}
      <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            nominee.isWinner
              ? "bg-gradient-to-r from-amber-500 to-yellow-400"
              : "bg-gradient-to-r from-violet-600 to-indigo-500"
          }`}
          style={{ width: `${Math.max(nominee.percentage, hasVotes && nominee.voteCount > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}
