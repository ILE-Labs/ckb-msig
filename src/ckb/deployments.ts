import type { MultisigDeployment } from "../model/lock-group.js";
import type { Network } from "../model/partial-tx.js";

export interface OutPointRef {
  readonly txHash: string;
  readonly index: number;
}

export interface LockDeployment {
  readonly name: string;
  readonly codeHash: Readonly<Record<Network, string>>;
  readonly hashType: "type" | "data1";
  /** The dep group cell that holds the lock's code on each network. */
  readonly cellDep: Readonly<Record<Network, OutPointRef>>;
}

// The script table of @ckb-ccc/core 1.23.0 (client/clientPublicMainnet.advanced.ts and
// client/clientPublicTestnet.advanced.ts). Every cell dep below is a dep group.

const GENESIS_MAINNET = "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c";
const GENESIS_TESTNET = "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37";

export const SIGHASH: LockDeployment = {
  name: "secp256k1_blake160_sighash_all",
  codeHash: {
    mainnet: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    testnet: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  },
  hashType: "type",
  cellDep: { mainnet: { txHash: GENESIS_MAINNET, index: 0 }, testnet: { txHash: GENESIS_TESTNET, index: 0 } },
};

export const MULTISIG_DEPLOYMENTS: Readonly<Record<MultisigDeployment, LockDeployment>> = {
  genesis: {
    name: "genesis",
    codeHash: {
      mainnet: "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      testnet: "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
    },
    hashType: "type",
    cellDep: { mainnet: { txHash: GENESIS_MAINNET, index: 1 }, testnet: { txHash: GENESIS_TESTNET, index: 1 } },
  },
  "2024": {
    name: "2024",
    codeHash: {
      mainnet: "0xd1a9f877aed3f5e07cb9c52b61ab96d06f250ae6883cc7f0a2423db0976fc821",
      testnet: "0x765b3ed6ae264b335d07e73ac332bf2c0f38f8d3340ed521cb447b4c42dd5f09",
    },
    hashType: "type",
    cellDep: {
      mainnet: { txHash: "0x44be4f4feda80c0e41783ab10e191df3b2bb5c3731b0970c916dbec385dcdc60", index: 0 },
      testnet: { txHash: "0xf2013f123b2cb745e3fdf5c935a3925647496f88090503eef58332a9245b4172", index: 0 },
    },
  },
  v2: {
    name: "v2",
    codeHash: {
      mainnet: "0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29",
      testnet: "0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29",
    },
    hashType: "data1",
    cellDep: {
      mainnet: { txHash: "0x6888aa39ab30c570c2c30d9d5684d3769bf77265a7973211a3c087fe8efbf738", index: 0 },
      testnet: { txHash: "0x2eefdeb21f3a3edf697c28a52601b4419806ed60bb427420455cc29a090b26d5", index: 0 },
    },
  },
};

/** Every lock deployment this tool supports. */
export const SUPPORTED_DEPLOYMENTS: readonly LockDeployment[] = [SIGHASH, ...Object.values(MULTISIG_DEPLOYMENTS)];

/** The name of the multisig deployment with this code hash on the network, if any. */
export function multisigDeploymentName(codeHash: string, network: Network): string | undefined {
  return Object.values(MULTISIG_DEPLOYMENTS).find((deployment) => deployment.codeHash[network] === codeHash)?.name;
}
