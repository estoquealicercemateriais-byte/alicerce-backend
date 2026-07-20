import test from "node:test";
import assert from "node:assert/strict";
import type { Request } from "express";
import { isAdminRequest, isManualWhatsAppSendEnabled } from "./adminSecurity";

function requestWithHeader(value: string | undefined, authorization?: string): Request {
  return {
    header(name: string) {
      if (name === "x-admin-api-key") return value;
      if (name === "authorization") return authorization;
      return undefined;
    },
  } as Request;
}

test("manual WhatsApp sends are opt-in by environment flag", () => {
  const previous = process.env["WHATSAPP_MANUAL_SEND_ENABLED"];
  try {
    delete process.env["WHATSAPP_MANUAL_SEND_ENABLED"];
    assert.equal(isManualWhatsAppSendEnabled(), false);

    process.env["WHATSAPP_MANUAL_SEND_ENABLED"] = "true";
    assert.equal(isManualWhatsAppSendEnabled(), true);
  } finally {
    if (previous === undefined) {
      delete process.env["WHATSAPP_MANUAL_SEND_ENABLED"];
    } else {
      process.env["WHATSAPP_MANUAL_SEND_ENABLED"] = previous;
    }
  }
});

test("admin requests require configured API key", () => {
  const previous = process.env["ADMIN_API_KEY"];
  try {
    delete process.env["ADMIN_API_KEY"];
    assert.equal(isAdminRequest(requestWithHeader("secret")), false);

    process.env["ADMIN_API_KEY"] = "secret";
    assert.equal(isAdminRequest(requestWithHeader("wrong")), false);
    assert.equal(isAdminRequest(requestWithHeader("secret")), true);
    assert.equal(isAdminRequest(requestWithHeader(undefined, "Bearer secret")), true);
  } finally {
    if (previous === undefined) {
      delete process.env["ADMIN_API_KEY"];
    } else {
      process.env["ADMIN_API_KEY"] = previous;
    }
  }
});
