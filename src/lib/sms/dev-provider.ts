import { SmsProvider, SmsSendResult } from "./types";

// In-memory store for development/testing verification
const devOtpStore = new Map<string, string>();

export class DevSmsProvider implements SmsProvider {
  readonly name = "DevelopmentMockProvider";

  async sendOtp(phoneNumber: string, otp: string): Promise<SmsSendResult> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("DevSmsProvider is strictly forbidden in production environment.");
    }

    devOtpStore.set(phoneNumber, otp);

    if (process.env.NODE_ENV !== "test") {
      console.log(`\n[DEV SMS PROVIDER] Simulated OTP delivery to ${phoneNumber}: Code = ${otp}\n`);
    }

    return {
      success: true,
      messageId: `dev-msg-${Date.now()}`,
      isSimulated: true,
    };
  }
}

/**
 * Helper strictly for automated tests to retrieve the generated OTP for a phone number.
 */
export function getDevLastOtp(phoneNumber: string): string | undefined {
  return devOtpStore.get(phoneNumber);
}

/**
 * Clear the dev OTP store.
 */
export function clearDevOtps(): void {
  devOtpStore.clear();
}
