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
