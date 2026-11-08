import type { ccc } from "@ckb-ccc/core";
import type { MultisigConfig } from "./multisig-config.js";

/** The three deployments of the multisig lock in use on CKB. */
export type MultisigDeployment = "genesis" | "2024" | "v2";

interface LockGroupBase {
  /** The lock script every input in the group shares. */
  readonly script: ccc.Script;
  /** The inputs that use this lock, by index, in order. */
  readonly inputIndexes: readonly number[];
  /** The witness that carries the group's signatures: the one at the first input's index. */
  readonly firstWitnessIndex: number;
}

export interface MultisigLockGroup extends LockGroupBase {
  readonly kind: "multisig";
  readonly deployment: MultisigDeployment;
  readonly config: MultisigConfig;
}

/** A `secp256k1_blake160_sighash_all` group: one key, named by the lock args. */
export interface SighashLockGroup extends LockGroupBase {
  readonly kind: "sighash";
  readonly ownerKeyHash: string;
  readonly ownerAddress: string;
}

export type LockGroup = MultisigLockGroup | SighashLockGroup;
