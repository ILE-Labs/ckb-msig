import { describe, expect, it } from "vitest";
import { resolveEmbeddedInputs } from "../../src/ckb/input-resolver.js";
import { transactionFromRpcJson } from "../../src/ckb/rpc-json.js";
import { readMainnetJson } from "../helpers/fixtures.js";

const PREVIOUS_TX = "0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6";

describe("resolveEmbeddedInputs", () => {
  const json = readMainnetJson();
  const tx = transactionFromRpcJson(json["cell_tx"], "cell_tx");
  const previous = transactionFromRpcJson(json["used_input_txs"][PREVIOUS_TX], PREVIOUS_TX);

  it("fills every input's cell output and data from the embedded transaction", () => {
    const resolved = resolveEmbeddedInputs(tx, new Map([[PREVIOUS_TX, previous]]), "used_input_txs");
    expect(resolved.inputs.map((input) => [input.index, input.previousTxHash, input.previousIndex, input.source])).toEqual([
      [0, PREVIOUS_TX, 2, "embedded"],
      [1, PREVIOUS_TX, 3, "embedded"],
    ]);
    resolved.tx.inputs.forEach((input, index) => {
      const at = Number(input.previousOutput.index);
      expect(input.cellOutput?.eq(previous.outputs[at] as NonNullable<typeof input.cellOutput>)).toBe(true);
      expect(input.outputData).toBe(previous.outputsData[at]);
      expect(resolved.inputs[index]?.lock.args).toBe(previous.outputs[at]?.lock.args);
    });
    expect(resolved.tx.hash()).toBe(tx.hash());
    expect(tx.inputs[0]?.cellOutput).toBeUndefined();
  });

  it("refuses an input whose previous transaction isn't embedded", () => {
    expect(() => resolveEmbeddedInputs(tx, new Map(), "used_input_txs")).toThrow(
      `input 0 spends ${PREVIOUS_TX} #2, but used_input_txs doesn't carry that transaction`,
    );
  });
});
