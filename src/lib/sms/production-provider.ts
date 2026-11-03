import { SmsProvider, SmsSendResult } from "./types";

/**
 * AfroMessage SMS API Response Interface
 */
interface AfroMessageResponse {
  acknowledge?: string;
  response?: {
    status?: string;
    message_id?: string;
    [key: string]: unknown;
  };
  error?: string | number;
  message?: string;
  [key: string]: unknown;
}

export class ProductionSmsProvider implements SmsProvider {
  readonly name = "AfroMessageProvider";

  private apiKey: string | undefined;
  private identifierId: string | undefined;
  private senderId: string | undefined;
  private apiEndpoint: string;

  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.identifierId = process.env.SMS_IDENTIFIER_ID;
    this.senderId = process.env.SMS_SENDER_ID;
    this.apiEndpoint =
      process.env.SMS_API_ENDPOINT?.trim() || "https://api.afromessage.com/api/send";
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<SmsSendResult> {
    const apiKey = this.apiKey?.trim();
    const identifierId = this.identifierId?.trim();
    const senderId = this.senderId?.trim();

    // Verify mandatory AfroMessage configuration
    if (!apiKey || !identifierId) {
      return {
        success: false,
        error:
          "SMS provider configuration is incomplete (missing SMS_API_KEY or SMS_IDENTIFIER_ID). Real SMS delivery unavailable.",
      };
    }

    try {
      const payload: {
        from: string;
        sender?: string;
        to: string;
        message: string;
      } = {
        from: identifierId,
        to: phoneNumber,
        message: `Your Votely awards verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
      };

      // Omit sender if empty or not provided
      if (senderId) {
        payload.sender = senderId;
      }

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Do not log sensitive credentials or details
        return {
          success: false,
          error: `AfroMessage API responded with HTTP error status: ${response.status}`,
        };
      }

      const data: AfroMessageResponse = await response.json().catch(() => ({}));

      // Requirement: Treat request as successful ONLY when acknowledge === "success"
      if (data.acknowledge === "success") {
        const messageId =
          data.response?.message_id ||
          (typeof data.response === "string" ? data.response : `afro-${Date.now()}`);

        return {
          success: true,
          messageId: String(messageId),
        };
      }

      // Handle non-success acknowledgement from AfroMessage
      const errorMsg =
        data.message ||
        (data.error ? String(data.error) : "AfroMessage API rejected the dispatch request");

      return {
        success: false,
        error: `AfroMessage delivery failure: ${errorMsg}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network failure connecting to AfroMessage gateway";
      return {
        success: false,
        error: `Failed to deliver OTP via AfroMessage SMS: ${msg}`,
      };
    }
  }
}
