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

/**
 * Automatically synchronizes an event's lifecycle status based on current wall-clock time:
 * 1. SCHEDULED -> LIVE: When now >= votingStartsAt and now <= votingEndsAt.
 * 2. LIVE -> CLOSED: When now > votingEndsAt.
 *
 * DRAFT, FINALIZED, and ARCHIVED states are intentional and never mutated automatically.
 * Returns the effective (synchronized) status.
 */
export async function syncEventLifecycleStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaClient: any,
  event: {
    id: string;
    status: EventStatus;
    votingStartsAt: Date | string;
    votingEndsAt: Date | string;
  }
): Promise<EventStatus> {
  const now = new Date();
  const startsAt = new Date(event.votingStartsAt);
  const endsAt = new Date(event.votingEndsAt);

  // 1. Auto-transition SCHEDULED -> LIVE when voting start time has arrived
  if (event.status === "SCHEDULED" && now >= startsAt && now <= endsAt) {
    try {
      await prismaClient.event.update({
        where: { id: event.id },
        data: { status: "LIVE" },
      });
      return "LIVE";
    } catch (err) {
      console.error(`Failed to auto-transition event ${event.id} to LIVE:`, err);
      return "LIVE";
    }
  }

  // 2. Auto-transition LIVE -> CLOSED when voting window has concluded
  if (event.status === "LIVE" && now > endsAt) {
    try {
      await prismaClient.event.update({
        where: { id: event.id },
        data: { status: "CLOSED" },
      });
      return "CLOSED";
    } catch (err) {
      console.error(`Failed to auto-transition event ${event.id} to CLOSED:`, err);
      return "CLOSED";
    }
  }

  // 3. Auto-transition SCHEDULED -> CLOSED if scheduled event window is already in the past
  if (event.status === "SCHEDULED" && now > endsAt) {
    try {
      await prismaClient.event.update({
        where: { id: event.id },
        data: { status: "CLOSED" },
      });
      return "CLOSED";
    } catch (err) {
      console.error(`Failed to auto-transition event ${event.id} to CLOSED:`, err);
      return "CLOSED";
    }
  }

  return event.status;
}

/**
 * Runs bulk status sync across all events (used during dashboard loading or background tasks).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function syncAllActiveEventStatuses(prismaClient: any): Promise<void> {
  const now = new Date();
  try {
    // Transition SCHEDULED -> LIVE
    await prismaClient.event.updateMany({
      where: {
        status: "SCHEDULED",
        votingStartsAt: { lte: now },
        votingEndsAt: { gte: now },
      },
      data: {
        status: "LIVE",
      },
    });

    // Transition LIVE -> CLOSED
    await prismaClient.event.updateMany({
      where: {
        status: "LIVE",
        votingEndsAt: { lt: now },
      },
      data: {
        status: "CLOSED",
      },
    });

    // Transition SCHEDULED whose end has passed -> CLOSED
    await prismaClient.event.updateMany({
      where: {
        status: "SCHEDULED",
        votingEndsAt: { lt: now },
      },
      data: {
        status: "CLOSED",
      },
    });
  } catch (err) {
    console.error("Non-fatal error in syncAllActiveEventStatuses:", err);
  }
}

