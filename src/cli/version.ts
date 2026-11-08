import { readFileSync } from "node:fs";

/** Reads the version from the package.json that ships alongside the compiled CLI. */
export function readPackageVersion(): string {
  const manifest: unknown = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  const version = (manifest as { version?: unknown }).version;
  if (typeof version !== "string") throw new Error("package.json has no version string");
  return version;
}
