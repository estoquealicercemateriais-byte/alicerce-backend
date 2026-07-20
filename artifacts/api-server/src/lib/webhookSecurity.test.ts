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
  const previousRailway = process.env["RAILWAY_ENVIRONMENT"];
  try {
    delete process.env["EVOLUTION_WEBHOOK_SECRET"];
    delete process.env["RAILWAY_ENVIRONMENT"];
    assert.equal(isWebhookRequestAllowed(requestWithSecret(undefined)), true);

    process.env["RAILWAY_ENVIRONMENT"] = "production";
    assert.equal(isWebhookRequestAllowed(requestWithSecret(undefined)), false);
    delete process.env["RAILWAY_ENVIRONMENT"];

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
    if (previousRailway === undefined) {
      delete process.env["RAILWAY_ENVIRONMENT"];
    } else {
      process.env["RAILWAY_ENVIRONMENT"] = previousRailway;
    }
  }
});
