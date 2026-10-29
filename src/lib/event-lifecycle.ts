import { EventStatus } from "@prisma/client";

/**
 * Valid state transitions mapping
 */
const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  DRAFT: ["SCHEDULED", "LIVE"],
  SCHEDULED: ["DRAFT", "LIVE"],
  LIVE: ["CLOSED"],
  CLOSED: ["LIVE", "FINALIZED"],
  FINALIZED: ["ARCHIVED"],
  ARCHIVED: [],
};

/**
 * Checks whether a lifecycle transition is permitted.
 */
export function isAllowedTransition(
  currentStatus: EventStatus,
  targetStatus: EventStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Checks if an event is publicly visible to anonymous visitors.
 * DRAFT events are strictly private.
 */
export function isPubliclyVisibleStatus(status: EventStatus): boolean {
  return status !== "DRAFT" && status !== "ARCHIVED";
}

/**
 * Determines whether voting is currently open and accepting votes.
 * An event is open for voting when:
 * 1. It is explicitly set to LIVE (and within or before votingEndsAt), OR
 * 2. It is SCHEDULED and the current time is within [votingStartsAt, votingEndsAt].
 * DRAFT, CLOSED, FINALIZED, and ARCHIVED events never accept votes.
 */
export function isVotingActive(event: {
  status: EventStatus;
  votingStartsAt: Date | string;
  votingEndsAt: Date | string;
}): boolean {
  if (
    event.status === "DRAFT" ||
    event.status === "CLOSED" ||
    event.status === "FINALIZED" ||
    event.status === "ARCHIVED"
  ) {
    return false;
  }

  const now = Date.now();
  const startMs = new Date(event.votingStartsAt).getTime();
  const endMs = new Date(event.votingEndsAt).getTime();

  // If voting window has passed, voting is concluded regardless of status
  if (endMs && now > endMs) {
    return false;
  }

  // Explicitly activated by organizer
  if (event.status === "LIVE") {
    return true;
  }

  // Automatic schedule opening when window arrives
  if (event.status === "SCHEDULED") {
    return now >= startMs && now <= endMs;
  }

  return false;
}

