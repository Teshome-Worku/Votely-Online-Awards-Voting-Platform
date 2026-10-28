"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateEventInput } from "@/lib/event-validation";
import { generateUniqueSlug } from "@/lib/slug";
import { isAllowedTransition } from "@/lib/event-lifecycle";
import type { EventStatus, Event } from "@prisma/client";

export interface EventActionResult {
  success: boolean;
  event?: Event;
  eventId?: string;
  slug?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Server action: Create a new awards event in DRAFT status.
 */
export async function createEventAction(
  formData: FormData
): Promise<EventActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required to create an event." };
  }

  if (user.role !== "ORGANIZER") {
    return { success: false, error: "Unauthorized: Only registered organizers may create awards competitions." };
  }

  const name = formData.get("name")?.toString() || "";
  const description = formData.get("description")?.toString() || "";
  const startDate = formData.get("startDate")?.toString() || "";
  const endDate = formData.get("endDate")?.toString() || "";
  const votingStartsAt = formData.get("votingStartsAt")?.toString() || "";
  const votingEndsAt = formData.get("votingEndsAt")?.toString() || "";
  const bannerUrl = formData.get("bannerUrl")?.toString() || undefined;
  const logoUrl = formData.get("logoUrl")?.toString() || undefined;

  const validation = validateEventInput({
    name,
    description,
    startDate,
    endDate,
    votingStartsAt,
    votingEndsAt,
    bannerUrl,
    logoUrl,
  });

  if (!validation.isValid || !validation.parsedDates) {
    return {
      success: false,
      fieldErrors: validation.errors,
      error: "Please correct the errors in the event form.",
    };
  }

  try {
    const slug = await generateUniqueSlug(name.trim());

    // Create event with status DRAFT and strict organizer ownership
    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        slug,
        description: description.trim(),
        startDate: validation.parsedDates.startDate,
        endDate: validation.parsedDates.endDate,
        votingStartsAt: validation.parsedDates.votingStartsAt,
        votingEndsAt: validation.parsedDates.votingEndsAt,
        bannerUrl: bannerUrl ? bannerUrl.trim() : null,
        logoUrl: logoUrl ? logoUrl.trim() : null,
        status: "DRAFT",
        organizerId: user.id,
      },
    });

    try {
      revalidatePath("/dashboard");
    } catch {
      // Ignore static cache context errors in tests
    }
    return {
      success: true,
      eventId: event.id,
      slug: event.slug,
      event,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create event.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Update an existing event details.
 */
export async function updateEventAction(
  eventId: string,
  formData: FormData
): Promise<EventActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const existing = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!existing) {
    return { success: false, error: "Event not found." };
  }

  // Strict ownership check
  if (existing.organizerId !== user.id) {
    return {
      success: false,
      error: "Unauthorized: You do not have permission to modify this event.",
    };
  }

  // Lifecycle check: Finalized and archived competitions are permanently locked
  if (existing.status === "FINALIZED" || existing.status === "ARCHIVED") {
    return {
      success: false,
      error: `Event details and schedule cannot be altered when status is ${existing.status.toLowerCase()}.`,
    };
  }

  const name = formData.get("name")?.toString() || "";
  const description = formData.get("description")?.toString() || "";
  const startDate = formData.get("startDate")?.toString() || "";
  const endDate = formData.get("endDate")?.toString() || "";
  const votingStartsAt = formData.get("votingStartsAt")?.toString() || "";
  const votingEndsAt = formData.get("votingEndsAt")?.toString() || "";
  const bannerUrl = formData.get("bannerUrl")?.toString() || undefined;
  const logoUrl = formData.get("logoUrl")?.toString() || undefined;

  const validation = validateEventInput({
    name,
    description,
    startDate,
    endDate,
    votingStartsAt,
    votingEndsAt,
    bannerUrl,
    logoUrl,
  });

  if (!validation.isValid || !validation.parsedDates) {
    return {
      success: false,
      fieldErrors: validation.errors,
      error: "Please correct the form errors.",
    };
  }

  // If voting is live, start dates cannot be modified (cannot un-start a live vote)
  if (existing.status === "LIVE") {
    if (validation.parsedDates.startDate.getTime() !== existing.startDate.getTime()) {
      return {
        success: false,
        fieldErrors: { startDate: "Event start date cannot be altered while voting is live." },
        error: "Event start date cannot be altered while voting is live.",
      };
    }
    if (validation.parsedDates.votingStartsAt.getTime() !== existing.votingStartsAt.getTime()) {
      return {
        success: false,
        fieldErrors: { votingStartsAt: "Voting open date cannot be altered while voting is live." },
        error: "Voting open date cannot be altered while voting is live.",
      };
    }
  }

  try {
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        name: name.trim(),
        description: description.trim(),
        startDate: validation.parsedDates.startDate,
        endDate: validation.parsedDates.endDate,
        votingStartsAt: validation.parsedDates.votingStartsAt,
        votingEndsAt: validation.parsedDates.votingEndsAt,
        bannerUrl: bannerUrl ? bannerUrl.trim() : null,
        logoUrl: logoUrl ? logoUrl.trim() : null,
      },
    });

    try {
      revalidatePath("/dashboard");
      revalidatePath(`/dashboard/events/${eventId}`);
      revalidatePath(`/events/${updated.slug}`);
    } catch {
      // Ignore static cache context errors in tests
    }

    return { success: true, event: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update event.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Adjust an event's schedule (event duration and voting window).
 * Enforces lifecycle status rules (DRAFT/SCHEDULED can change all dates; LIVE can extend end dates; FINALIZED/ARCHIVED are locked).
 */
export async function updateEventScheduleAction(
  eventId: string,
  formData: FormData
): Promise<EventActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const existing = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!existing) {
    return { success: false, error: "Event not found." };
  }

  if (existing.organizerId !== user.id) {
    return {
      success: false,
      error: "Unauthorized: You do not have permission to modify this event.",
    };
  }

  // Lifecycle check: Finalized and archived events are strictly locked
  if (existing.status === "FINALIZED" || existing.status === "ARCHIVED") {
    return {
      success: false,
      error: `Schedule cannot be modified when event is ${existing.status.toLowerCase()}.`,
    };
  }

  const startDate = formData.get("startDate")?.toString() || existing.startDate.toISOString();
  const endDate = formData.get("endDate")?.toString() || existing.endDate.toISOString();
  const votingStartsAt = formData.get("votingStartsAt")?.toString() || existing.votingStartsAt.toISOString();
  const votingEndsAt = formData.get("votingEndsAt")?.toString() || existing.votingEndsAt.toISOString();

  const validation = validateEventInput({
    name: existing.name,
    description: existing.description,
    startDate,
    endDate,
    votingStartsAt,
    votingEndsAt,
  });

  if (!validation.isValid || !validation.parsedDates) {
    return {
      success: false,
      fieldErrors: validation.errors,
      error: "Please correct the schedule dates.",
    };
  }

  // If LIVE, start dates cannot be altered
  if (existing.status === "LIVE") {
    if (validation.parsedDates.startDate.getTime() !== existing.startDate.getTime()) {
      return {
        success: false,
        fieldErrors: { startDate: "Event start date cannot be altered while live." },
        error: "Event start date cannot be altered while live.",
      };
    }
    if (validation.parsedDates.votingStartsAt.getTime() !== existing.votingStartsAt.getTime()) {
      return {
        success: false,
        fieldErrors: { votingStartsAt: "Voting open date cannot be altered while live." },
        error: "Voting open date cannot be altered while live.",
      };
    }
  }

  try {
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        startDate: validation.parsedDates.startDate,
        endDate: validation.parsedDates.endDate,
        votingStartsAt: validation.parsedDates.votingStartsAt,
        votingEndsAt: validation.parsedDates.votingEndsAt,
      },
    });

    try {
      revalidatePath("/dashboard");
      revalidatePath(`/dashboard/events/${eventId}`);
      revalidatePath(`/events/${updated.slug}`);
    } catch {
      // Ignore static cache context errors in tests
    }

    return { success: true, event: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update schedule.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Transition event lifecycle status.
 */
export async function updateEventStatusAction(
  eventId: string,
  targetStatus: EventStatus
): Promise<EventActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const existing = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!existing) {
    return { success: false, error: "Event not found." };
  }

  // Strict ownership check
  if (existing.organizerId !== user.id) {
    return {
      success: false,
      error: "Unauthorized: You do not have permission to manage this event.",
    };
  }

  // Verify transition is permitted by lifecycle state machine
  if (!isAllowedTransition(existing.status, targetStatus)) {
    return {
      success: false,
      error: `Illegal state transition: Cannot change event status from ${existing.status} to ${targetStatus}.`,
    };
  }

  try {
    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { status: targetStatus },
    });

    try {
      revalidatePath("/dashboard");
      revalidatePath(`/dashboard/events/${eventId}`);
      revalidatePath(`/events/${updated.slug}`);
    } catch {
      // Ignore static cache context errors in tests
    }

    return { success: true, event: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update status.";
    return { success: false, error: message };
  }
}
