import test from "node:test";
import assert from "node:assert/strict";
import {
  getAllowedWhatsAppTestNumbers,
  isAllowedWhatsAppTestNumber,
  isWhatsAppTestModeEnabled,
} from "./whatsappTestSafety";

test("WhatsApp test mode is opt-in by environment flag", () => {
  const previous = process.env["WHATSAPP_TEST_MODE_ENABLED"];
  try {
    delete process.env["WHATSAPP_TEST_MODE_ENABLED"];
    assert.equal(isWhatsAppTestModeEnabled(), false);

    process.env["WHATSAPP_TEST_MODE_ENABLED"] = "true";
    assert.equal(isWhatsAppTestModeEnabled(), true);
  } finally {
    if (previous === undefined) {
      delete process.env["WHATSAPP_TEST_MODE_ENABLED"];
    } else {
      process.env["WHATSAPP_TEST_MODE_ENABLED"] = previous;
    }
  }
});

test("test recipients must be explicitly allowlisted", () => {
  const previous = process.env["WHATSAPP_TEST_ALLOWED_NUMBERS"];
  try {
    process.env["WHATSAPP_TEST_ALLOWED_NUMBERS"] =
      "+55 (11) 99999-9999,5511888888888@s.whatsapp.net";

    assert.deepEqual(getAllowedWhatsAppTestNumbers(), [
      "5511999999999",
      "5511888888888",
    ]);
    assert.equal(isAllowedWhatsAppTestNumber("5511999999999"), true);
    assert.equal(isAllowedWhatsAppTestNumber("+55 (11) 88888-8888"), true);
    assert.equal(isAllowedWhatsAppTestNumber("5511777777777"), false);
  } finally {
    if (previous === undefined) {
      delete process.env["WHATSAPP_TEST_ALLOWED_NUMBERS"];
    } else {
      process.env["WHATSAPP_TEST_ALLOWED_NUMBERS"] = previous;
    }
  }
});
