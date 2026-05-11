import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const file of [".env.local", ".env"]) {
  const path = resolve(file);

  if (!existsSync(path)) {
    continue;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const missing = [];

if (!process.env.NEBIUS_API_KEY) {
  missing.push("NEBIUS_API_KEY");
}

if (process.env.NEBIUS_BASE_URL) {
  try {
    const baseUrl = new URL(process.env.NEBIUS_BASE_URL);

    if (!["http:", "https:"].includes(baseUrl.protocol)) {
      throw new Error("NEBIUS_BASE_URL must use http or https");
    }
  } catch {
    console.error("Environment check failed. Invalid optional keys:");
    console.error("- NEBIUS_BASE_URL must be an http(s) URL");
    process.exit(1);
  }
}

if (missing.length > 0) {
  console.error("Environment check failed. Missing required keys:");

  for (const key of missing) {
    console.error(`- ${key}`);
  }

  process.exit(1);
}

console.log("Environment check passed:");
console.log("- NEBIUS_API_KEY");

if (process.env.NEBIUS_BASE_URL) {
  console.log("- NEBIUS_BASE_URL");
}
