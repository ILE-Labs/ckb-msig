import { existsSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ensureFixture, FIXTURE_SHA256, FIXTURE_URL, sha256Hex } from "../../scripts/fetch-fixtures.mjs";
import { MAINNET_PATH } from "../helpers/fixtures.js";

async function scratchPath(): Promise<string> {
  return join(await mkdtemp(join(tmpdir(), "ckb-msig-fixture-")), "mainnet.json");
}

describe("fetch-fixtures", () => {
  it("pins the fetched file to its SHA-256", async () => {
    expect(sha256Hex(await readFile(MAINNET_PATH))).toBe(FIXTURE_SHA256);
  });

  it("fails the check for a tampered copy and deletes it", async () => {
    const tampered = Buffer.from(await readFile(MAINNET_PATH));
    tampered.writeUInt8(tampered.readUInt8(100) ^ 1, 100);
    const path = await scratchPath();
    await writeFile(path, tampered);
    const fetchBytes = vi.fn(async () => tampered);
    await expect(ensureFixture({ path, url: FIXTURE_URL, sha256: FIXTURE_SHA256, fetchBytes })).rejects.toThrow(/SHA-256 mismatch/);
    expect(fetchBytes).toHaveBeenCalledWith(FIXTURE_URL);
    expect(existsSync(path)).toBe(false);
  });

  it("skips the download when a matching copy exists", async () => {
    const path = await scratchPath();
    await writeFile(path, await readFile(MAINNET_PATH));
    const fetchBytes = vi.fn();
    expect(await ensureFixture({ path, url: FIXTURE_URL, sha256: FIXTURE_SHA256, fetchBytes })).toBe("present");
    expect(fetchBytes).not.toHaveBeenCalled();
  });

  it("keeps a download that matches", async () => {
    const original = await readFile(MAINNET_PATH);
    const path = await scratchPath();
    expect(await ensureFixture({ path, url: FIXTURE_URL, sha256: FIXTURE_SHA256, fetchBytes: async () => original })).toBe("downloaded");
    expect(sha256Hex(await readFile(path))).toBe(FIXTURE_SHA256);
  });
});
