import type { Request } from "express";

export function isWebhookRequestAllowed(req: Request): boolean {
  const expected = process.env["EVOLUTION_WEBHOOK_SECRET"];
  if (!expected) {
    return true;
  }

  const headerSecret = req.header("x-webhook-secret");
  const querySecret = typeof req.query["secret"] === "string" ? req.query["secret"] : undefined;
  return headerSecret === expected || querySecret === expected;
}
