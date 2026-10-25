export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isSimulated?: boolean;
}

export interface SmsProvider {
  readonly name: string;
  sendOtp(phoneNumber: string, otp: string): Promise<SmsSendResult>;
}
