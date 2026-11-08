import { describe, expect, it } from "vitest";
import { parseSignTxs } from "../../../src/formats/sign-txs/parser.js";
import { signTxsSignatures } from "../../../src/formats/sign-txs/signatures.js";

const SIG = `0x${"ab".repeat(65)}`;

describe("signTxsSignatures", () => {
  it("aims each section at its deploy file transaction and records where it was read", () => {
    const text = `cell_tx_signatures:\n  0x${"11".repeat(20)}: ${SIG}\ndep_group_tx_signatures:\n  0x${"22".repeat(20)}: ${SIG}`;
    expect(signTxsSignatures(parseSignTxs(text), "pasted.txt")).toEqual([
      { bytes: SIG, txName: "cell_tx", lockArgs: `0x${"11".repeat(20)}`, origin: { file: "pasted.txt", location: "cell_tx_signatures, line 2" } },
      { bytes: SIG, txName: "dep_group_tx", lockArgs: `0x${"22".repeat(20)}`, origin: { file: "pasted.txt", location: "dep_group_tx_signatures, line 4" } },
    ]);
  });

  it("uses the section name alone for JSON output", () => {
    const text = JSON.stringify({ cell_tx_signatures: { [`0x${"11".repeat(20)}`]: SIG } });
    expect(signTxsSignatures(parseSignTxs(text), "pasted.json")[0]?.origin.location).toBe("cell_tx_signatures");
  });
});
