import type { NextFunction, Request, Response } from "express";

export function isManualWhatsAppSendEnabled(): boolean {
  return process.env["WHATSAPP_MANUAL_SEND_ENABLED"] === "true";
}

export function isAdminRequest(req: Request): boolean {
  const expected = process.env["ADMIN_API_KEY"];
  if (!expected) {
    return false;
  }

  const headerKey = req.header("x-admin-api-key");
  const authorization = req.header("authorization");
  const bearerKey = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : undefined;
  const provided = headerKey ?? bearerKey;
  return provided === expected;
}

export function requireAdminRequest(req: Request, res: Response, next: NextFunction): void {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "Admin API key is required" });
    return;
  }

  next();
}
