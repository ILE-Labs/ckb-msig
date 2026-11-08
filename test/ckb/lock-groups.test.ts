import { ccc } from "@ckb-ccc/core";
import { describe, expect, it } from "vitest";
import { resolveEmbeddedInputs } from "../../src/ckb/input-resolver.js";
import { groupInputs } from "../../src/ckb/lock-groups.js";
import { transactionFromRpcJson } from "../../src/ckb/rpc-json.js";
import { readReprMultisigConfig } from "../../src/formats/ckb-cli-shared/multisig-config.js";
import { readMainnetJson } from "../helpers/fixtures.js";

const MULTISIG_ARGS = "0x66712ae36e89b0e796155d004bebe2540ee7dfc9";

function resolvedInputs(json: Record<string, any>) {
  const embedded = new Map(Object.entries(json["used_input_txs"]).map(([hash, value]) => [hash, transactionFromRpcJson(value, hash)]));
  return resolveEmbeddedInputs(transactionFromRpcJson(json["cell_tx"], "cell_tx"), embedded, "used_input_txs").inputs;
}

describe("groupInputs", () => {
  const json = readMainnetJson();
  const config = readReprMultisigConfig(json["deployment"].multisig_config, "multisig_config")?.config;
  const configs = config === undefined ? [] : [config];

  it("puts each lock in its own group, in input order", () => {
    const groups = groupInputs(resolvedInputs(json), "mainnet", configs, "cell_tx");
    expect(groups.map((group) => [group.kind, group.inputIndexes, group.firstWitnessIndex])).toEqual([
      ["multisig", [0], 0],
      ["sighash", [1], 1],
    ]);
  });

  it("puts inputs with the same lock in one group", () => {
    const copy = readMainnetJson();
    const previous = copy["used_input_txs"]["0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6"];
    previous.outputs[3].lock = previous.outputs[2].lock;
    const groups = groupInputs(resolvedInputs(copy), "mainnet", configs, "cell_tx");
    expect(groups.map((group) => [group.kind, group.inputIndexes, group.firstWitnessIndex])).toEqual([["multisig", [0, 1], 0]]);
  });

  it.each([
    ["an unknown code hash", { codeHash: `0x${"11".repeat(32)}` }, `unsupported lock: code hash 0x${"11".repeat(32)}, hash type data1`],
    ["28-byte multisig args", { args: `${MULTISIG_ARGS}0000000000000000` }, "unsupported lock: time-locked multisig (lock args carry a since)"],
  ])("refuses the transaction when input 0 has %s", (_name, change, reason) => {
    const inputs = resolvedInputs(json).map((input) =>
      input.index === 0 ? { ...input, lock: ccc.Script.from({ ...input.lock, ...change }) } : input,
    );
    expect(() => groupInputs(inputs, "mainnet", configs, "cell_tx")).toThrow(
      expect.objectContaining({ kind: "unsupported", message: `cell_tx input 0: ${reason}` }),
    );
  });

  it("refuses a multisig group when the file has no config", () => {
    expect(() => groupInputs(resolvedInputs(json), "mainnet", [], "cell_tx")).toThrow(/the file has no multisig config for lock args 0x6671/);
  });
});
