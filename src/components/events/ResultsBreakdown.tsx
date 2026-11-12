"use client";

import {
  Award,
  Trophy,
  Users,
  CheckCircle,
  AlertCircle,
  Flame,
  Layers,
  Sparkles,
} from "lucide-react";
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
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0f1733] to-[#0a0f24] p-5 sm:p-6 space-y-1.5 shadow-lg shadow-black/20 hover:border-slate-700 transition-all">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle className="h-4 w-4" />
            </div>
            <span>Total Accepted Votes</span>
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {results.totalVotes.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">Enforced by cryptographic duplicate prevention</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0f1733] to-[#0a0f24] p-5 sm:p-6 space-y-1.5 shadow-lg shadow-black/20 hover:border-slate-700 transition-all">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400">
              <Users className="h-4 w-4" />
            </div>
            <span>Verified Phone Voters</span>
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {results.totalUniqueVoters.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400">Authenticated via SMS OTP</p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-[#0f1733] to-[#0a0f24] p-5 sm:p-6 space-y-1.5 shadow-lg shadow-black/20 hover:border-slate-700 transition-all">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Award className="h-4 w-4" />
            </div>
            <span>Award Categories</span>
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {results.categories.length}
          </p>
          <p className="text-[11px] text-slate-400">Active competition categories</p>
        </div>
      </div>

      {/* Category Results Listing */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Trophy className="h-4 w-4" />
            </div>
            <span>Category Standings & Outcomes</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
            {results.categories.length} {results.categories.length === 1 ? "category" : "categories"}
          </span>
        </div>

        {results.categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-[#090d1c] p-10 text-center text-xs text-slate-400">
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
    <div className="rounded-3xl border border-slate-800/90 bg-[#090e21] overflow-hidden shadow-2xl shadow-black/40 transition-all">
      {/* Category Header */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-[#0d142d] via-[#0b1026] to-[#090d20] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <h4 className="text-lg font-extrabold text-white">{category.name}</h4>
            <Badge variant="glow" className="text-[10px] px-2 py-0.5">
              {category.nominees.length} {category.nominees.length === 1 ? "Nominee" : "Nominees"}
            </Badge>
            {category.winnerStatus === "CO_WINNERS" && (
              <Badge variant="warning" className="text-[10px] px-2 py-0.5">
                Co-Winners (Tie)
              </Badge>
            )}
            {category.winnerStatus === "NO_VOTES_CAST" && (
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-slate-400">
                No Votes Cast
              </Badge>
            )}
          </div>
          {category.description && (
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed pl-9">
              {category.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 sm:border-l sm:border-slate-800/80 sm:pl-6 shrink-0">
          <div className="h-9 w-9 rounded-2xl bg-violet-950/60 border border-violet-700/40 flex items-center justify-center text-violet-300 shadow-inner">
            <Flame className="h-4 w-4 text-amber-400 fill-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Category Total
            </span>
            <span className="text-base sm:text-lg font-extrabold text-white">
              {category.totalVotes.toLocaleString()} {category.totalVotes === 1 ? "vote" : "votes"}
            </span>
          </div>
        </div>
      </div>

      {/* Outcome / Winner Announcement Banner */}
      {category.winnerStatus === "DECIDED" && category.winners[0] && (
        <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-transparent border-b border-amber-900/40 px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 ring-1 ring-amber-400/40 shadow-sm">
              <Trophy className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <span className="text-amber-300 font-extrabold uppercase tracking-wide mr-1.5">
                Category Winner:
              </span>
              <span className="text-white font-bold text-sm">{category.winners[0].name}</span>
              <span className="text-slate-400 ml-2 font-mono">
                ({category.winners[0].voteCount.toLocaleString()} votes • {category.winners[0].percentage}% voice)
              </span>
            </div>
          </div>
          <Badge variant="glow" className="hidden sm:inline-flex text-[10px] bg-amber-500/10 border-amber-500/30 text-amber-300">
            🥇 Decided Winner
          </Badge>
        </div>
      )}

      {category.winnerStatus === "CO_WINNERS" && (
        <div className="bg-gradient-to-r from-yellow-950/40 via-amber-950/20 to-transparent border-b border-amber-800/40 px-6 py-3.5 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0 ring-1 ring-yellow-400/40">
            <Trophy className="h-4 w-4" />
          </div>
          <div className="text-xs">
            <span className="text-yellow-300 font-extrabold uppercase tracking-wide mr-1.5">
              Joint Co-Winners (Tie):
            </span>
            <span className="text-white font-bold">
              {category.winners.map((w) => w.name).join(" & ")}
            </span>
            <span className="text-slate-400 ml-2 font-mono">
              (Tied with {category.winners[0].voteCount.toLocaleString()} votes each)
            </span>
          </div>
        </div>
      )}

      {category.winnerStatus === "NO_VOTES_CAST" && (
        <div className="bg-slate-900/50 border-b border-slate-800 px-6 py-3 flex items-center gap-2.5 text-xs text-slate-400">
          <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
          <span>No accepted votes were submitted for this category. Nominees are listed in roster order.</span>
        </div>
      )}

      {/* Nominees Ranked Card Grid */}
      <div className="p-5 sm:p-6">
        {category.nominees.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">
            No nominees listed in this category.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {category.nominees.map((nominee) => (
              <NomineeCard
                key={nominee.nomineeId}
                nominee={nominee}
                categoryName={category.name}
                categoryTotalVotes={category.totalVotes}
                hasVotes={category.hasVotes}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function renderRankBadge(rank: number, votes: number, totalInScope: number) {
  if (totalInScope === 0 || votes === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-slate-900/80 text-slate-400 border-slate-800">
        <span>Contender</span>
      </span>
    );
  }
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold border bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/10 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950/40">
        <span className="text-sm">🥇</span>
        <span>1st Place</span>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-gradient-to-r from-slate-300/20 to-slate-400/10 text-slate-200 border-slate-400/40 shadow-sm">
        <span className="text-sm">🥈</span>
        <span>2nd Place</span>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-gradient-to-r from-amber-700/25 to-amber-800/15 text-amber-200 border-amber-700/40 shadow-sm">
        <span className="text-sm">🥉</span>
        <span>3rd Place</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-slate-900/80 text-slate-300 border-slate-800">
      <span>Rank #{rank}</span>
    </span>
  );
}

function NomineeCard({
  nominee,
  categoryName,
  categoryTotalVotes,
  hasVotes,
}: {
  nominee: NomineeResult;
  categoryName: string;
  categoryTotalVotes: number;
  hasVotes: boolean;
}) {
  const isLeader = nominee.rank === 1 && nominee.voteCount > 0;
  const isSecond = nominee.rank === 2 && nominee.voteCount > 0;
  const isThird = nominee.rank === 3 && nominee.voteCount > 0;

  // Dynamic glowing border according to placement
  const cardBorder = nominee.isWinner || isLeader
    ? "border-amber-500/50 shadow-xl shadow-amber-950/20 bg-gradient-to-b from-[#131b38] via-[#0d142b] to-[#080d1e]"
    : isSecond
    ? "border-slate-400/40 shadow-lg shadow-slate-950/20 bg-gradient-to-b from-[#0f1733] via-[#0c1226] to-[#080d1e]"
    : isThird
    ? "border-amber-700/40 shadow-lg shadow-amber-950/15 bg-gradient-to-b from-[#0e1630] via-[#0b1022] to-[#080d1e]"
    : "border-slate-800/90 bg-gradient-to-b from-[#0b1024] to-[#070b18] hover:border-slate-700";

  return (
    <div
      className={`rounded-3xl border ${cardBorder} p-5 flex flex-col justify-between hover:border-violet-500/60 hover:shadow-2xl hover:shadow-violet-950/25 transition-all duration-300 group relative`}
    >
      <div>
        {/* Row 1: Category Tag & Vote Count */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge
            variant="glow"
            className="text-[10px] px-2.5 py-0.5 truncate max-w-[170px]"
          >
            {categoryName}
          </Badge>

          {/* Vote Count Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border border-violet-500/40 bg-gradient-to-r from-violet-950/80 to-indigo-950/80 text-violet-200 shadow-sm shrink-0">
            <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
            <span>
              {nominee.voteCount.toLocaleString()} {nominee.voteCount === 1 ? "Vote" : "Votes"}
            </span>
          </div>
        </div>

        {/* Row 2: Rank Badge & Winner Status */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          {renderRankBadge(nominee.rank, nominee.voteCount, categoryTotalVotes)}

          {nominee.isWinner && (
            <Badge
              variant={nominee.isTie ? "warning" : "success"}
              className="text-[10px] px-2.5 py-0.5 font-bold flex items-center gap-1 shadow-sm"
            >
              <Trophy className="h-3 w-3" />
              <span>{nominee.isTie ? "Co-Winner" : "Winner"}</span>
            </Badge>
          )}
        </div>

        {/* Row 3: Photo / Portrait with Fallback */}
        <div className="space-y-3.5 mb-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-inner group-hover:scale-[1.01] transition-transform duration-300">
            {nominee.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={nominee.imageUrl}
                alt={nominee.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-violet-400 bg-gradient-to-br from-violet-950/30 via-[#0a0f24] to-[#070b18]">
                <Users className="h-12 w-12 opacity-80" />
                <span className="text-[11px] text-slate-500 mt-2 font-medium">No photo provided</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080d1e] via-transparent to-transparent opacity-60" />
          </div>

          {/* Nominee Name & Bio Preview */}
          <div>
            <h4 className="text-lg font-extrabold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
              {nominee.name}
            </h4>
            {nominee.description ? (
              <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed min-h-[32px]">
                {nominee.description}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic mt-1 min-h-[32px]">
                No biographical statement provided.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Category Voice Share Progress Bar & Percentage */}
      <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-slate-400">Category Voice</span>
          <span className="font-extrabold text-violet-300 font-mono">
            {hasVotes ? `${nominee.percentage}%` : "—"}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-900/90 overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              nominee.isWinner || isLeader
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                : "bg-gradient-to-r from-violet-600 to-indigo-500"
            }`}
            style={{
              width: `${Math.max(nominee.percentage, hasVotes && nominee.voteCount > 0 ? 3 : 0)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
