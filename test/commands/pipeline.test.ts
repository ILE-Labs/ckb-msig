import { describe, expect, it } from "vitest";
import { addressFromScript } from "../../src/ckb/addresses.js";
import { runPipeline, type LoadedFile } from "../../src/commands/pipeline.js";
import type { InspectionReport } from "../../src/model/report.js";
import { COMMENT_PATHS, MAINNET_PATH, readFixtureText, readMainnetJson } from "../helpers/fixtures.js";

const PREVIOUS_TX = "0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6";
const comments: LoadedFile[] = COMMENT_PATHS.map((path) => ({ path, text: readFixtureText(path) }));

function asFile(json: Record<string, unknown>): LoadedFile {
  return { path: "mainnet.json", text: JSON.stringify(json) };
}

function verdicts(report: InspectionReport): string[][] {
  return (report.transactions[0]?.groups ?? []).map((group) => group.results.map((result) => result.verdict));
}

describe("runPipeline on mutated copies of fiber-scripts #34", () => {
  it("checks the unchanged file the same way as the files on disk", async () => {
    const report = await runPipeline({ path: MAINNET_PATH, text: readFixtureText(MAINNET_PATH) }, comments);
    expect(verdicts(report)).toEqual([["valid", "valid", "valid", "valid", "valid"], ["valid"]]);
  });

  it("voids every signature when an output capacity changes", async () => {
    const json = readMainnetJson();
    const output = json["cell_tx"].outputs[0];
    output.capacity = `0x${(BigInt(output.capacity) + 1n).toString(16)}`;
    const report = await runPipeline(asFile(json), comments);
    const [multisig, sighash] = verdicts(report);
    expect(multisig).toEqual(Array(5).fill("not valid for this transaction"));
    expect(sighash).toEqual(["signed a different transaction"]);
    expect(report.transactions[0]?.listedUnderOwnHash).toBe(false);
    expect(report.transactions[0]?.groups[0]?.status.canFinalize).toBe(false);
  });

  it("marks a comment given twice as a duplicate", async () => {
    const report = await runPipeline(asFile(readMainnetJson()), [comments[0] as LoadedFile, comments[0] as LoadedFile]);
    expect(verdicts(report)[0]).toEqual(["valid", "valid", "duplicate"]);
    expect(report.transactions[0]?.groups[0]?.results[2]?.memberIndex).toBe(2);
  });

  it("marks the file's own signatures as duplicates when the file is given again", async () => {
    const file = { path: "again.json", text: readFixtureText(MAINNET_PATH) };
    const report = await runPipeline(asFile(readMainnetJson()), [file]);
    expect(verdicts(report)).toEqual([["valid", "duplicate"], ["valid", "duplicate"]]);
  });

  // Editing an input lock in used_input_txs breaks that entry's hash, so the file is refused
  // before any lock is classified. Unsupported and time-locked locks are covered in test/ckb.
  it.each([
    ["an unknown code hash", (lock: Record<string, string>) => (lock["code_hash"] = `0x${"11".repeat(32)}`)],
    ["28-byte args", (lock: Record<string, string>) => (lock["args"] += "0000000000000000")],
  ])("refuses the file when an input lock in used_input_txs is edited: %s", async (_name, edit) => {
    const json = readMainnetJson();
    edit(json["used_input_txs"][PREVIOUS_TX].outputs[2].lock);
    await expect(runPipeline(asFile(json), comments)).rejects.toMatchObject({
      kind: "unsupported",
      message: expect.stringMatching(new RegExp(`^mainnet.json: input transaction ${PREVIOUS_TX} in used_input_txs doesn't match its hash`)),
    });
  });

  it("refuses an input whose previous transaction isn't in used_input_txs", async () => {
    const json = readMainnetJson();
    delete json["used_input_txs"][PREVIOUS_TX];
    await expect(runPipeline(asFile(json), [])).rejects.toMatchObject({
      kind: "unsupported",
      message: `input 0 spends ${PREVIOUS_TX} #2, but used_input_txs doesn't carry that transaction`,
    });
  });

  it("refuses a multisig config whose members don't hash to the lock args", async () => {
    const json = readMainnetJson();
    const stranger = addressFromScript(
      { codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8", hashType: "type", args: `0x${"22".repeat(20)}` },
      "ckb",
    );
    json["deployment"].multisig_config.sighash_addresses[0] = stranger;
    await expect(runPipeline(asFile(json), [])).rejects.toThrow(/multisig config doesn't match lock args 0x66712ae36e89b0e796155d004bebe2540ee7dfc9/);
  });

  it("refuses a first witness that isn't a WitnessArgs", async () => {
    const json = readMainnetJson();
    json["cell_tx"].witnesses[0] = "0x1234";
    await expect(runPipeline(asFile(json), [])).rejects.toThrow(/witness 0 isn't a WitnessArgs/);
  });

  it("reports signatures for a transaction the file doesn't hold", async () => {
    const pasted = { path: "dep.txt", text: `dep_group_tx_signatures:\n  0x66712ae36e89b0e796155d004bebe2540ee7dfc9: 0x${"ab".repeat(65)}` };
    const report = await runPipeline(asFile(readMainnetJson()), [pasted]);
    expect(report.unmatched).toHaveLength(1);
    expect(report.unmatched[0]).toMatchObject({ verdict: "not valid for this transaction", detail: "mainnet.json has no dep_group_tx" });
  });

  it("reports signatures whose lock args match no input", async () => {
    const pasted = { path: "other.txt", text: `cell_tx_signatures:\n  0x${"33".repeat(20)}: 0x${"ab".repeat(65)}` };
    const report = await runPipeline(asFile(readMainnetJson()), [pasted]);
    expect(report.unmatched[0]?.detail).toBe(`no input of cell_tx has lock args 0x${"33".repeat(20)}`);
  });

  it("reports a pasted line it can't read", async () => {
    const pasted = { path: "bad.txt", text: "cell_tx_signatures:\n  0x66712ae36e89b0e796155d004bebe2540ee7dfc9: 0x12" };
    const report = await runPipeline(asFile(readMainnetJson()), [pasted]);
    expect(report.inputs[0]?.problems).toEqual(["line 2: 0x66712ae36e89b0e796155d004bebe2540ee7dfc9: 0x12: the signature is 1 byte; expected 65"]);
  });

  it("rejects another file that holds a different transaction", async () => {
    const other = readMainnetJson();
    other["cell_tx"].outputs[0].capacity = `0x${(BigInt(other["cell_tx"].outputs[0].capacity) + 1n).toString(16)}`;
    const report = await runPipeline(asFile(readMainnetJson()), [{ path: "other.json", text: JSON.stringify(other) }]);
    expect(report.inputs[0]?.problems[0]).toMatch(/^different transaction: cell_tx is 0x[0-9a-f]{64}, which mainnet.json doesn't hold; 2 signatures not checked$/);
  });

  it("refuses an --network that contradicts the file", async () => {
    await expect(runPipeline(asFile(readMainnetJson()), [], { network: "testnet" })).rejects.toMatchObject({ kind: "usage" });
  });

  it("refuses pasted output given as the base file", async () => {
    await expect(runPipeline(comments[0] as LoadedFile, [])).rejects.toMatchObject({ kind: "usage" });
  });
});
