export interface EventInput {
  name: string;
  description: string;
  startDate: string | Date;
  endDate: string | Date;
  votingStartsAt: string | Date;
  votingEndsAt: string | Date;
  bannerUrl?: string;
  logoUrl?: string;
}

export interface EventValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  parsedDates?: {
    startDate: Date;
    endDate: Date;
    votingStartsAt: Date;
    votingEndsAt: Date;
  };
}

export function validateEventInput(input: Partial<EventInput>): EventValidationResult {
  const errors: Record<string, string> = {};

  // Name validation
  const name = (input.name || "").trim();
  if (name.length < 3) {
    errors.name = "Event name must be at least 3 characters.";
  } else if (name.length > 150) {
    errors.name = "Event name cannot exceed 150 characters.";
  }

  // Description validation
  const description = (input.description || "").trim();
  if (description.length < 10) {
    errors.description = "Event description must be at least 10 characters.";
  }

  // Date parsing & validity
  const start = input.startDate ? new Date(input.startDate) : null;
  const end = input.endDate ? new Date(input.endDate) : null;
  const vStart = input.votingStartsAt ? new Date(input.votingStartsAt) : null;
  const vEnd = input.votingEndsAt ? new Date(input.votingEndsAt) : null;

  if (!start || isNaN(start.getTime())) {
    errors.startDate = "Please provide a valid event start date.";
  }
  if (!end || isNaN(end.getTime())) {
    errors.endDate = "Please provide a valid event end date.";
  }
  if (!vStart || isNaN(vStart.getTime())) {
    errors.votingStartsAt = "Please provide a valid voting start date.";
  }
  if (!vEnd || isNaN(vEnd.getTime())) {
    errors.votingEndsAt = "Please provide a valid voting end date.";
  }

  // Chronology validation if all dates parsed
  if (start && end && vStart && vEnd && !isNaN(start.getTime()) && !isNaN(end.getTime()) && !isNaN(vStart.getTime()) && !isNaN(vEnd.getTime())) {
    if (end.getTime() <= start.getTime()) {
      errors.endDate = "Event end date must be after the event start date.";
    }

    if (vStart.getTime() < start.getTime()) {
      errors.votingStartsAt = "Voting cannot open before the event start date.";
    }

    if (vEnd.getTime() <= vStart.getTime()) {
      errors.votingEndsAt = "Voting close date must be after the voting open date.";
    }

    if (vEnd.getTime() > end.getTime()) {
      errors.votingEndsAt = "Voting cannot end after the event end date.";
    }
  }

  // Optional image URLs validation (supports full URLs, local /uploads paths, and data URIs)
  if (input.bannerUrl && input.bannerUrl.trim().length > 0) {
    const banner = input.bannerUrl.trim();
    if (!banner.startsWith("/") && !banner.startsWith("data:image/")) {
      try {
        new URL(banner);
      } catch {
        errors.bannerUrl = "Banner URL must be a valid URL or uploaded image path.";
      }
    }
  }

  if (input.logoUrl && input.logoUrl.trim().length > 0) {
    const logo = input.logoUrl.trim();
    if (!logo.startsWith("/") && !logo.startsWith("data:image/")) {
      try {
        new URL(logo);
      } catch {
        errors.logoUrl = "Logo URL must be a valid URL or uploaded image path.";
      }
    }
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors,
    parsedDates: isValid && start && end && vStart && vEnd ? {
      startDate: start,
      endDate: end,
      votingStartsAt: vStart,
      votingEndsAt: vEnd,
    } : undefined,
  };
}
