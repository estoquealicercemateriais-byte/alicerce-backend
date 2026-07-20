type FloodProtectionOptions = {
  cooldownMs?: number;
  maxMessagesPerMinute?: number;
};

export function createMessageFingerprint(conversationId: string, messageId?: string, content?: string): string {
  const normalizedConversation = conversationId?.trim().toLowerCase() || "unknown";
  const normalizedMessageId = (messageId || "").trim().toLowerCase();
  const normalizedContent = (content || "").trim().toLowerCase();
  return `${normalizedConversation}:${normalizedMessageId}:${normalizedContent}`;
}

export class FloodProtection {
  private cooldownMs: number;
  private maxMessagesPerMinute: number;
  private seen = new Map<string, number>();
  private buckets = new Map<string, number[]>();

  constructor(options: FloodProtectionOptions = {}) {
    this.cooldownMs = options.cooldownMs ?? 1500;
    this.maxMessagesPerMinute = options.maxMessagesPerMinute ?? 20;
  }

  shouldProcess(fingerprint: string, now = new Date()): boolean {
    const nowMs = now.getTime();
    const lastSeen = this.seen.get(fingerprint);
    if (lastSeen && nowMs - lastSeen < this.cooldownMs) {
      return false;
    }

    const conversationKey = fingerprint.split(":")[0] ?? fingerprint;
    const bucket = this.buckets.get(conversationKey) ?? [];
    const recent = bucket.filter((timestamp) => nowMs - timestamp < 60_000);
    if (recent.length >= this.maxMessagesPerMinute) {
      return false;
    }

    recent.push(nowMs);
    this.buckets.set(conversationKey, recent);
    this.seen.set(fingerprint, nowMs);
    return true;
  }
}
