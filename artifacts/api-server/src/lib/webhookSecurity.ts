import type { Request } from "express";

function isProductionRuntime(): boolean {
  return (
    process.env["NODE_ENV"] === "production" ||
    process.env["RAILWAY_ENVIRONMENT"] !== undefined ||
    process.env["RAILWAY_PROJECT_ID"] !== undefined
  );
}

export function isWebhookRequestAllowed(req: Request): boolean {
  const expected = process.env["EVOLUTION_WEBHOOK_SECRET"];
  if (!expected) {
    return !isProductionRuntime();
  }

  const headerSecret = req.header("x-webhook-secret");
  const querySecret = typeof req.query["secret"] === "string" ? req.query["secret"] : undefined;
  return headerSecret === expected || querySecret === expected;
}
