"use client";

import * as React from "react";
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
} from "lucide-react";
import type { EventStatus } from "@prisma/client";
import { isVotingActive } from "@/lib/event-lifecycle";

interface NomineeItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
}

interface CategoryItem {
  id: string;
  name: string;
  description: string | null;
  nominees: NomineeItem[];
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

export function PublicEventVoting({
  eventId,
  eventName,
  eventSlug,
  eventStatus,
  votingStartsAt,
  votingEndsAt,
  categories,
}: Props) {
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

  const isLive = React.useMemo(() => {
    if (!votingStartsAt || !votingEndsAt) {
      return eventStatus === "LIVE";
    }
    return isVotingActive({
      status: eventStatus,
      votingStartsAt,
      votingEndsAt,
    });
  }, [eventStatus, votingStartsAt, votingEndsAt]);

  const disabledLabel = React.useMemo(() => {
    if (
      eventStatus === "CLOSED" ||
      eventStatus === "FINALIZED" ||
      eventStatus === "ARCHIVED"
    ) {
      return "Voting Concluded";
    }
    if (votingEndsAt && Date.now() > new Date(votingEndsAt).getTime()) {
      return "Voting Concluded";
    }
    return "Voting Not Open";
  }, [eventStatus, votingEndsAt]);

  // Aggregate all nominees with category metadata for the "ALL" view
  const allNomineesList = React.useMemo(() => {
    const list: (NomineeItem & { categoryId: string; categoryName: string })[] = [];
    for (const cat of categories) {
      for (const nom of cat.nominees) {
        list.push({
          ...nom,
          categoryId: cat.id,
          categoryName: cat.name,
        });
      }
    }
    return list;
  }, [categories]);

  // Total nominees count across event
  const totalNominees = allNomineesList.length;

  // Currently displayed nominees based on selected category tab
  const displayedNominees = React.useMemo(() => {
    if (selectedCategory === "ALL") {
      return allNomineesList;
    }
    const targetCat = categories.find((c) => c.id === selectedCategory);
    if (!targetCat) return [];
    return targetCat.nominees.map((n) => ({
      ...n,
      categoryId: targetCat.id,
      categoryName: targetCat.name,
    }));
  }, [selectedCategory, allNomineesList, categories]);

  // Active Category info for title & description display
  const activeCategoryInfo = React.useMemo(() => {
    if (selectedCategory === "ALL") return null;
    return categories.find((c) => c.id === selectedCategory) || null;
  }, [selectedCategory, categories]);

  // Detect ?nominee=[id] in URL on mount and auto-open nominee detail modal
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nomineeParam = params.get("nominee");
    if (!nomineeParam) return;

    for (const cat of categories) {
      const match = cat.nominees.find((n) => n.id === nomineeParam);
      if (match) {
        setSelectedCategory(cat.id);
        setDetailNominee({
          ...match,
          categoryId: cat.id,
          categoryName: cat.name,
        });
        break;
      }
    }
  }, [categories]);

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

  const openNomineeDetail = (nom: NomineeItem & { categoryId: string; categoryName: string }) => {
    setDetailNominee({
      id: nom.id,
      name: nom.name,
      description: nom.description,
      imageUrl: nom.imageUrl,
      categoryId: nom.categoryId,
      categoryName: nom.categoryName,
      displayOrder: nom.displayOrder,
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
            {categories.length} Categor{categories.length === 1 ? "y" : "ies"} • {totalNominees} Nominee{totalNominees === 1 ? "" : "s"}
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
          {categories.map((cat) => {
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
            <span>Swipe or click arrows to explore nominees</span>
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
              return (
                <div
                  key={nom.id}
                  onClick={() => openNomineeDetail(nom)}
                  className="w-[280px] sm:w-[320px] shrink-0 snap-start rounded-3xl border border-slate-800/90 bg-gradient-to-b from-[#0e162d] to-[#090d1c] p-5 flex flex-col justify-between hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-950/30 transition-all duration-300 group cursor-pointer relative"
                >
                  {/* Top Header: Category Tag & Quick Share Action */}
                  <div className="flex items-center justify-between gap-2 mb-3">
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
        />
      )}
    </div>
  );
}
