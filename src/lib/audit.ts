import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface CreateAuditLogParams {
  eventId?: string;
  userId: string;
  action: string;
  details?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Persists an immutable audit log entry.
 */
export async function recordAuditLog(params: CreateAuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        eventId: params.eventId,
        userId: params.userId,
        action: params.action,
        details: params.details,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to persist audit log:", error);
    // Don't crash primary user flow if audit logging encounters a transient DB issue
    return null;
  }
}
