import type { Request } from "express";

export function isManualWhatsAppSendEnabled(): boolean {
  return process.env["WHATSAPP_MANUAL_SEND_ENABLED"] === "true";
}

export function isAdminRequest(req: Request): boolean {
  const expected = process.env["ADMIN_API_KEY"];
  if (!expected) {
    return false;
  }

  const provided = req.header("x-admin-api-key");
  return provided === expected;
}
