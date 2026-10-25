import { SmsProvider } from "./types";
import { DevSmsProvider } from "./dev-provider";
import { ProductionSmsProvider } from "./production-provider";

let currentProvider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (currentProvider) return currentProvider;

  const isProduction = process.env.NODE_ENV === "production";
  const explicitProvider = process.env.SMS_PROVIDER;

  if (isProduction || explicitProvider === "production") {
    currentProvider = new ProductionSmsProvider();
  } else {
    currentProvider = new DevSmsProvider();
  }

  return currentProvider;
}

/**
 * Utility to override provider in automated test suites
 */
export function setSmsProviderForTesting(provider: SmsProvider): void {
  currentProvider = provider;
}

export * from "./types";
export * from "./dev-provider";
