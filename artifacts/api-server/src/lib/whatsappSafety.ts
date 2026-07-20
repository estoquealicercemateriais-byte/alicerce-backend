export type ParsedRemoteJid = {
  phoneNumber: string;
  jidType: "direct";
};

const DIRECT_JID_SUFFIXES = new Set(["s.whatsapp.net", "c.us"]);
const BOT_OPT_IN_WORDS = new Set([
  "oi",
  "ola",
  "menu",
  "inicio",
  "comecar",
  "atendimento",
]);
const BOT_OPT_OUT_WORDS = new Set([
  "parar",
  "sair",
  "cancelar",
  "bloquear",
  "remover",
  "descadastrar",
  "stop",
]);

export function parseDirectRemoteJid(remoteJid: string): ParsedRemoteJid | null {
  const [rawNumber, suffix] = remoteJid.trim().toLowerCase().split("@");
  if (!rawNumber || !suffix || !DIRECT_JID_SUFFIXES.has(suffix)) {
    return null;
  }

  const phoneNumber = rawNumber.replace(/\D/g, "");
  if (!/^\d{10,15}$/.test(phoneNumber)) {
    return null;
  }

  return { phoneNumber, jidType: "direct" };
}

export function normalizeWhatsAppNumber(value: string): string | null {
  const phoneNumber = value.trim().toLowerCase().split("@")[0]?.replace(/\D/g, "") ?? "";
  if (!/^\d{10,15}$/.test(phoneNumber)) {
    return null;
  }

  return phoneNumber;
}

export function normalizeMessageCommand(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function isBotOptInMessage(text: string): boolean {
  return BOT_OPT_IN_WORDS.has(normalizeMessageCommand(text));
}

export function isBotOptOutMessage(text: string): boolean {
  return BOT_OPT_OUT_WORDS.has(normalizeMessageCommand(text));
}

export function isAutoReplyEnabled(): boolean {
  return process.env["WHATSAPP_BOT_AUTO_REPLY_ENABLED"] === "true";
}

export function maxAutomatedOffersPerRequest(): number {
  const raw = process.env["WHATSAPP_BOT_MAX_OFFERS_PER_REQUEST"];
  const parsed = Number(raw ?? "1");
  if (!Number.isInteger(parsed) || parsed < 0) return 1;
  return Math.min(parsed, 3);
}
