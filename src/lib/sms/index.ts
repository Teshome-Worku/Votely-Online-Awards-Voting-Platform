import { SmsProvider } from "./types";
import { DevSmsProvider } from "./dev-provider";
import { ProductionSmsProvider } from "./production-provider";

let currentProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (currentProvider) return currentProvider;

  const nodeEnv = process.env.NODE_ENV;
  const isProduction = nodeEnv === "production";
  const isTest = nodeEnv === "test";
  const explicitProvider = process.env.SMS_PROVIDER?.toLowerCase();

  // 1. Test environment: always use DevSmsProvider (simulated, fast, test-inspectable)
  if (isTest) {
    currentProvider = new DevSmsProvider();
    return currentProvider;
  }

  // 2. Production environment: always use real ProductionSmsProvider (AfroMessage)
  if (isProduction) {
    currentProvider = new ProductionSmsProvider();
    return currentProvider;
  }

  // 3. Development environment:
  // - Use ProductionSmsProvider if explicitly configured via SMS_PROVIDER (e.g. "afromessage", "production", "real")
  // - OR if SMS_API_KEY and SMS_IDENTIFIER_ID are present, unless SMS_PROVIDER is explicitly set to "dev" or "mock"
  const isConfiguredForRealSms =
    explicitProvider === "afromessage" ||
    explicitProvider === "production" ||
    explicitProvider === "real" ||
    (Boolean(process.env.SMS_API_KEY && process.env.SMS_IDENTIFIER_ID) &&
      explicitProvider !== "dev" &&
      explicitProvider !== "mock");

  if (isConfiguredForRealSms) {
    currentProvider = new ProductionSmsProvider();
  } else {
    currentProvider = new DevSmsProvider();
  }

  return currentProvider;
}

/**
 * Utility to override provider in automated test suites
 */
export function setSmsProviderForTesting(provider: SmsProvider | null): void {
  currentProvider = provider;
}

export * from "./types";
export * from "./dev-provider";
export * from "./production-provider";
