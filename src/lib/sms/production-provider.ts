import { SmsProvider, SmsSendResult } from "./types";

export class ProductionSmsProvider implements SmsProvider {
  readonly name = "ProductionGatewayProvider";

  private apiKey: string | undefined;
  private senderId: string | undefined;
  private apiEndpoint: string | undefined;

  constructor() {
    this.apiKey = process.env.SMS_API_KEY;
    this.senderId = process.env.SMS_SENDER_ID;
    this.apiEndpoint = process.env.SMS_API_ENDPOINT;
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<SmsSendResult> {
    if (!this.apiKey || !this.senderId) {
      // Never pretend that an SMS was sent when provider is unconfigured
      return {
        success: false,
        error: "SMS provider configuration is incomplete (missing SMS_API_KEY or SMS_SENDER_ID). Production delivery unavailable.",
      };
    }

    try {
      // Standard HTTP dispatch to SMS Gateway
      const endpoint = this.apiEndpoint || "https://api.gateway.example.com/v1/sms/send";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          to: phoneNumber,
          from: this.senderId,
          text: `Your Votely awards verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        }),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `SMS provider returned HTTP error: ${response.status}`,
        };
      }

      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        messageId: data.messageId || `msg-${Date.now()}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network failure connecting to SMS gateway";
      return {
        success: false,
        error: `Failed to deliver OTP via SMS: ${msg}`,
      };
    }
  }
}
