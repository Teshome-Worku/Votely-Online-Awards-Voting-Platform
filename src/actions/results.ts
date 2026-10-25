"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateEventResults } from "@/lib/results";
import type { Prisma } from "@prisma/client";

export interface ResultsActionResult {
  success: boolean;
  error?: string;
  version?: number;
  finalizedAt?: string;
  publishedAt?: string;
}

/**
 * Server action: Finalizes and certifies results for a closed awards event.
 * Atomically transitions event status to FINALIZED, creates a durable
 * immutable snapshot, and creates an audit log entry.
 */
export async function finalizeResultsAction(payload: {
  eventId: string;
  note?: string;
}): Promise<ResultsActionResult> {
  const { eventId, note } = payload;
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Authentication required to finalize results." };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      snapshots: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!event) {
    return { success: false, error: "Event not found." };
  }

  // Multi-tenant authorization check
  if (event.organizerId !== user.id) {
    return { success: false, error: "Unauthorized: You do not own this awards event." };
  }

  // Precondition: Event must be in CLOSED status
  if (event.status !== "CLOSED") {
    return {
      success: false,
      error: `Event cannot be finalized because its status is ${event.status}. Only CLOSED events are eligible for finalization.`,
    };
  }

  // Calculate live standings
  const results = await calculateEventResults(eventId);
  if (!results) {
    return { success: false, error: "Failed to calculate results for finalization." };
  }

  const nextVersion = (event.snapshots[0]?.version || 0) + 1;
  const finalizedAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Transition event to FINALIZED status
      await tx.event.update({
        where: { id: eventId },
        data: {
          status: "FINALIZED",
          finalizedAt,
          finalizedById: user.id,
        },
      });

      // 2. Persist durable immutable snapshot
      await tx.finalizedResultSnapshot.create({
        data: {
          eventId,
          version: nextVersion,
          finalizedById: user.id,
          totalVotes: results.totalVotes,
          totalVoters: results.totalUniqueVoters,
          categorySnapshots: results.categories as unknown as Prisma.InputJsonValue,
          note: note?.trim() || "Official finalization & winner certification",
        },
      });

      // 3. Create durable audit log entry
      await tx.auditLog.create({
        data: {
          eventId,
          userId: user.id,
          action: "RESULTS_FINALIZED",
          details: {
            version: nextVersion,
            totalVotes: results.totalVotes,
            totalUniqueVoters: results.totalUniqueVoters,
            categoriesCount: results.categories.length,
            note: note?.trim() || null,
          },
        },
      });
    });

    try {
      revalidatePath(`/dashboard/events/${eventId}`);
      revalidatePath(`/dashboard/events/${eventId}/results`);
      revalidatePath(`/events/${event.slug}`);
      revalidatePath(`/events/${event.slug}/results`);
    } catch {
      // Ignore static cache context errors in tests
    }

    return {
      success: true,
      version: nextVersion,
      finalizedAt: finalizedAt.toISOString(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to finalize event results.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Publishes certified results to the public domain.
 * Precondition: Event must already be FINALIZED.
 */
export async function publishResultsAction(eventId: string): Promise<ResultsActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required to publish results." };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return { success: false, error: "Event not found." };
  }

  // Multi-tenant authorization check
  if (event.organizerId !== user.id) {
    return { success: false, error: "Unauthorized: You do not own this awards event." };
  }

  // Precondition: Only finalized events may be published
  if (event.status !== "FINALIZED") {
    return {
      success: false,
      error: "Only finalized and certified events can have their results published.",
    };
  }

  const publishedAt = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: eventId },
        data: {
          resultsPublished: true,
          resultsPublishedAt: publishedAt,
        },
      });

      await tx.auditLog.create({
        data: {
          eventId,
          userId: user.id,
          action: "RESULTS_PUBLISHED",
          details: {
            publishedAt: publishedAt.toISOString(),
          },
        },
      });
    });

    try {
      revalidatePath(`/dashboard/events/${eventId}`);
      revalidatePath(`/dashboard/events/${eventId}/results`);
      revalidatePath(`/events/${event.slug}`);
      revalidatePath(`/events/${event.slug}/results`);
    } catch {
      // Ignore static cache context errors in tests
    }

    return {
      success: true,
      publishedAt: publishedAt.toISOString(),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to publish results.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Unpublishes results from the public domain.
 */
export async function unpublishResultsAction(eventId: string): Promise<ResultsActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required to unpublish results." };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return { success: false, error: "Event not found." };
  }

  // Multi-tenant authorization check
  if (event.organizerId !== user.id) {
    return { success: false, error: "Unauthorized: You do not own this awards event." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: eventId },
        data: {
          resultsPublished: false,
        },
      });

      await tx.auditLog.create({
        data: {
          eventId,
          userId: user.id,
          action: "RESULTS_UNPUBLISHED",
          details: {
            unpublishedAt: new Date().toISOString(),
          },
        },
      });
    });

    try {
      revalidatePath(`/dashboard/events/${eventId}`);
      revalidatePath(`/dashboard/events/${eventId}/results`);
      revalidatePath(`/events/${event.slug}`);
      revalidatePath(`/events/${event.slug}/results`);
    } catch {
      // Ignore static cache context errors in tests
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to unpublish results.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Records an authorized correction to a finalized outcome,
 * generating a new snapshot version and preserving the historical audit trail.
 */
export async function correctFinalizedResultsAction(payload: {
  eventId: string;
  correctionNote: string;
}): Promise<ResultsActionResult> {
  const { eventId, correctionNote } = payload;
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Authentication required to record correction." };
  }

  if (!correctionNote || correctionNote.trim().length < 5) {
    return { success: false, error: "A detailed correction note (min 5 characters) is required." };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      snapshots: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  if (!event) {
    return { success: false, error: "Event not found." };
  }

  if (event.organizerId !== user.id) {
    return { success: false, error: "Unauthorized: You do not own this awards event." };
  }

  if (event.status !== "FINALIZED") {
    return { success: false, error: "Corrections can only be applied to FINALIZED events." };
  }

  const results = await calculateEventResults(eventId);
  if (!results) {
    return { success: false, error: "Failed to recalculate standings for correction." };
  }

  const previousVersion = event.snapshots[0]?.version || 1;
  const nextVersion = previousVersion + 1;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.finalizedResultSnapshot.create({
        data: {
          eventId,
          version: nextVersion,
          finalizedById: user.id,
          totalVotes: results.totalVotes,
          totalVoters: results.totalUniqueVoters,
          categorySnapshots: results.categories as unknown as Prisma.InputJsonValue,
          note: `[CORRECTION v${nextVersion}] ${correctionNote.trim()}`,
        },
      });

      await tx.auditLog.create({
        data: {
          eventId,
          userId: user.id,
          action: "RESULTS_CORRECTED",
          details: {
            previousVersion,
            newVersion: nextVersion,
            correctionNote: correctionNote.trim(),
          },
        },
      });
    });

    try {
      revalidatePath(`/dashboard/events/${eventId}`);
      revalidatePath(`/dashboard/events/${eventId}/results`);
      revalidatePath(`/events/${event.slug}`);
      revalidatePath(`/events/${event.slug}/results`);
    } catch {
      // Ignore static cache context errors in tests
    }

    return {
      success: true,
      version: nextVersion,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record correction.";
    return { success: false, error: message };
  }
}
