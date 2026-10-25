interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter for authentication endpoints.
 *
 * @param key Unique key, e.g. "login:ip:email"
 * @param limit Maximum allowed attempts within window
 * @param windowMs Window duration in milliseconds
 * @returns { success: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes default
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || record.resetAt <= now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    memoryStore.set(key, newRecord);
    return { success: true, remaining: limit - 1, resetAt: newRecord.resetAt };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Resets the rate limit counter for a specific key (e.g. upon successful authentication)
 */
export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}

/**
 * Clear all rate limits (for testing purposes)
 */
export function clearAllRateLimits(): void {
  memoryStore.clear();
}
