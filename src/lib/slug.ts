import { prisma } from "@/lib/prisma";

/**
 * Converts a raw string into a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word characters (preserving spaces and hyphens)
    .replace(/[\s_-]+/g, "-")  // Replace spaces, underscores, and multiple hyphens with a single hyphen
    .replace(/^-+|-+$/g, "");  // Remove leading and trailing hyphens
}

/**
 * Generates a guaranteed unique slug for an event.
 * If the base slug already exists (and does not belong to currentEventId),
 * appends numerical increments (-2, -3, etc.) until a free slug is found.
 */
export async function generateUniqueSlug(
  name: string,
  currentEventId?: string
): Promise<string> {
  let baseSlug = slugify(name);
  if (!baseSlug) {
    baseSlug = "event";
  }

  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.event.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === currentEventId) {
      return candidate;
    }

    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
}
