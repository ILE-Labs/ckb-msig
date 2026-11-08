// Downloads the fiber-scripts PR #34 deploy info file from its pinned commit and checks its SHA-256.
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const FIXTURE_URL =
  "https://raw.githubusercontent.com/nervosnetwork/fiber-scripts/026027f54f6a90cb48d8cc184b230e2018bb8611/deployment/mainnet/mainnet.json";
export const FIXTURE_SHA256 = "8563ba8dcd0d051822dd0cc21db995dc8e6a2984e900d3500068f0185a07b51e";
export const FIXTURE_PATH = fileURLToPath(new URL("../fixtures/fiber-scripts-34/mainnet.json", import.meta.url));

const USER_AGENT = "Mozilla/5.0 (compatible; fetch-script/1.0)";

export function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function readIfPresent(path) {
  try {
    return await readFile(path);
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function download(url) {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`GET ${url} returned HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

/**
 * Makes sure `path` holds the file with the given SHA-256.
 * Returns "present" when a matching copy already exists and "downloaded" after a matching download.
 * A copy that doesn't match is deleted, and the function throws.
 */
export async function ensureFixture({ path, url, sha256, fetchBytes = download }) {
  const existing = await readIfPresent(path);
  if (existing !== undefined && sha256Hex(existing) === sha256) return "present";

  await rm(path, { force: true });
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, await fetchBytes(url));

  const actual = sha256Hex(await readFile(path));
  if (actual !== sha256) {
    await rm(path, { force: true });
    throw new Error(`SHA-256 mismatch for ${url}: expected ${sha256}, got ${actual}. The file was deleted.`);
  }
  return "downloaded";
}

async function main() {
  const shown = relative(process.cwd(), FIXTURE_PATH);
  try {
    const result = await ensureFixture({ path: FIXTURE_PATH, url: FIXTURE_URL, sha256: FIXTURE_SHA256 });
    const action = result === "present" ? "already present, download skipped" : "downloaded";
    console.log(`${shown}: ${action}; SHA-256 matches ${FIXTURE_SHA256}`);
  } catch (error) {
    console.error(`${shown}: ${error.message}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
