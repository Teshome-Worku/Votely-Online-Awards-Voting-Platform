import { EventStatus } from "@prisma/client";

export interface CategoryInput {
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface NomineeInput {
  name: string;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
}

export function validateCategoryInput(input: Partial<CategoryInput>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const name = (input.name || "").trim();
  if (name.length < 2) {
    errors.name = "Category name must be at least 2 characters.";
  } else if (name.length > 100) {
    errors.name = "Category name cannot exceed 100 characters.";
  }

  if (input.displayOrder !== undefined && (isNaN(input.displayOrder) || input.displayOrder < 0)) {
    errors.displayOrder = "Display order must be a non-negative number.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateNomineeInput(input: Partial<NomineeInput>): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const name = (input.name || "").trim();
  if (name.length < 2) {
    errors.name = "Nominee name must be at least 2 characters.";
  } else if (name.length > 100) {
    errors.name = "Nominee name cannot exceed 100 characters.";
  }

  if (input.imageUrl && input.imageUrl.trim().length > 0) {
    const img = input.imageUrl.trim();
    if (!img.startsWith("/") && !img.startsWith("data:image/")) {
      try {
        new URL(img);
      } catch {
        errors.imageUrl = "Image URL must be a valid URL or uploaded image path.";
      }
    }
  }

  if (input.displayOrder !== undefined && (isNaN(input.displayOrder) || input.displayOrder < 0)) {
    errors.displayOrder = "Display order must be a non-negative number.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Checks if category or nominee modifications are permitted based on event lifecycle.
 */
export function canModifyStructure(status: EventStatus): {
  allowed: boolean;
  reason?: string;
} {
  if (status === "FINALIZED" || status === "ARCHIVED") {
    return {
      allowed: false,
      reason: `Cannot modify categories or nominees because this event is ${status}. Structural changes are locked to protect final certified standings.`,
    };
  }
  return { allowed: true };
}

/**
 * Checks if deletion of categories or nominees is permitted.
 * Deletion during LIVE events is blocked to prevent ballot disruption.
 */
export function canDeleteStructure(status: EventStatus): {
  allowed: boolean;
  reason?: string;
} {
  if (status === "FINALIZED" || status === "ARCHIVED") {
    return {
      allowed: false,
      reason: `Cannot delete categories or nominees because this event is ${status}.`,
    };
  }

  if (status === "LIVE") {
    return {
      allowed: false,
      reason: "Cannot delete categories or nominees while voting is LIVE. Close the voting window or revert status before making destructive changes.",
    };
  }

  return { allowed: true };
}
