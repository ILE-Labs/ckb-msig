import { describe, expect, it, vi } from "vitest";
import { resolveEmbeddedInputs } from "../../src/ckb/input-resolver.js";
import { groupInputs } from "../../src/ckb/lock-groups.js";
import { offlineClient } from "../../src/ckb/offline-client.js";
import { transactionFromRpcJson } from "../../src/ckb/rpc-json.js";
import { placeholderLock, signingMessage } from "../../src/crypto/signing-message.js";
import { readReprMultisigConfig } from "../../src/formats/ckb-cli-shared/multisig-config.js";
import { readMainnetJson } from "../helpers/fixtures.js";

function setup() {
  const json = readMainnetJson();
  const embedded = new Map(Object.entries(json["used_input_txs"]).map(([hash, value]) => [hash, transactionFromRpcJson(value, hash)]));
  const tx = transactionFromRpcJson(json["cell_tx"], "cell_tx");
  const resolved = resolveEmbeddedInputs(tx, embedded, "used_input_txs");
  const config = readReprMultisigConfig(json["deployment"].multisig_config, "multisig_config")?.config;
  const groups = groupInputs(resolved.inputs, "mainnet", config === undefined ? [] : [config], "cell_tx");
  return { json, tx, resolved, groups };
}

describe("signing messages", () => {
  const { json, tx, resolved, groups } = setup();
  const [multisig, sighash] = groups as [(typeof groups)[number], (typeof groups)[number]];

  it("builds the placeholder locks the #34 witnesses already hold", () => {
    expect((placeholderLock(multisig).length - 2) / 2).toBe(4 + 20 * 5 + 65 * 3);
    expect(placeholderLock(sighash)).toBe(`0x${"00".repeat(65)}`);
    // Each witness is the 16-byte WitnessArgs header, a 4-byte length, then the lock.
    expect(`0x${(json["cell_tx"].witnesses[0] as string).slice(42)}`).toBe(placeholderLock(multisig));
    expect(`0x${(json["cell_tx"].witnesses[1] as string).slice(42)}`).toBe(placeholderLock(sighash));
  });

  it("gives the same message as hashing the file's own placeholder witnesses", async () => {
    const client = offlineClient("mainnet");
    for (const group of groups) {
      const direct = await resolved.tx.getSignHashInfo(group.script, client);
      expect(await signingMessage(resolved.tx, group, client)).toBe(direct?.message);
    }
  });

  it("asks the client for cells when the inputs aren't resolved, which the offline client refuses", async () => {
    const onRequest = vi.fn();
    await expect(signingMessage(tx, multisig, offlineClient("mainnet", onRequest))).rejects.toThrow();
    expect(onRequest).toHaveBeenCalled();
  });
});
