"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VotingModal } from "./VotingModal";
import { NomineeDetailModal, type NomineeDetailInfo } from "./NomineeDetailModal";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
  Flame,
  Volume2,
} from "lucide-react";
import type { EventStatus } from "@prisma/client";
import { isVotingActive } from "@/lib/event-lifecycle";

export interface NomineeItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  voteCount?: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  nominees: NomineeItem[];
}

interface RankedNominee extends NomineeItem {
  categoryId: string;
  categoryName: string;
  rank: number;
  totalVotesInScope: number;
  percentage: number;
}

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventStatus: EventStatus;
  votingStartsAt?: string | Date;
  votingEndsAt?: string | Date;
  categories: CategoryItem[];
}

/**
 * Render prestigious rank symbols and badges for 1st, 2nd, 3rd, and other places.
 * Rankings are strictly per category (independent competition).
 */
function renderRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide border shadow-md bg-gradient-to-r from-amber-500/25 via-yellow-500/25 to-amber-600/25 text-amber-300 border-amber-400/60 shadow-amber-950/40 ring-1 ring-amber-400/30">
        <span className="text-sm leading-none" role="img" aria-label="1st place gold medal">🥇</span>
        <span>1st Place</span>
      </span>
    );
  }

  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide border shadow-md bg-gradient-to-r from-slate-200/25 via-slate-100/25 to-slate-300/25 text-slate-100 border-slate-300/50 shadow-slate-950/40 ring-1 ring-slate-300/30">
        <span className="text-sm leading-none" role="img" aria-label="2nd place silver medal">🥈</span>
        <span>2nd Place</span>
      </span>
    );
  }

  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide border shadow-md bg-gradient-to-r from-amber-700/30 via-orange-800/25 to-amber-900/30 text-amber-300 border-amber-600/50 shadow-amber-950/40 ring-1 ring-amber-600/30">
        <span className="text-sm leading-none" role="img" aria-label="3rd place bronze medal">🥉</span>
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

export function PublicEventVoting({
  eventId,
  eventName,
  eventSlug,
  eventStatus,
  votingStartsAt,
  votingEndsAt,
  categories,
}: Props) {
  const router = useRouter();

  // Local state for optimistic live vote updates
  const [categoriesState, setCategoriesState] = React.useState<CategoryItem[]>(categories);

  // Sync state whenever server revalidates props
  React.useEffect(() => {
    setCategoriesState(categories);
  }, [categories]);

  // Selected category filter tab ("ALL" or category.id)
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  // Voting Modal state
  const [votingNominee, setVotingNominee] = React.useState<{
    id: string;
    name: string;
    imageUrl?: string | null;
    categoryName: string;
    categoryId: string;
  } | null>(null);

  // Nominee Detail & Share Modal state
  const [detailNominee, setDetailNominee] = React.useState<NomineeDetailInfo | null>(null);

  // Quick copied feedback state per nominee id
  const [copiedNomineeId, setCopiedNomineeId] = React.useState<string | null>(null);

  // Ref for the horizontal carousel container
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  // Live wall-clock time updated every second to ensure instantaneous button state transitions
  const [currentMs, setCurrentMs] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    setCurrentMs(Date.now());
    const interval = setInterval(() => {
      setCurrentMs(Date.now());
    }, 1000);

    const handlePhaseChange = () => {
      setCurrentMs(Date.now());
      router.refresh();
    };

    window.addEventListener("votely:voting-phase-change", handlePhaseChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener("votely:voting-phase-change", handlePhaseChange);
    };
  }, [router]);

  const startMs = React.useMemo(
    () => (votingStartsAt ? new Date(votingStartsAt).getTime() : 0),
    [votingStartsAt]
  );
  const endMs = React.useMemo(
    () => (votingEndsAt ? new Date(votingEndsAt).getTime() : 0),
    [votingEndsAt]
  );

  const isClosedStatus =
    eventStatus === "CLOSED" ||
    eventStatus === "FINALIZED" ||
    eventStatus === "ARCHIVED" ||
    eventStatus === "DRAFT";

  const isPastVotingEnd = React.useMemo(() => {
    if (!endMs) return false;
    return currentMs > endMs;
  }, [endMs, currentMs]);

  const isLive = React.useMemo(() => {
    if (isClosedStatus) return false;
    if (endMs && currentMs > endMs) return false;

    // Explicitly LIVE by organizer
    if (eventStatus === "LIVE") return true;

    // Scheduled opening automatically unlocked when window arrives
    if (eventStatus === "SCHEDULED") {
      return currentMs >= startMs && currentMs <= endMs;
    }

    return false;
  }, [isClosedStatus, eventStatus, startMs, endMs, currentMs]);

  const disabledLabel = React.useMemo(() => {
    if (isClosedStatus || isPastVotingEnd) {
      return "Voting Concluded";
    }
    return "Voting Not Open";
  }, [isClosedStatus, isPastVotingEnd]);

  // When isLive changes (voting automatically opens or closes), auto-refresh Next.js server state
  const prevLiveRef = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (prevLiveRef.current !== null && prevLiveRef.current !== isLive) {
      router.refresh();
    }
    prevLiveRef.current = isLive;
  }, [isLive, router]);

  // 1. Process nominees for "ALL" view, preserving each nominee's true category ranking and voice
  const allNomineesList = React.useMemo((): RankedNominee[] => {
    const list: RankedNominee[] = [];

    // Each category is an independent competition. Nominees are ranked strictly within their own category!
    for (const cat of categoriesState) {
      const totalVotesInCat = cat.nominees.reduce(
        (sum, n) => sum + (n.voteCount || 0),
        0
      );

      // Sort nominees within this category by votes descending, then displayOrder asc, then name asc
      const sortedInCat = [...cat.nominees].sort((a, b) => {
        const vA = a.voteCount || 0;
        const vB = b.voteCount || 0;
        if (vB !== vA) return vB - vA;
        if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
        return a.name.localeCompare(b.name);
      });

      // Compute standard competition rank within this category
      let currentRank = 1;
      const rankedInCat = sortedInCat.map((nom, idx) => {
        const vCount = nom.voteCount || 0;
        if (idx > 0 && vCount < (sortedInCat[idx - 1].voteCount || 0)) {
          currentRank = idx + 1;
        }
        const percentage =
          totalVotesInCat > 0
            ? Math.round((vCount / totalVotesInCat) * 1000) / 10
            : sortedInCat.length === 1
            ? 100
            : 0;

        return {
          ...nom,
          categoryId: cat.id,
          categoryName: cat.name,
          rank: currentRank,
          totalVotesInScope: totalVotesInCat,
          percentage,
        };
      });

      list.push(...rankedInCat);
    }

    return list;
  }, [categoriesState]);

  // Total nominees count across event
  const totalNominees = allNomineesList.length;

  // 2. Process nominees sorted and ranked by votes for the chosen Category
  const categoryNominees = React.useMemo((): RankedNominee[] => {
    if (selectedCategory === "ALL") return [];
    const targetCat = categoriesState.find((c) => c.id === selectedCategory);
    if (!targetCat) return [];

    const totalVotesInCat = targetCat.nominees.reduce(
      (sum, n) => sum + (n.voteCount || 0),
      0
    );

    // Sort by voteCount descending, then displayOrder asc, then name asc
    const sorted = [...targetCat.nominees].sort((a, b) => {
      const vA = a.voteCount || 0;
      const vB = b.voteCount || 0;
      if (vB !== vA) return vB - vA;
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return a.name.localeCompare(b.name);
    });

    // Compute standard competition rank within this category
    let currentRank = 1;
    return sorted.map((nom, idx) => {
      const vCount = nom.voteCount || 0;
      if (idx > 0 && vCount < (sorted[idx - 1].voteCount || 0)) {
        currentRank = idx + 1;
      }
      const percentage =
        totalVotesInCat > 0
          ? Math.round((vCount / totalVotesInCat) * 1000) / 10
          : 0;

      return {
        ...nom,
        categoryId: targetCat.id,
        categoryName: targetCat.name,
        rank: currentRank,
        totalVotesInScope: totalVotesInCat,
        percentage,
      };
    });
  }, [selectedCategory, categoriesState]);

  // Currently displayed nominees based on selected category tab (always ranked!)
  const displayedNominees: RankedNominee[] = React.useMemo(() => {
    if (selectedCategory === "ALL") {
      return allNomineesList;
    }
    return categoryNominees;
  }, [selectedCategory, allNomineesList, categoryNominees]);

  // Active Category info for title & description display
  const activeCategoryInfo = React.useMemo(() => {
    if (selectedCategory === "ALL") return null;
    return categoriesState.find((c) => c.id === selectedCategory) || null;
  }, [selectedCategory, categoriesState]);

  // Detect ?nominee=[id] in URL on mount and auto-open nominee detail modal with live standings
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nomineeParam = params.get("nominee");
    if (!nomineeParam) return;

    for (const cat of categoriesState) {
      const match = cat.nominees.find((n) => n.id === nomineeParam);
      if (match) {
        // Find ranked version from allNomineesList
        const rankedMatch = allNomineesList.find((n) => n.id === nomineeParam);
        const timer = setTimeout(() => {
          setSelectedCategory(cat.id);
          setDetailNominee({
            ...match,
            categoryId: cat.id,
            categoryName: cat.name,
            voteCount: match.voteCount ?? 0,
            rank: rankedMatch?.rank,
            percentage: rankedMatch?.percentage,
            totalVotesInScope: rankedMatch?.totalVotesInScope,
          });
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [categoriesState, allNomineesList]);

  // Check carousel scroll boundaries
  const updateScrollButtons = React.useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  React.useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, displayedNominees]);

  const handleScroll = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const cardWidth = 320;
    const scrollAmount = direction === "left" ? -cardWidth * 1.5 : cardWidth * 1.5;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Quick copy nominee direct share link
  const handleCopyNomineeLink = async (
    e: React.MouseEvent,
    nomineeId: string
  ) => {
    e.stopPropagation();
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const directUrl = `${origin}/events/${eventSlug}?nominee=${nomineeId}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(directUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = directUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopiedNomineeId(nomineeId);
      setTimeout(() => setCopiedNomineeId(null), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const openNomineeDetail = (nom: RankedNominee) => {
    setDetailNominee({
      id: nom.id,
      name: nom.name,
      description: nom.description,
      imageUrl: nom.imageUrl,
      categoryId: nom.categoryId,
      categoryName: nom.categoryName,
      displayOrder: nom.displayOrder,
      voteCount: nom.voteCount ?? 0,
      rank: nom.rank,
      percentage: nom.percentage,
      totalVotesInScope: nom.totalVotesInScope,
    });

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("nominee", nom.id);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const closeNomineeDetail = () => {
    setDetailNominee(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("nominee");
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Optimistic vote count update and trigger server re-fetch
  const handleVoteSuccess = (nomineeId: string) => {
    setCategoriesState((prev) =>
      prev.map((cat) => ({
        ...cat,
        nominees: cat.nominees.map((n) =>
          n.id === nomineeId ? { ...n, voteCount: (n.voteCount ?? 0) + 1 } : n
        ),
      }))
    );
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. Category Filter Pill Buttons                                          */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Browse by Category
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {categoriesState.length} Categor{categoriesState.length === 1 ? "y" : "ies"} • {totalNominees} Nominee{totalNominees === 1 ? "" : "s"}
          </span>
        </div>

        {/* Category Pill Buttons Scrollable Container */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {/* "All Nominees" Button */}
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
              selectedCategory === "ALL"
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-400/50 shadow-lg shadow-violet-600/30 ring-2 ring-violet-500/30"
                : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700"
            }`}
          >
            <span>All Nominees</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                selectedCategory === "ALL"
                  ? "bg-white/20 text-white"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {totalNominees}
            </span>
          </button>

          {/* Individual Category Pill Buttons */}
          {categoriesState.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-2 border ${
                  isSelected
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-400/50 shadow-lg shadow-violet-600/30 ring-2 ring-violet-500/30"
                    : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {cat.nominees.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Category Description Header if a specific category is chosen */}
      {activeCategoryInfo && (
        <div className="rounded-2xl border border-slate-800/80 bg-gradient-to-r from-[#0b1022] to-[#090d1c] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>{activeCategoryInfo.name}</span>
              <Badge variant="glow" className="text-[10px] px-2 py-0.5">
                {activeCategoryInfo.nominees.length} Contenders
              </Badge>
            </h4>
            {activeCategoryInfo.description && (
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                {activeCategoryInfo.description}
              </p>
            )}
          </div>
          <span className="text-xs text-violet-300 font-medium shrink-0 flex items-center gap-1.5">
            <span>Ranked by real verified votes • Swipe to explore</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Horizontal Scrollable / Swipeable Carousel                             */}
      {/* ========================================================================= */}
      {displayedNominees.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-[#090e20]/60 p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-950/60 text-violet-400">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No nominees in this category yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            The organizer has not added nominees to this category. Select another category or view &ldquo;All Nominees&rdquo;.
          </p>
        </div>
      ) : (
        <div className="relative group/carousel">
          {/* Carousel Left Navigation Arrow Button */}
          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className={`hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full items-center justify-center border transition-all shadow-2xl cursor-pointer ${
              canScrollLeft
                ? "bg-slate-900/95 border-slate-700 text-white hover:bg-violet-600 hover:border-violet-500 shadow-violet-950/50"
                : "bg-slate-900/40 border-slate-800/40 text-slate-600 opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Carousel Right Navigation Arrow Button */}
          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className={`hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full items-center justify-center border transition-all shadow-2xl cursor-pointer ${
              canScrollRight
                ? "bg-slate-900/95 border-slate-700 text-white hover:bg-violet-600 hover:border-violet-500 shadow-violet-950/50"
                : "bg-slate-900/40 border-slate-800/40 text-slate-600 opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Horizontal Scrollable Track */}
          <div
            ref={carouselRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {displayedNominees.map((nom) => {
              const isCopied = copiedNomineeId === nom.id;
              const vCount = nom.voteCount ?? 0;

              // Distinguish card border styling for top leaders per category
              const leaderBorder =
                nom.rank === 1
                  ? "border-amber-500/50 shadow-amber-950/20"
                  : nom.rank === 2
                  ? "border-slate-400/40 shadow-slate-950/20"
                  : nom.rank === 3
                  ? "border-amber-700/40 shadow-amber-950/15"
                  : "border-slate-800/90";

              return (
                <div
                  key={nom.id}
                  onClick={() => openNomineeDetail(nom)}
                  className={`w-[280px] sm:w-[320px] shrink-0 snap-start rounded-3xl border ${leaderBorder} bg-gradient-to-b from-[#0e162d] to-[#090d1c] p-5 flex flex-col justify-between hover:border-violet-500/60 hover:shadow-2xl hover:shadow-violet-950/30 transition-all duration-300 group cursor-pointer relative`}
                >
                  {/* Row 1: Category Tag & Quick Share Action */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <Badge
                      variant="glow"
                      className="text-[10px] px-2.5 py-0.5 truncate max-w-[190px]"
                    >
                      {nom.categoryName}
                    </Badge>

                    {/* Quick Copy Link Button */}
                    <button
                      type="button"
                      title="Copy direct link to this nominee"
                      onClick={(e) => handleCopyNomineeLink(e, nom.id)}
                      className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        isCopied
                          ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-400"
                          : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                      }`}
                    >
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Row 2: Prominent Rank Badge & Vote Count Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {renderRankBadge(nom.rank)}

                    {/* Live Vote Voice Pill */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border border-violet-500/40 bg-gradient-to-r from-violet-950/80 to-indigo-950/80 text-violet-200 shadow-sm">
                      <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                      <span>{vCount} {vCount === 1 ? "Vote" : "Votes"}</span>
                    </div>
                  </div>

                  {/* Nominee Portrait Image & Info */}
                  <div className="space-y-3.5">
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-inner group-hover:scale-[1.02] transition-transform duration-300">
                      {nom.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={nom.imageUrl}
                          alt={nom.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-violet-400 bg-gradient-to-br from-violet-950/30 to-slate-950">
                          <Users className="h-12 w-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#090d1c] via-transparent to-transparent opacity-60" />
                    </div>

                    {/* Name & Bio Preview */}
                    <div>
                      <h4 className="text-lg font-extrabold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                        {nom.name}
                      </h4>

                      {nom.description ? (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {nom.description}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 italic mt-1">
                          Official contender in this awards event.
                        </p>
                      )}
                    </div>

                    {/* Live Voice / Vote Share Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <Volume2 className="h-3 w-3 text-violet-400" />
                          <span>Category Voice</span>
                        </span>
                        <span className="font-bold text-violet-300">
                          {nom.percentage}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            nom.rank === 1 && vCount > 0
                              ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"
                              : nom.rank === 2 && vCount > 0
                              ? "bg-gradient-to-r from-slate-300 to-slate-100"
                              : nom.rank === 3 && vCount > 0
                              ? "bg-gradient-to-r from-amber-600 to-amber-500"
                              : "bg-gradient-to-r from-violet-600 to-indigo-600"
                          }`}
                          style={{
                            width: `${Math.max(nom.percentage, vCount > 0 ? 6 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: "Vote Now" & "View Details" */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2">
                    {isLive ? (
                      <Button
                        type="button"
                        variant="primaryGlow"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVotingNominee({
                            id: nom.id,
                            name: nom.name,
                            imageUrl: nom.imageUrl,
                            categoryName: nom.categoryName,
                            categoryId: nom.categoryId,
                          });
                        }}
                        className="w-full text-xs font-bold justify-center flex items-center gap-1.5 shadow-md shadow-violet-900/30 py-2.5"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-violet-200" />
                        <span>Vote Now</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        className="w-full text-xs justify-center opacity-60 cursor-not-allowed"
                      >
                        {disabledLabel}
                      </Button>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 group-hover:text-slate-300">
                      <span>Click card for details</span>
                      <span className="text-violet-400 flex items-center gap-1 font-medium group-hover:underline">
                        <span>Profile & Share</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Nominee Detail & Share Modal                                          */}
      {/* ========================================================================= */}
      {detailNominee && (
        <NomineeDetailModal
          nominee={detailNominee}
          eventName={eventName}
          eventSlug={eventSlug}
          isLive={isLive}
          disabledLabel={disabledLabel}
          onClose={closeNomineeDetail}
          onVote={() => {
            setVotingNominee({
              id: detailNominee.id,
              name: detailNominee.name,
              imageUrl: detailNominee.imageUrl,
              categoryName: detailNominee.categoryName,
              categoryId: detailNominee.categoryId,
            });
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 4. Interactive Voting Modal (Phone OTP & Submission)                     */}
      {/* ========================================================================= */}
      {votingNominee && (
        <VotingModal
          eventId={eventId}
          eventName={eventName}
          selectedNominee={votingNominee}
          onClose={() => setVotingNominee(null)}
          onVoteSuccess={handleVoteSuccess}
          isLive={isLive}
        />
      )}
    </div>
  );
}
