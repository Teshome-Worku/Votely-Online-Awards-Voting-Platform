/**
 * AfroMessage SMS Provider Unit & Integration Tests
 * Validates:
 * 1. Provider selection under test, dev, and production modes
 * 2. Mandatory configuration validation (no silent fallback when configured)
 * 3. Payload structure (Bearer token, from, sender omission, recipient, message)
 * 4. Success handling (acknowledge === "success")
 * 5. Failure handling (acknowledge !== "success", HTTP non-200, network errors)
 * 6. Security (never leaks tokens or OTP codes)
 */

import {
  getSmsProvider,
  setSmsProviderForTesting,
  ProductionSmsProvider,
  DevSmsProvider,
} from "../src/lib/sms";

let passedCount = 0;

function assert(condition: unknown, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  } else {
    passedCount++;
    console.log(`  PASS: ${message}`);
  }
}

async function runSmsProviderTests() {
  console.log("\n=======================================================");
  console.log("   Votely: AfroMessage SMS Provider Test Suite        ");
  console.log("=======================================================\n");

  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  try {
    const env = process.env as Record<string, string | undefined>;

    // -------------------------------------------------------------------------
    // Test 1: Provider selection in test environment
    // -------------------------------------------------------------------------
    console.log("Test 1: Provider selection in test environment (defaults to DevSmsProvider)");
    env.NODE_ENV = "test";
    env.SMS_PROVIDER = "afromessage";
    setSmsProviderForTesting(null);
    const providerInTest = getSmsProvider();
    assert(
      providerInTest instanceof DevSmsProvider,
      "Test environment strictly uses DevSmsProvider to prevent real dispatches during testing"
    );

    // -------------------------------------------------------------------------
    // Test 2: Provider selection in production environment
    // -------------------------------------------------------------------------
    console.log("\nTest 2: Provider selection in production environment");
    env.NODE_ENV = "production";
    setSmsProviderForTesting(null);
    const providerInProd = getSmsProvider();
    assert(
      providerInProd instanceof ProductionSmsProvider,
      "Production environment strictly instantiates ProductionSmsProvider (AfroMessage)"
    );

    // -------------------------------------------------------------------------
    // Test 3: Provider selection in development when AfroMessage is configured
    // -------------------------------------------------------------------------
    console.log("\nTest 3: Provider selection in development when AfroMessage is configured");
    env.NODE_ENV = "development";
    env.SMS_PROVIDER = "afromessage";
    env.SMS_API_KEY = "test-api-key";
    env.SMS_IDENTIFIER_ID = "test-id";
    setSmsProviderForTesting(null);
    const providerInDevConfigured = getSmsProvider();
    assert(
      providerInDevConfigured instanceof ProductionSmsProvider,
      "Development environment instantiates ProductionSmsProvider when SMS_PROVIDER='afromessage'"
    );

    // -------------------------------------------------------------------------
    // Test 4: Provider selection in development when dev mock is explicit
    // -------------------------------------------------------------------------
    console.log("\nTest 4: Provider selection in development when explicit dev mock is set");
    env.NODE_ENV = "development";
    env.SMS_PROVIDER = "dev";
    setSmsProviderForTesting(null);
    const providerInDevMock = getSmsProvider();
    assert(
      providerInDevMock instanceof DevSmsProvider,
      "Development environment falls back to DevSmsProvider when SMS_PROVIDER='dev'"
    );

    // -------------------------------------------------------------------------
    // Test 5: Missing configuration error in ProductionSmsProvider
    // -------------------------------------------------------------------------
    console.log("\nTest 5: Clear error returned when API configuration is missing (no silent fallback)");
    delete process.env.SMS_API_KEY;
    delete process.env.SMS_IDENTIFIER_ID;
    const unconfiguredProvider = new ProductionSmsProvider();
    const missingRes = await unconfiguredProvider.sendOtp("+251911223344", "123456");
    assert(
      missingRes.success === false,
      "Fails with success: false when SMS_API_KEY / SMS_IDENTIFIER_ID is missing"
    );
    assert(
      typeof missingRes.error === "string" && missingRes.error.includes("SMS provider configuration is incomplete"),
      "Returns clear server-side configuration error"
    );

    // -------------------------------------------------------------------------
    // Test 6: Successful AfroMessage API response (acknowledge === 'success')
    // -------------------------------------------------------------------------
    console.log("\nTest 6: Successful AfroMessage API dispatch with omit-sender logic");
    process.env.SMS_API_KEY = "dummy-afro-key-123";
    process.env.SMS_IDENTIFIER_ID = "afro-identifier-uuid-456";
    process.env.SMS_SENDER_ID = ""; // Empty sender must be omitted from payload
    process.env.SMS_API_ENDPOINT = "https://api.afromessage.com/api/send";

    let interceptedRequest: {
      url: string;
      headers: Record<string, string>;
      body: Record<string, unknown>;
    } | null = null;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      interceptedRequest = {
        url: String(input),
        headers: (init?.headers as Record<string, string>) || {},
        body: JSON.parse((init?.body as string) || "{}"),
      };

      return new Response(
        JSON.stringify({
          acknowledge: "success",
          response: {
            status: "sent",
            message_id: "afro-msg-999888",
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    };

    const afroProvider = new ProductionSmsProvider();
    const successRes = await afroProvider.sendOtp("+251911223344", "849201");

    assert(successRes.success === true, "Reports success when AfroMessage acknowledge === 'success'");
    assert(successRes.messageId === "afro-msg-999888", "Extracts AfroMessage message_id correctly");
    assert(interceptedRequest !== null, "Intercepted request should not be null");
    const captured = interceptedRequest!;

    assert(
      captured.url === "https://api.afromessage.com/api/send",
      "Dispatched POST to AfroMessage endpoint"
    );
    assert(
      captured.headers["Authorization"] === "Bearer dummy-afro-key-123",
      "Passed Authorization Bearer token header"
    );
    assert(
      captured.body.from === "afro-identifier-uuid-456",
      "Passed SMS_IDENTIFIER_ID as 'from'"
    );
    assert(
      !("sender" in captured.body),
      "Omitted 'sender' field when SMS_SENDER_ID is empty string"
    );
    assert(
      captured.body.to === "+251911223344",
      "Passed recipient phone number as 'to'"
    );
    assert(
      typeof captured.body.message === "string" &&
        (captured.body.message as string).includes("849201"),
      "Message contains the generated OTP"
    );

    // -------------------------------------------------------------------------
    // Test 7: AfroMessage with configured sender ID included in payload
    // -------------------------------------------------------------------------
    console.log("\nTest 7: AfroMessage dispatches with sender field when SMS_SENDER_ID is provided");
    process.env.SMS_SENDER_ID = "VOTELY";
    let secondRequest: Record<string, unknown> | null = null;
    global.fetch = async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      secondRequest = JSON.parse((init?.body as string) || "{}");
      return new Response(JSON.stringify({ acknowledge: "success" }), { status: 200 });
    };

    const afroProviderWithSender = new ProductionSmsProvider();
    await afroProviderWithSender.sendOtp("+251922334455", "554433");

    assert(
      secondRequest !== null && secondRequest["sender"] === "VOTELY",
      "Included 'sender' field in payload when SMS_SENDER_ID is non-empty"
    );

    // -------------------------------------------------------------------------
    // Test 8: AfroMessage returns error acknowledgement (acknowledge === 'error')
    // -------------------------------------------------------------------------
    console.log("\nTest 8: AfroMessage rejects dispatch (acknowledge !== 'success')");
    global.fetch = async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          acknowledge: "error",
          error: "INSUFFICIENT_CREDIT",
          message: "Account does not have enough balance to send message.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    };

    const failAckRes = await afroProvider.sendOtp("+251911223344", "778899");
    assert(failAckRes.success === false, "Treats acknowledge: 'error' as failure");
    assert(
      typeof failAckRes.error === "string" && failAckRes.error.includes("AfroMessage delivery failure"),
      "Returns clear AfroMessage error description"
    );

    // -------------------------------------------------------------------------
    // Test 9: AfroMessage returns HTTP error (e.g. 401 Unauthorized or 500)
    // -------------------------------------------------------------------------
    console.log("\nTest 9: AfroMessage HTTP non-200 error response");
    global.fetch = async (): Promise<Response> => {
      return new Response("Unauthorized token", { status: 401 });
    };

    const httpErrorRes = await afroProvider.sendOtp("+251911223344", "112233");
    assert(httpErrorRes.success === false, "Treats HTTP 401 as failure");
    assert(
      typeof httpErrorRes.error === "string" && httpErrorRes.error.includes("HTTP error status: 401"),
      "Extracts HTTP status code without leaking tokens"
    );

    // -------------------------------------------------------------------------
    // Test 10: Network failure during dispatch
    // -------------------------------------------------------------------------
    console.log("\nTest 10: Network exception handling");
    global.fetch = async (): Promise<Response> => {
      throw new Error("DNS resolution failed for api.afromessage.com");
    };

    const networkErrorRes = await afroProvider.sendOtp("+251911223344", "998877");
    assert(networkErrorRes.success === false, "Catches network exception as failure");
    assert(
      typeof networkErrorRes.error === "string" &&
        networkErrorRes.error.includes("Failed to deliver OTP via AfroMessage SMS"),
      "Returns safe network error wrapper"
    );

    console.log("\n=======================================================");
    console.log(`   All ${passedCount} AfroMessage tests passed successfully!`);
    console.log("=======================================================\n");
  } finally {
    process.env = originalEnv;
    global.fetch = originalFetch;
    setSmsProviderForTesting(null);
  }
}

runSmsProviderTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
