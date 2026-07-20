import test from "node:test";
import assert from "node:assert/strict";
import {
  assertEvolutionApiUrlAllowed,
  getAllowedEvolutionOrigin,
  getEvolutionConfig,
} from "./evolutionConfig";

const ENV_KEYS = [
  "EVOLUTION_ALLOWED_ORIGIN",
  "EVOLUTION_API_URL",
  "EVOLUTION_API_KEY",
  "EVOLUTION_INSTANCE",
] as const;

function withCleanEvolutionEnv(run: () => void): void {
  const previous = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }

  try {
    run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("uses EVOLUTION_API_URL as the default allowed origin", () => {
  withCleanEvolutionEnv(() => {
    process.env["EVOLUTION_API_URL"] = "https://evolution.example.com/";

    assert.equal(getAllowedEvolutionOrigin(), "https://evolution.example.com");
    assert.doesNotThrow(() =>
      assertEvolutionApiUrlAllowed("https://evolution.example.com/message/sendText/instance"),
    );
    assert.throws(() =>
      assertEvolutionApiUrlAllowed("https://other.example.com"),
    );
  });
});

test("returns complete Evolution config only from environment variables", () => {
  withCleanEvolutionEnv(() => {
    assert.equal(getEvolutionConfig(), null);

    process.env["EVOLUTION_API_URL"] = "https://evolution.example.com/";
    process.env["EVOLUTION_API_KEY"] = "secret";
    process.env["EVOLUTION_INSTANCE"] = "alicerce";

    assert.deepEqual(getEvolutionConfig(), {
      apiUrl: "https://evolution.example.com",
      apiKey: "secret",
      instance: "alicerce",
    });
  });
});
