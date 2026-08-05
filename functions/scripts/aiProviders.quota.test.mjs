import assert from "node:assert/strict";
import test from "node:test";
import {
  isQuotaOrRateLimitError,
  buildProviderFallbackChain,
  resolveLiteProviderChain,
} from "../lib/aiProviders.js";

test("isQuotaOrRateLimitError detects common quota signals", () => {
  assert.equal(isQuotaOrRateLimitError(new Error("Gemini responded 429: RESOURCE_EXHAUSTED")), true);
  assert.equal(isQuotaOrRateLimitError("rate limit exceeded"), true);
  assert.equal(isQuotaOrRateLimitError("You exceeded your current quota"), true);
  assert.equal(isQuotaOrRateLimitError(new Error("API key invalid")), false);
  assert.equal(isQuotaOrRateLimitError(new Error("ECONNREFUSED")), false);
});

test("buildProviderFallbackChain puts preferred first then Gemini", () => {
  const previousPrimary = process.env.AI_LITE_PROVIDER;
  const previousFallback = process.env.AI_LITE_FALLBACK_PROVIDER;
  process.env.AI_LITE_PROVIDER = "ollama";
  process.env.AI_LITE_FALLBACK_PROVIDER = "gemini";
  try {
    assert.deepEqual(buildProviderFallbackChain({ preferred: "openai" }), [
      "openai",
      "gemini",
      "ollama",
      "groq",
    ]);
    assert.deepEqual(buildProviderFallbackChain({ preferred: "gemini" })[0], "gemini");
    assert.deepEqual(resolveLiteProviderChain()[1], "gemini");
  } finally {
    if (previousPrimary === undefined) delete process.env.AI_LITE_PROVIDER;
    else process.env.AI_LITE_PROVIDER = previousPrimary;
    if (previousFallback === undefined) delete process.env.AI_LITE_FALLBACK_PROVIDER;
    else process.env.AI_LITE_FALLBACK_PROVIDER = previousFallback;
  }
});
