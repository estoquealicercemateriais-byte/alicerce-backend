import { rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
for (const file of ["package-lock.json", "yarn.lock"]) {
  const target = path.join(root, file);
  if (existsSync(target)) {
    rmSync(target, { force: true });
  }
}

const npmUserAgent = process.env.npm_config_user_agent || "";
if (!npmUserAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exit(1);
}
