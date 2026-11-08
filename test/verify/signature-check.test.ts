import { describe, expect, it } from "vitest";
import { resolveEmbeddedInputs } from "../../src/ckb/input-resolver.js";
import { groupInputs } from "../../src/ckb/lock-groups.js";
import { offlineClient } from "../../src/ckb/offline-client.js";
import { transactionFromRpcJson } from "../../src/ckb/rpc-json.js";
import { readReprMultisigConfig } from "../../src/formats/ckb-cli-shared/multisig-config.js";
import type { PartialTx } from "../../src/model/partial-tx.js";
import { checkSignatures } from "../../src/verify/signature-check.js";
import { readMainnetJson } from "../helpers/fixtures.js";

const MULTISIG_ARGS = "0x66712ae36e89b0e796155d004bebe2540ee7dfc9";

function partialTx(): { partial: PartialTx; multisigSignature: string } {
  const json = readMainnetJson();
  const embedded = new Map(Object.entries(json["used_input_txs"]).map(([hash, value]) => [hash, transactionFromRpcJson(value, hash)]));
  const tx = transactionFromRpcJson(json["cell_tx"], "cell_tx");
  const resolved = resolveEmbeddedInputs(tx, embedded, "used_input_txs");
  const config = readReprMultisigConfig(json["deployment"].multisig_config, "multisig_config")?.config;
  const groups = groupInputs(resolved.inputs, "mainnet", config === undefined ? [] : [config], "cell_tx");
  const partial = { name: "cell_tx", tx: resolved.tx, hash: tx.hash(), network: "mainnet" as const, inputs: resolved.inputs, groups };
  return { partial, multisigSignature: json["cell_tx_signatures"][MULTISIG_ARGS][0] };
}

const origin = { file: "test", location: "here" };

describe("checkSignatures", () => {
  const { partial, multisigSignature } = partialTx();
  const client = offlineClient("mainnet");

  it("checks signatures in order and skips other transactions", async () => {
    const signatures = [
      { bytes: multisigSignature, txName: "cell_tx", lockArgs: MULTISIG_ARGS, origin },
      { bytes: multisigSignature, txName: "dep_group_tx", lockArgs: MULTISIG_ARGS, origin },
      { bytes: multisigSignature, txName: "cell_tx", lockArgs: MULTISIG_ARGS, origin },
    ];
    const checked = await checkSignatures(partial, signatures, client);
    expect(checked.groups[0]?.results.map((result) => result.verdict)).toEqual(["valid", "duplicate"]);
    expect(checked.groups[1]?.results).toEqual([]);
    expect(checked.unmatched).toEqual([]);
  });

  it("explains a signature that isn't 65 bytes", async () => {
    const checked = await checkSignatures(partial, [{ bytes: "0x1234", txName: "cell_tx", lockArgs: MULTISIG_ARGS, origin }], client);
    expect(checked.groups[0]?.results[0]).toMatchObject({ verdict: "not valid for this transaction", detail: "it isn't a 65-byte signature" });
  });

  it("sets aside a signature whose lock args match no group", async () => {
    const lockArgs = `0x${"44".repeat(20)}`;
    const checked = await checkSignatures(partial, [{ bytes: multisigSignature, txName: "cell_tx", lockArgs, origin }], client);
    expect(checked.unmatched[0]?.detail).toBe(`no input of cell_tx has lock args ${lockArgs}`);
  });
});
