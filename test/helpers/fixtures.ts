import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const fixtures = new URL("../../fixtures/", import.meta.url);

export function fixturePath(relative: string): string {
  return fileURLToPath(new URL(relative, fixtures));
}

export const MAINNET_PATH = fixturePath("fiber-scripts-34/mainnet.json");

export const COMMENT_PATHS = [1, 2, 3, 4].map((n) => fixturePath(`fiber-scripts-34/comments/comment-${n}.txt`));

export function readFixtureText(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`${path} is missing; run npm run fixtures:fetch first`);
  }
  return readFileSync(path, "utf8");
}

/** A fresh, parsed copy of the fiber-scripts #34 deploy info file, safe to mutate. */
export function readMainnetJson(): Record<string, any> {
  return JSON.parse(readFixtureText(MAINNET_PATH)) as Record<string, any>;
}
