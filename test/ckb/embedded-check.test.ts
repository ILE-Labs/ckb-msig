import { describe, expect, it } from "vitest";
import { checkEmbeddedTransactions } from "../../src/ckb/embedded-check.js";
import { readDeployInfo } from "../../src/formats/ckb-cli-deploy/reader.js";
import { readMainnetJson } from "../helpers/fixtures.js";

const PREVIOUS_TX = "0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6";

describe("checkEmbeddedTransactions", () => {
  it("accepts fiber-scripts #34, whose used_input_txs entries all hash to their keys", () => {
    expect(() => checkEmbeddedTransactions(readDeployInfo(JSON.stringify(readMainnetJson()), "mainnet.json"))).not.toThrow();
  });

  it("refuses the file when an entry's content no longer hashes to its key", () => {
    const json = readMainnetJson();
    json["used_input_txs"][PREVIOUS_TX].outputs[2].lock.code_hash = `0x${"11".repeat(32)}`;
    const document = readDeployInfo(JSON.stringify(json), "mainnet.json");
    expect(() => checkEmbeddedTransactions(document)).toThrow(expect.objectContaining({ kind: "unsupported" }));
    expect(() => checkEmbeddedTransactions(document)).toThrow(
      new RegExp(`^mainnet.json: input transaction ${PREVIOUS_TX} in used_input_txs doesn't match its hash \\(its content hashes to 0x[0-9a-f]{64}\\)$`),
    );
  });
});
