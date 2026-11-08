import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readPackageVersion } from "../../src/cli/version.js";

describe("readPackageVersion", () => {
  it("returns the version in package.json", () => {
    const manifest = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { version: string };
    expect(readPackageVersion()).toBe(manifest.version);
  });
});
