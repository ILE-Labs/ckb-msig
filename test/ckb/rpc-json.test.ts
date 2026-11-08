import { cccA } from "@ckb-ccc/core/advanced";
import { describe, expect, it } from "vitest";
import { transactionFromRpcJson } from "../../src/ckb/rpc-json.js";
import { readMainnetJson } from "../helpers/fixtures.js";

/**
 * Sorts object keys, and writes the `type: null` ckb-cli prints for an output without a type
 * script where CCC leaves `type` undefined.
 */
function normalized(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalized);
  if (value === null || typeof value !== "object") return value;
  const object = { ...(value as Record<string, unknown>) };
  if ("capacity" in object && "lock" in object && object["type"] === undefined) object["type"] = null;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, normalized(object[key])]));
}

describe("transactionFromRpcJson", () => {
  const json = readMainnetJson();

  it("gives every embedded transaction the hash ckb-cli keyed it by", () => {
    for (const [hash, value] of Object.entries(json["used_input_txs"] as Record<string, unknown>)) {
      expect(transactionFromRpcJson(value, hash).hash()).toBe(hash);
    }
  });

  it("gives cell_tx the hash under which used_input_txs also stores it", () => {
    const hash = transactionFromRpcJson(json["cell_tx"], "cell_tx").hash();
    expect(hash).toBe("0x4396de69818bd88b7fce64797ccec25d1294912d56846432f29fd192120992ee");
    expect(Object.keys(json["used_input_txs"])).toContain(hash);
  });

  it("keeps every value: converting back differs only in key order and an undefined type", () => {
    const tx = transactionFromRpcJson(json["cell_tx"], "cell_tx");
    expect(normalized(cccA.JsonRpcTransformers.transactionFrom(tx))).toEqual(normalized(json["cell_tx"]));
  });

  it("refuses JSON that isn't a JSON-RPC transaction", () => {
    expect(() => transactionFromRpcJson({ inputs: [] }, "cell_tx")).toThrow(/cell_tx isn't a JSON-RPC transaction: missing or wrong version, cell_deps/);
    expect(() => transactionFromRpcJson([], "cell_tx")).toThrow(/isn't a JSON object/);
  });
});
