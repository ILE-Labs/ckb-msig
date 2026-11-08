import { describe, expect, it } from "vitest";
import { readDeployInfo } from "../../../src/formats/ckb-cli-deploy/reader.js";
import { MAINNET_PATH, readFixtureText, readMainnetJson } from "../../helpers/fixtures.js";

describe("readDeployInfo", () => {
  it("reads fiber-scripts #34", () => {
    const document = readDeployInfo(readFixtureText(MAINNET_PATH), "mainnet.json");
    expect(document.format).toBe("ckb-cli-deploy");
    expect(document.transactions.map((tx) => [tx.name, tx.hash])).toEqual([
      ["cell_tx", "0x4396de69818bd88b7fce64797ccec25d1294912d56846432f29fd192120992ee"],
    ]);
    expect(document.absentTransactions).toEqual(["dep_group_tx"]);
    expect([...document.embeddedTransactions.keys()].sort()).toEqual([
      "0x4396de69818bd88b7fce64797ccec25d1294912d56846432f29fd192120992ee",
      "0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6",
    ]);
    expect(document.addressPrefixes).toEqual(Array(5).fill("ckb"));
    expect(document.multisigConfigs).toHaveLength(1);
    expect(document.multisigConfigs[0]).toMatchObject({
      requireFirstN: 0,
      threshold: 3,
      declaredCodeHash: "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
    });
    expect(document.signatures.map((signature) => [signature.txName, signature.lockArgs, signature.origin.location])).toEqual([
      ["cell_tx", "0x5cf028300e33eef47429c9cfcb1d53e7a537e4e1", "cell_tx_signatures"],
      ["cell_tx", "0x66712ae36e89b0e796155d004bebe2540ee7dfc9", "cell_tx_signatures"],
    ]);
  });

  it("reads both transactions when dep_group_tx is present", () => {
    const json = readMainnetJson();
    json["dep_group_tx"] = json["cell_tx"];
    const document = readDeployInfo(JSON.stringify(json), "both.json");
    expect(document.transactions.map((tx) => tx.name)).toEqual(["cell_tx", "dep_group_tx"]);
    expect(document.absentTransactions).toEqual([]);
  });

  it("refuses a signature map that isn't lock args to lists", () => {
    const json = readMainnetJson();
    json["cell_tx_signatures"] = { "0x66712ae36e89b0e796155d004bebe2540ee7dfc9": "0xab" };
    expect(() => readDeployInfo(JSON.stringify(json), "bad.json")).toThrow(/isn't a list of signatures/);
  });

  it("refuses text that isn't JSON", () => {
    expect(() => readDeployInfo("{", "bad.json")).toThrow(/bad.json isn't valid JSON/);
  });
});
