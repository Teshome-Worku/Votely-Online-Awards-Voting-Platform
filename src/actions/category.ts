"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCategoryInput, canModifyStructure, canDeleteStructure } from "@/lib/category-validation";
import type { Category } from "@prisma/client";

export interface CategoryActionResult {
  success: boolean;
  category?: Category;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Server action: Create a new category for an event.
 */
export async function createCategoryAction(
  eventId: string,
  formData: FormData
): Promise<CategoryActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return { success: false, error: "Event not found." };
  }

  if (event.organizerId !== user.id) {
    return { success: false, error: "Unauthorized: You do not own this event." };
  }

  const lifecycle = canModifyStructure(event.status);
  if (!lifecycle.allowed) {
    return { success: false, error: lifecycle.reason };
  }

  const name = formData.get("name")?.toString() || "";
  const description = formData.get("description")?.toString() || "";
  const displayOrderRaw = formData.get("displayOrder")?.toString();
  const displayOrder = displayOrderRaw ? parseInt(displayOrderRaw, 10) : 0;

  const validation = validateCategoryInput({ name, description, displayOrder });
  if (!validation.isValid) {
    return { success: false, fieldErrors: validation.errors };
  }

  // Check unique category name within event
  const existingName = await prisma.category.findUnique({
    where: {
      eventId_name: {
        eventId,
        name: name.trim(),
      },
    },
  });

  if (existingName) {
    return {
      success: false,
      fieldErrors: { name: "A category with this name already exists in this event." },
    };
  }

  try {
    const category = await prisma.category.create({
      data: {
        eventId,
        name: name.trim(),
        description: description.trim() || null,
        displayOrder,
      },
    });

    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath(`/events/${event.slug}`);

    return { success: true, category };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create category.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Update a category.
 */
export async function updateCategoryAction(
  categoryId: string,
  formData: FormData
): Promise<CategoryActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { event: true },
  });

  if (!category) {
    return { success: false, error: "Category not found." };
  }

  if (category.event.organizerId !== user.id) {
    return { success: false, error: "Unauthorized: You do not own this event." };
  }

  const lifecycle = canModifyStructure(category.event.status);
  if (!lifecycle.allowed) {
    return { success: false, error: lifecycle.reason };
  }

  const name = formData.get("name")?.toString() || "";
  const description = formData.get("description")?.toString() || "";
  const displayOrderRaw = formData.get("displayOrder")?.toString();
  const displayOrder = displayOrderRaw ? parseInt(displayOrderRaw, 10) : category.displayOrder;

  const validation = validateCategoryInput({ name, description, displayOrder });
  if (!validation.isValid) {
    return { success: false, fieldErrors: validation.errors };
  }

  // Check unique name constraint if name changed
  if (name.trim() !== category.name) {
    const existingName = await prisma.category.findUnique({
      where: {
        eventId_name: {
          eventId: category.eventId,
          name: name.trim(),
        },
      },
    });

    if (existingName && existingName.id !== categoryId) {
      return {
        success: false,
        fieldErrors: { name: "A category with this name already exists in this event." },
      };
    }
  }

  try {
    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        description: description.trim() || null,
        displayOrder,
      },
    });

    revalidatePath(`/dashboard/events/${category.eventId}`);
    revalidatePath(`/events/${category.event.slug}`);

    return { success: true, category: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update category.";
    return { success: false, error: message };
  }
}

/**
 * Server action: Delete a category (cascades to nominees cleanly).
 */
export async function deleteCategoryAction(
  categoryId: string
): Promise<CategoryActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { event: true },
  });

  if (!category) {
    return { success: false, error: "Category not found." };
  }

  if (category.event.organizerId !== user.id) {
    return { success: false, error: "Unauthorized: You do not own this event." };
  }

  const lifecycle = canDeleteStructure(category.event.status);
  if (!lifecycle.allowed) {
    return { success: false, error: lifecycle.reason };
  }

  try {
    await prisma.category.delete({
      where: { id: categoryId },
    });

    revalidatePath(`/dashboard/events/${category.eventId}`);
    revalidatePath(`/events/${category.event.slug}`);

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete category.";
    return { success: false, error: message };
  }
}
