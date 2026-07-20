import test from "node:test";
import assert from "node:assert/strict";
import { FloodProtection, createMessageFingerprint } from "./floodProtection.ts";

test("deduplicates repeated messages within cooldown", () => {
  const protection = new FloodProtection({ cooldownMs: 2000, maxMessagesPerMinute: 5 });
  const fingerprint = createMessageFingerprint("123", "abc", "msg-1");

  assert.equal(protection.shouldProcess(fingerprint, new Date("2026-01-01T00:00:00.000Z")), true);
  assert.equal(protection.shouldProcess(fingerprint, new Date("2026-01-01T00:00:00.500Z")), false);
  assert.equal(protection.shouldProcess(fingerprint, new Date("2026-01-01T00:00:02.500Z")), true);
});

test("rate limits bursts for the same conversation", () => {
  const protection = new FloodProtection({ cooldownMs: 100, maxMessagesPerMinute: 2 });
  const conversationId = "conv-1";

  assert.equal(protection.shouldProcess(createMessageFingerprint(conversationId, "abc", "msg-1"), new Date("2026-01-01T00:00:00.000Z")), true);
  assert.equal(protection.shouldProcess(createMessageFingerprint(conversationId, "abc", "msg-2"), new Date("2026-01-01T00:00:00.100Z")), true);
  assert.equal(protection.shouldProcess(createMessageFingerprint(conversationId, "abc", "msg-3"), new Date("2026-01-01T00:00:00.200Z")), false);
});
