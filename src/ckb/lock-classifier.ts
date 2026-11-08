import type { MultisigDeployment } from "../model/lock-group.js";
import type { Network } from "../model/partial-tx.js";
import { type LockDeployment, MULTISIG_DEPLOYMENTS, SIGHASH } from "./deployments.js";

/** A lock script's identity: what the classifier reads. */
export interface LockScriptFields {
  readonly codeHash: string;
  readonly hashType: string;
  readonly args: string;
}

export type LockClass =
  | { readonly kind: "multisig"; readonly deployment: MultisigDeployment }
  | { readonly kind: "sighash" }
  | { readonly kind: "unsupported"; readonly reason: string };

function matches(deployment: LockDeployment, script: LockScriptFields, network: Network): boolean {
  return script.codeHash === deployment.codeHash[network] && script.hashType === deployment.hashType;
}

/**
 * Classifies a lock script on a network. Multisig and single-key locks take 20-byte args;
 * a multisig lock with 28-byte args carries a since (time lock) and is not supported.
 */
export function classifyLock(script: LockScriptFields, network: Network): LockClass {
  const argsBytes = (script.args.length - 2) / 2;
  if (matches(SIGHASH, script, network)) {
    return argsBytes === 20 ? { kind: "sighash" } : { kind: "unsupported", reason: `single-key lock with ${argsBytes}-byte args` };
  }
  for (const [deployment, info] of Object.entries(MULTISIG_DEPLOYMENTS) as [MultisigDeployment, LockDeployment][]) {
    if (!matches(info, script, network)) continue;
    if (argsBytes === 20) return { kind: "multisig", deployment };
    if (argsBytes === 28) return { kind: "unsupported", reason: "time-locked multisig (lock args carry a since)" };
    return { kind: "unsupported", reason: `multisig lock with ${argsBytes}-byte args` };
  }
  return { kind: "unsupported", reason: `code hash ${script.codeHash}, hash type ${script.hashType}` };
}
