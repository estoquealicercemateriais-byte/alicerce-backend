import test from "node:test";
import assert from "node:assert/strict";
import {
  isBotOptInMessage,
  isBotOptOutMessage,
  maxAutomatedOffersPerRequest,
  normalizeWhatsAppNumber,
  parseDirectRemoteJid,
} from "./whatsappSafety";

test("accepts only direct WhatsApp user JIDs", () => {
  assert.deepEqual(parseDirectRemoteJid("5511999999999@s.whatsapp.net"), {
    phoneNumber: "5511999999999",
    jidType: "direct",
  });
  assert.deepEqual(parseDirectRemoteJid("5511999999999@c.us"), {
    phoneNumber: "5511999999999",
    jidType: "direct",
  });
  assert.equal(parseDirectRemoteJid("120363000000000000@g.us"), null);
  assert.equal(parseDirectRemoteJid("status@broadcast"), null);
  assert.equal(parseDirectRemoteJid("newsletter@newsletter"), null);
});

test("normalizes phone numbers before outbound sends", () => {
  assert.equal(normalizeWhatsAppNumber("+55 (11) 99999-9999"), "5511999999999");
  assert.equal(normalizeWhatsAppNumber("5511999999999@s.whatsapp.net"), "5511999999999");
  assert.equal(normalizeWhatsAppNumber("123"), null);
});

test("detects explicit opt-in and opt-out commands", () => {
  assert.equal(isBotOptInMessage("menu"), true);
  assert.equal(isBotOptInMessage(" Olá "), true);
  assert.equal(isBotOptInMessage("quero comprar cimento"), false);

  assert.equal(isBotOptOutMessage("parar"), true);
  assert.equal(isBotOptOutMessage(" STOP "), true);
  assert.equal(isBotOptOutMessage("menu"), false);
});

test("caps automated offers per request", () => {
  const previous = process.env["WHATSAPP_BOT_MAX_OFFERS_PER_REQUEST"];
  try {
    process.env["WHATSAPP_BOT_MAX_OFFERS_PER_REQUEST"] = "10";
    assert.equal(maxAutomatedOffersPerRequest(), 3);

    process.env["WHATSAPP_BOT_MAX_OFFERS_PER_REQUEST"] = "0";
    assert.equal(maxAutomatedOffersPerRequest(), 0);

    process.env["WHATSAPP_BOT_MAX_OFFERS_PER_REQUEST"] = "invalid";
    assert.equal(maxAutomatedOffersPerRequest(), 1);
  } finally {
    if (previous === undefined) {
      delete process.env["WHATSAPP_BOT_MAX_OFFERS_PER_REQUEST"];
    } else {
      process.env["WHATSAPP_BOT_MAX_OFFERS_PER_REQUEST"] = previous;
    }
  }
});
