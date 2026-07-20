import test from "node:test";
import assert from "node:assert/strict";
import type { Request } from "express";
import { isWebhookRequestAllowed } from "./webhookSecurity";

function requestWithSecret(headerValue: string | undefined, queryValue?: string): Request {
  return {
    query: queryValue ? { secret: queryValue } : {},
    header(name: string) {
      return name === "x-webhook-secret" ? headerValue : undefined;
    },
  } as Request;
}

test("webhook is open only when no secret is configured", () => {
  const previous = process.env["EVOLUTION_WEBHOOK_SECRET"];
  try {
    delete process.env["EVOLUTION_WEBHOOK_SECRET"];
    assert.equal(isWebhookRequestAllowed(requestWithSecret(undefined)), true);

    process.env["EVOLUTION_WEBHOOK_SECRET"] = "secret";
    assert.equal(isWebhookRequestAllowed(requestWithSecret(undefined)), false);
    assert.equal(isWebhookRequestAllowed(requestWithSecret("wrong")), false);
    assert.equal(isWebhookRequestAllowed(requestWithSecret("secret")), true);
    assert.equal(isWebhookRequestAllowed(requestWithSecret(undefined, "secret")), true);
  } finally {
    if (previous === undefined) {
      delete process.env["EVOLUTION_WEBHOOK_SECRET"];
    } else {
      process.env["EVOLUTION_WEBHOOK_SECRET"] = previous;
    }
  }
});
