import { prisma } from "@/lib/prisma";
import type { EventStatus, VotingRule } from "@prisma/client";

export interface NomineeResult {
  nomineeId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  voteCount: number;
  percentage: number;
  rank: number;
  isWinner: boolean;
  isTie: boolean;
}

export type CategoryWinnerStatus = "DECIDED" | "CO_WINNERS" | "NO_VOTES_CAST";

export interface CategoryResult {
  categoryId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  totalVotes: number;
  nominees: NomineeResult[];
  hasVotes: boolean;
  isTie: boolean;
  winnerStatus: CategoryWinnerStatus;
  winners: NomineeResult[];
}

export interface EventResultsData {
  eventId: string;
  eventName: string;
  eventSlug: string;
  status: EventStatus;
  votingRule: VotingRule;
  totalVotes: number;
  totalUniqueVoters: number;
  categories: CategoryResult[];
  isEligibleForFinalization: boolean;
  ineligibilityReason?: string;
  resultsPublished: boolean;
  resultsPublishedAt: string | null;
  finalizedAt: string | null;
  finalizedByName: string | null;
  snapshotVersion: number | null;
}

/**
 * Calculates complete, accurate event standings and category metrics
 * directly from persisted, accepted votes.
 *
 * Privacy Guarantee: Zero phone numbers, OTP records, or voter hashes
 * are exposed in the returned result structure.
 */
export async function calculateEventResults(eventId: string): Promise<EventResultsData | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      categories: {
        include: {
          nominees: {
            orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
          },
        },
        orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      },
      votes: {
        select: {
          id: true,
          categoryId: true,
          nomineeId: true,
          voterPhoneHash: true,
        },
      },
      finalizedBy: {
        select: { name: true },
      },
      snapshots: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!event) return null;

  // Aggregate accepted votes
  const acceptedVotes = event.votes;
  const totalVotes = acceptedVotes.length;

  // Participation metric: count distinct verified voters
  const uniqueVoterHashes = new Set(acceptedVotes.map((v) => v.voterPhoneHash));
  const totalUniqueVoters = uniqueVoterHashes.size;

  // Map votes by categoryId and nomineeId
  const voteCountsByNominee = new Map<string, number>();
  for (const vote of acceptedVotes) {
    const current = voteCountsByNominee.get(vote.nomineeId) || 0;
    voteCountsByNominee.set(vote.nomineeId, current + 1);
  }

  // Determine finalization eligibility
  const isEligibleForFinalization = event.status === "CLOSED";
  let ineligibilityReason: string | undefined;
  if (!isEligibleForFinalization) {
    if (event.status === "FINALIZED" || event.status === "ARCHIVED") {
      ineligibilityReason = `Results have already been finalized.`;
    } else {
      ineligibilityReason = `Event must be in CLOSED status before results can be certified and finalized (current status: ${event.status}).`;
    }
  }

  // Calculate category-level standings
  const categoryResults: CategoryResult[] = event.categories.map((category) => {
    const categoryVotesCount = acceptedVotes.filter((v) => v.categoryId === category.id).length;
    const hasVotes = categoryVotesCount > 0;

    // Build raw nominee entries
    const unsortedNominees = category.nominees.map((nominee) => {
      const voteCount = voteCountsByNominee.get(nominee.id) || 0;
      const percentage =
        categoryVotesCount > 0
          ? Math.round((voteCount / categoryVotesCount) * 1000) / 10
          : 0;

      return {
        nomineeId: nominee.id,
        name: nominee.name,
        description: nominee.description,
        imageUrl: nominee.imageUrl,
        displayOrder: nominee.displayOrder,
        voteCount,
        percentage,
      };
    });

    // Sort: highest voteCount first, then displayOrder asc, then name asc
    unsortedNominees.sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.name.localeCompare(b.name);
    });

    // Compute standard competition rankings (1224 ranking) and identify ties
    let currentRank = 1;
    const rankedNominees: NomineeResult[] = [];

    for (let i = 0; i < unsortedNominees.length; i++) {
      const current = unsortedNominees[i];
      if (i > 0 && current.voteCount < unsortedNominees[i - 1].voteCount) {
        // In standard competition ranking, next rank skips by number of ties
        currentRank = i + 1;
      }

      rankedNominees.push({
        ...current,
        rank: currentRank,
        isWinner: false, // populated below
        isTie: false,    // populated below
      });
    }

    // Winner & Tie Analysis
    let winnerStatus: CategoryWinnerStatus = "NO_VOTES_CAST";
    let isCategoryTie = false;
    const winners: NomineeResult[] = [];

    if (hasVotes) {
      const topVoteCount = rankedNominees[0]?.voteCount || 0;

      if (topVoteCount > 0) {
        // Find all nominees sharing top vote count
        const topNominees = rankedNominees.filter((n) => n.voteCount === topVoteCount);

        if (topNominees.length > 1) {
          // Documented Tie Handling: Formally declare Co-Winners
          winnerStatus = "CO_WINNERS";
          isCategoryTie = true;
          for (const top of topNominees) {
            top.isWinner = true;
            top.isTie = true;
            winners.push(top);
          }
        } else if (topNominees.length === 1) {
          winnerStatus = "DECIDED";
          topNominees[0].isWinner = true;
          topNominees[0].isTie = false;
          winners.push(topNominees[0]);
        }
      }
    }

    return {
      categoryId: category.id,
      name: category.name,
      description: category.description,
      displayOrder: category.displayOrder,
      totalVotes: categoryVotesCount,
      nominees: rankedNominees,
      hasVotes,
      isTie: isCategoryTie,
      winnerStatus,
      winners,
    };
  });

  const latestSnapshot = event.snapshots[0];

  return {
    eventId: event.id,
    eventName: event.name,
    eventSlug: event.slug,
    status: event.status,
    votingRule: event.votingRule,
    totalVotes,
    totalUniqueVoters,
    categories: categoryResults,
    isEligibleForFinalization,
    ineligibilityReason,
    resultsPublished: event.resultsPublished,
    resultsPublishedAt: event.resultsPublishedAt?.toISOString() || null,
    finalizedAt: event.finalizedAt?.toISOString() || null,
    finalizedByName: event.finalizedBy?.name || null,
    snapshotVersion: latestSnapshot?.version || null,
  };
}

/**
 * Retrieves the certified immutable snapshot for an event.
 * If results are finalized, returns the durable frozen snapshot rather than live tallies.
 */
export async function getCertifiedSnapshot(eventId: string, version?: number) {
  const snapshot = await prisma.finalizedResultSnapshot.findFirst({
    where: {
      eventId,
      ...(version ? { version } : {}),
    },
    orderBy: { version: "desc" },
    include: {
      finalizedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return snapshot;
}
