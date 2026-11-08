import { ccc } from "@ckb-ccc/core";
import { describe, expect, it } from "vitest";
import { MULTISIG_DEPLOYMENTS, multisigDeploymentName, SIGHASH, type LockDeployment } from "../../src/ckb/deployments.js";
import { offlineClient } from "../../src/ckb/offline-client.js";
import type { Network } from "../../src/model/partial-tx.js";

const KNOWN: [LockDeployment, ccc.KnownScript][] = [
  [SIGHASH, ccc.KnownScript.Secp256k1Blake160],
  [MULTISIG_DEPLOYMENTS.genesis, ccc.KnownScript.Secp256k1Multisig],
  [MULTISIG_DEPLOYMENTS["2024"], ccc.KnownScript.Secp256k1MultisigV2Beta],
  [MULTISIG_DEPLOYMENTS.v2, ccc.KnownScript.Secp256k1MultisigV2],
];

describe("the deployment table", () => {
  it.each(["mainnet", "testnet"] as Network[])("matches CCC's script table on %s", async (network) => {
    const client = offlineClient(network);
    for (const [deployment, known] of KNOWN) {
      const info = await client.getKnownScript(known);
      expect(info.codeHash).toBe(deployment.codeHash[network]);
      expect(info.hashType).toBe(deployment.hashType);
      expect(info.cellDeps.map((dep) => [dep.cellDep.outPoint.txHash, Number(dep.cellDep.outPoint.index), dep.cellDep.depType])).toEqual([
        [deployment.cellDep[network].txHash, deployment.cellDep[network].index, "depGroup"],
      ]);
    }
  });

  it("names a multisig deployment by code hash", () => {
    expect(multisigDeploymentName(MULTISIG_DEPLOYMENTS.genesis.codeHash.mainnet, "mainnet")).toBe("genesis");
    expect(multisigDeploymentName(MULTISIG_DEPLOYMENTS["2024"].codeHash.testnet, "mainnet")).toBeUndefined();
  });
});
