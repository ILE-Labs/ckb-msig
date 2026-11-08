import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { COMMENT_PATHS, MAINNET_PATH, readFixtureText, readMainnetJson } from "../helpers/fixtures.js";

const MAIN = fileURLToPath(new URL("../../lib/cli/main.js", import.meta.url));

function run(args: string[], input?: string) {
  const result = spawnSync(process.execPath, [MAIN, ...args], { encoding: "utf8", ...(input === undefined ? {} : { input }) });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe("the built ckb-msig command", () => {
  beforeAll(() => {
    if (!existsSync(MAIN)) throw new Error("lib/cli/main.js is missing; run npm run build first");
  });

  it("inspects fiber-scripts #34 with its four comments", () => {
    const { code, stdout } = run(["inspect", MAINNET_PATH, ...COMMENT_PATHS]);
    expect(code).toBe(0);
    const lines = stdout.split("\n");
    for (const expected of [
      "format    ckb-cli deploy info file",
      "holds     cell_tx; no dep_group_tx",
      "network   mainnet (from the multisig config addresses)",
      "tx hash   0x4396de69818bd88b7fce64797ccec25d1294912d56846432f29fd192120992ee",
      "          matches its own key in used_input_txs",
      "lock      multisig 3-of-5, first 0 must sign (v2 deployment)",
      "          code hash 0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29, hash type data1",
      "args      0x66712ae36e89b0e796155d004bebe2540ee7dfc9",
      "args      0x5cf028300e33eef47429c9cfcb1d53e7a537e4e1",
      "status    threshold met: 5 valid, 3 needed (finalize picks 3)",
      "signature valid: the owner",
      "status    signed: 1 valid signature",
      "summary   ready: all 2 lock groups have enough valid signatures",
    ]) {
      expect(lines).toContain(expected);
    }
    expect(lines.filter((line) => line.startsWith("signature valid: member"))).toHaveLength(5);
    expect(lines.filter((line) => /^( {10}|members {3})[1-5] {2}0x[0-9a-f]{40} {2}ckb1/.test(line))).toHaveLength(5);
    expect(stdout).toContain("names the genesis deployment, but the input lock is the v2 deployment");
  });

  it("reads pasted output from standard input", () => {
    const { code, stdout } = run(["inspect", MAINNET_PATH, "-"], readFixtureText(COMMENT_PATHS[0] as string));
    expect(code).toBe(0);
    expect(stdout).toContain("from stdin, cell_tx_signatures, line 3");
  });

  it("exits 2 with usage for bad arguments", () => {
    for (const args of [[], ["sign"], ["inspect"], ["inspect", MAINNET_PATH, "--fee", "1"], ["inspect", MAINNET_PATH, "--network", "devnet"]]) {
      const { code, stderr } = run(args);
      expect(code).toBe(2);
      expect(stderr).toContain("usage: ckb-msig inspect");
    }
  });

  it("exits 2 for a file it can't read or recognize", () => {
    expect(run(["inspect", `${MAINNET_PATH}.missing`]).code).toBe(2);
    const dir = mkdtempSync(join(tmpdir(), "ckb-msig-"));
    const unknown = join(dir, "unknown.json");
    writeFileSync(unknown, '{"hello":"world"}');
    const { code, stderr } = run(["inspect", unknown]);
    expect(code).toBe(2);
    expect(stderr).toContain("unrecognized file format");
  });

  it("exits 1 for an input transaction that doesn't match its hash", () => {
    const previous = "0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6";
    const json = readMainnetJson();
    json["used_input_txs"][previous].outputs[2].lock.code_hash = `0x${"11".repeat(32)}`;
    const path = join(mkdtempSync(join(tmpdir(), "ckb-msig-")), "tampered.json");
    writeFileSync(path, JSON.stringify(json));
    const { code, stdout, stderr } = run(["inspect", path]);
    expect(code).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toContain(`input transaction ${previous} in used_input_txs doesn't match its hash`);
  });
});
