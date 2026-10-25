import crypto from "crypto";
import { parsePhoneNumber, isValidPhoneNumber, type CountryCode } from "libphonenumber-js";

const DEFAULT_SECRET = "votely-privacy-salt-secret-key-32-chars-long";

/**
 * Normalizes a raw phone number into standard E.164 format.
 * Defaults to Ethiopia ('ET') for national numbers like '0911223344'.
 */
export function normalizePhoneNumber(rawPhone: string, defaultCountry = "ET"): {
  isValid: boolean;
  e164?: string;
  error?: string;
} {
  const cleaned = (rawPhone || "").trim();
  if (!cleaned) {
    return { isValid: false, error: "Phone number is required." };
  }

  const country = defaultCountry as CountryCode;

  try {
    if (!isValidPhoneNumber(cleaned, country)) {
      return {
        isValid: false,
        error: "Please enter a valid mobile phone number (e.g., +251 9... or 09...).",
      };
    }

    const parsed = parsePhoneNumber(cleaned, country);
    if (!parsed) {
      return { isValid: false, error: "Could not parse phone number." };
    }

    return {
      isValid: true,
      e164: parsed.format("E.164"),
    };
  } catch {
    return {
      isValid: false,
      error: "Invalid phone number format. Please check your country code and digits.",
    };
  }
}

/**
 * Computes an irreversible, salted HMAC-SHA256 hash of a normalized phone number.
 * Used for database uniqueness and single-vote enforcement without storing plaintext phone numbers in voting records.
 */
export function hashPhoneNumber(e164Phone: string): string {
  const secret = process.env.SESSION_SECRET || DEFAULT_SECRET;
  return crypto.createHmac("sha256", secret).update(e164Phone).digest("hex");
}

/**
 * Formats a phone number for privacy display (e.g., "+251 ••• ••3344").
 */
export function maskPhoneNumber(e164Phone: string): string {
  if (!e164Phone || e164Phone.length < 8) return "••••••••";
  const start = e164Phone.slice(0, 4);
  const end = e164Phone.slice(-4);
  return `${start} ••• ••${end}`;
}
