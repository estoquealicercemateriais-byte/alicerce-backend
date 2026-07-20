export type EvolutionConfig = {
  apiUrl: string;
  apiKey: string;
  instance: string;
};

function normalizeOrigin(value: string): string {
  return new URL(value).origin;
}

function normalizeBaseUrl(value: string): string {
  const url = new URL(value);
  return url.toString().replace(/\/$/, "");
}

export function getAllowedEvolutionOrigin(): string | null {
  const rawAllowedOrigin = process.env["EVOLUTION_ALLOWED_ORIGIN"]?.trim();
  const rawApiUrl = process.env["EVOLUTION_API_URL"]?.trim();
  const source = rawAllowedOrigin || rawApiUrl;
  return source ? normalizeOrigin(source) : null;
}

export function assertEvolutionApiUrlAllowed(apiUrl: string): void {
  const allowedOrigin = getAllowedEvolutionOrigin();
  if (!allowedOrigin) {
    throw new Error("EVOLUTION_ALLOWED_ORIGIN or EVOLUTION_API_URL must be configured");
  }

  const apiOrigin = normalizeOrigin(apiUrl);
  if (apiOrigin !== allowedOrigin) {
    throw new Error(`Evolution API origin is not allowed: ${apiOrigin}`);
  }
}

export function getEvolutionConfig(): EvolutionConfig | null {
  const apiUrl = process.env["EVOLUTION_API_URL"]?.trim();
  const apiKey = process.env["EVOLUTION_API_KEY"]?.trim();
  const instance = process.env["EVOLUTION_INSTANCE"]?.trim();

  if (!apiUrl || !apiKey || !instance) {
    return null;
  }

  const normalizedApiUrl = normalizeBaseUrl(apiUrl);
  assertEvolutionApiUrlAllowed(normalizedApiUrl);

  return {
    apiUrl: normalizedApiUrl,
    apiKey,
    instance,
  };
}
