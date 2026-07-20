import { normalizeWhatsAppNumber } from "./whatsappSafety";

export function isWhatsAppTestModeEnabled(): boolean {
  return process.env["WHATSAPP_TEST_MODE_ENABLED"] === "true";
}

export function getAllowedWhatsAppTestNumbers(): string[] {
  return (process.env["WHATSAPP_TEST_ALLOWED_NUMBERS"] ?? "")
    .split(",")
    .map((value) => normalizeWhatsAppNumber(value))
    .filter((value): value is string => Boolean(value));
}

export function isAllowedWhatsAppTestNumber(phoneNumber: string): boolean {
  const normalized = normalizeWhatsAppNumber(phoneNumber);
  if (!normalized) {
    return false;
  }

  return getAllowedWhatsAppTestNumbers().includes(normalized);
}
