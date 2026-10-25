"use server";

import { prisma } from "@/lib/prisma";
import { requestOtp, verifyOtp, validateVoterSession } from "@/lib/otp";
import { revalidatePath } from "next/cache";

export interface RequestOtpResult {
  success: boolean;
  challengeId?: string;
  maskedPhone?: string;
  error?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  voterSessionToken?: string;
  maskedPhone?: string;
  error?: string;
}

export interface SubmitVoteResult {
  success: boolean;
  voteId?: string;
  nomineeName?: string;
  categoryName?: string;
  eventName?: string;
  timestamp?: string;
  isDuplicateRetry?: boolean;
  error?: string;
}

/**
 * Server action: Request an OTP challenge for phone verification.
 */
export async function requestOtpAction(
  eventId: string,
  phoneNumber: string
): Promise<RequestOtpResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return { success: false, error: "Event not found." };
  }

  if (event.status !== "LIVE") {
    return { success: false, error: "Voting is not currently active for this event." };
  }

  const now = new Date();
  if (now < event.votingStartsAt || now > event.votingEndsAt) {
    return { success: false, error: "Voting window is not open at this time." };
  }

  return requestOtp(eventId, phoneNumber);
}

/**
 * Server action: Verify submitted OTP challenge.
 */
export async function verifyOtpAction(
  challengeId: string,
  otp: string
): Promise<VerifyOtpResult> {
  const result = await verifyOtp(challengeId, otp);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    voterSessionToken: result.voterSessionToken,
    maskedPhone: result.maskedPhone,
  };
}

/**
 * Server action: Submit vote with atomic duplicate prevention.
 */
export async function submitVoteAction(payload: {
  voterSessionToken: string;
  eventId: string;
  categoryId: string;
  nomineeId: string;
}): Promise<SubmitVoteResult> {
  const { voterSessionToken, eventId, categoryId, nomineeId } = payload;

  // 1. Validate voter session token
  const sessionValidation = await validateVoterSession(voterSessionToken, eventId);
  if (!sessionValidation.isValid || !sessionValidation.phoneHash) {
    return {
      success: false,
      error: sessionValidation.error || "Invalid or expired voting verification session.",
    };
  }

  const phoneHash = sessionValidation.phoneHash;

  // 2. Validate Event state and schedule
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  if (!event) {
    return { success: false, error: "Event not found." };
  }

  if (event.status !== "LIVE") {
    return {
      success: false,
      error: `Voting cannot be accepted because this event is currently ${event.status}.`,
    };
  }

  const now = new Date();
  if (now < event.votingStartsAt) {
    return { success: false, error: "Voting has not opened yet according to the event schedule." };
  }
  if (now > event.votingEndsAt) {
    return { success: false, error: "Voting has closed for this event." };
  }

  // 3. Validate Category relationship
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category || category.eventId !== eventId) {
    return { success: false, error: "Invalid category: Category does not belong to this event." };
  }

  // 4. Validate Nominee relationship
  const nominee = await prisma.nominee.findUnique({
    where: { id: nomineeId },
  });

  if (!nominee || nominee.categoryId !== categoryId || nominee.eventId !== eventId) {
    return {
      success: false,
      error: "Invalid nominee: Nominee does not belong to the selected category.",
    };
  }

  // 5. Enforce configured voting rule
  if (event.votingRule === "ONE_VOTE_PER_EVENT") {
    const existingEventVote = await prisma.vote.findFirst({
      where: {
        eventId,
        voterPhoneHash: phoneHash,
      },
    });

    if (existingEventVote) {
      if (existingEventVote.nomineeId === nomineeId && existingEventVote.categoryId === categoryId) {
        return {
          success: true,
          voteId: existingEventVote.id,
          nomineeName: nominee.name,
          categoryName: category.name,
          eventName: event.name,
          timestamp: existingEventVote.createdAt.toISOString(),
          isDuplicateRetry: true,
        };
      }
      return {
        success: false,
        error: "Voting limit reached: You have already cast your allowed vote for this event.",
      };
    }
  } else {
    // Default rule: ONE_VOTE_PER_CATEGORY
    const existingCategoryVote = await prisma.vote.findUnique({
      where: {
        eventId_categoryId_voterPhoneHash: {
          eventId,
          categoryId,
          voterPhoneHash: phoneHash,
        },
      },
    });

    if (existingCategoryVote) {
      // Safe retry handling: if user retries same nominee, return confirmation gracefully
      if (existingCategoryVote.nomineeId === nomineeId) {
        return {
          success: true,
          voteId: existingCategoryVote.id,
          nomineeName: nominee.name,
          categoryName: category.name,
          eventName: event.name,
          timestamp: existingCategoryVote.createdAt.toISOString(),
          isDuplicateRetry: true,
        };
      }
      return {
        success: false,
        error: "Voting limit reached: You have already submitted an accepted vote in this category.",
      };
    }
  }

  // 6. Record vote atomically with database transaction
  try {
    const vote = await prisma.$transaction(async (tx) => {
      return tx.vote.create({
        data: {
          eventId,
          categoryId,
          nomineeId,
          voterPhoneHash: phoneHash,
        },
      });
    });

    try {
      revalidatePath(`/events/${event.slug}`);
    } catch {
      // Ignore static generation / test context errors
    }

    return {
      success: true,
      voteId: vote.id,
      nomineeName: nominee.name,
      categoryName: category.name,
      eventName: event.name,
      timestamp: vote.createdAt.toISOString(),
    };
  } catch (err: unknown) {
    // Handle database concurrency collision (code P2002: unique constraint violation)
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "P2002") {
      return {
        success: false,
        error: "Duplicate vote rejected: A vote from your verified phone number in this category was already recorded.",
      };
    }

    const message = err instanceof Error ? err.message : "Failed to record vote.";
    return { success: false, error: message };
  }
}
