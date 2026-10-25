"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateNomineeInput, canModifyStructure, canDeleteStructure } from "@/lib/category-validation";
import type { Nominee } from "@prisma/client";

export interface NomineeActionResult {
  success: boolean;
  nominee?: Nominee;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Server action: Create a new nominee under a category.
 */
export async function createNomineeAction(
  eventId: string,
  categoryId: string,
  formData: FormData
): Promise<NomineeActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  // Verify category exists and belongs to the specified event and organizer
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { event: true },
  });

  if (!category) {
    return { success: false, error: "Category not found." };
  }

  // Cross-event mismatch check
  if (category.eventId !== eventId) {
    return {
      success: false,
      error: "Integrity violation: The specified category does not belong to this event.",
    };
  }

  // Ownership check
  if (category.event.organizerId !== user.id) {
    return { success: false, error: "Unauthorized: You do not own this event." };
  }

  // Lifecycle check
  const lifecycle = canModifyStructure(category.event.status);
  if (!lifecycle.allowed) {
    return { success: false, error: lifecycle.reason };
  }

  const name = formData.get("name")?.toString() || "";
  const description = formData.get("description")?.toString() || "";
  const imageUrl = formData.get("imageUrl")?.toString() || undefined;
  const displayOrderRaw = formData.get("displayOrder")?.toString();
  const displayOrder = displayOrderRaw ? parseInt(displayOrderRaw, 10) : 0;

  const validation = validateNomineeInput({ name, description, imageUrl, displayOrder });
  if (!validation.isValid) {
    return { success: false, fieldErrors: validation.errors };
  }

  // Check unique nominee name within category
  const existingNominee = await prisma.nominee.findUnique({
    where: {
      categoryId_name: {
        categoryId,
        name: name.trim(),
      },
    },
  });

  if (existingNominee) {
    return {
      success: false,
      fieldErrors: { name: "A nominee with this name already exists in this category." },
    };
  }

  try {
    const nominee = await prisma.nominee.create({
      data: {
        eventId,
        categoryId,
        name: name.trim(),
        description: description.trim() || null,
        imageUrl: imageUrl ? imageUrl.trim() : null,
        displayOrder,
      },
    });

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/events/${category.event.slug}`);

    return { success: true, nominee };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create nominee.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Update a nominee's details.
 */
export async function updateNomineeAction(
  nomineeId: string,
  formData: FormData
): Promise<NomineeActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const nominee = await prisma.nominee.findUnique({
    where: { id: nomineeId },
    include: { event: true },
  });

  if (!nominee) {
    return { success: false, error: "Nominee not found." };
  }

  if (nominee.event.organizerId !== user.id) {
    return { success: false, error: "Unauthorized: You do not own this event." };
  }

  const lifecycle = canModifyStructure(nominee.event.status);
  if (!lifecycle.allowed) {
    return { success: false, error: lifecycle.reason };
  }

  const name = formData.get("name")?.toString() || "";
  const description = formData.get("description")?.toString() || "";
  const imageUrl = formData.get("imageUrl")?.toString() || undefined;
  const displayOrderRaw = formData.get("displayOrder")?.toString();
  const displayOrder = displayOrderRaw ? parseInt(displayOrderRaw, 10) : nominee.displayOrder;

  const validation = validateNomineeInput({ name, description, imageUrl, displayOrder });
  if (!validation.isValid) {
    return { success: false, fieldErrors: validation.errors };
  }

  // Check unique nominee name in category if name changed
  if (name.trim() !== nominee.name) {
    const existingNominee = await prisma.nominee.findUnique({
      where: {
        categoryId_name: {
          categoryId: nominee.categoryId,
          name: name.trim(),
        },
      },
    });

    if (existingNominee && existingNominee.id !== nomineeId) {
      return {
        success: false,
        fieldErrors: { name: "A nominee with this name already exists in this category." },
      };
    }
  }

  try {
    const updated = await prisma.nominee.update({
      where: { id: nomineeId },
      data: {
        name: name.trim(),
        description: description.trim() || null,
        imageUrl: imageUrl ? imageUrl.trim() : null,
        displayOrder,
      },
    });

    revalidatePath(`/dashboard/events/${nominee.eventId}`);
    revalidatePath(`/events/${nominee.event.slug}`);

    return { success: true, nominee: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update nominee.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Delete a nominee.
 */
export async function deleteNomineeAction(
  nomineeId: string
): Promise<NomineeActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const nominee = await prisma.nominee.findUnique({
    where: { id: nomineeId },
    include: { event: true },
  });

  if (!nominee) {
    return { success: false, error: "Nominee not found." };
  }

  if (nominee.event.organizerId !== user.id) {
    return { success: false, error: "Unauthorized: You do not own this event." };
  }

  const lifecycle = canDeleteStructure(nominee.event.status);
  if (!lifecycle.allowed) {
    return { success: false, error: lifecycle.reason };
  }

  try {
    await prisma.nominee.delete({
      where: { id: nomineeId },
    });

    revalidatePath(`/dashboard/events/${nominee.eventId}`);
    revalidatePath(`/events/${nominee.event.slug}`);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete nominee.";
    return { success: false, error: message };
  }
}
