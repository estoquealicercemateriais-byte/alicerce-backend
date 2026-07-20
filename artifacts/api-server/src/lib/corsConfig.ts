import type { CorsOptions } from "cors";

function isProductionRuntime(): boolean {
  return (
    process.env["NODE_ENV"] === "production" ||
    process.env["RAILWAY_ENVIRONMENT"] !== undefined ||
    process.env["RAILWAY_PROJECT_ID"] !== undefined
  );
}

function getAllowedOrigins(): string[] {
  const raw =
    process.env["API_CORS_ORIGINS"] ??
    process.env["FRONTEND_URL"] ??
    process.env["VITE_FRONTEND_URL"] ??
    "";

  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

export function getCorsOptions(): CorsOptions {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin && !isProductionRuntime()) {
        callback(null, true);
        return;
      }

      if (!origin) {
        callback(null, false);
        return;
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");
      if (!isProductionRuntime() && allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(normalizedOrigin));
    },
  };
}
