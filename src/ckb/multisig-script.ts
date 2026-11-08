import { ccc } from "@ckb-ccc/core";
import { type MultisigConfig, type MultisigConfigInput, multisigConfigProblem } from "../model/multisig-config.js";
import { ProblemError } from "../model/problem.js";

/**
 * Builds the multisig script `S | R | M | N | key hashes` with S = 0, and its lock args:
 * the first 20 bytes of blake2b-256 (personalization `ckb-default-hash`) of the script,
 * as `secp256k1_blake160_multisig_all.c` (ckb-system-scripts) checks them.
 */
export function buildMultisigConfig(input: MultisigConfigInput): MultisigConfig {
  const problem = multisigConfigProblem(input);
  if (problem !== undefined) throw new ProblemError("unsupported", problem);
  const header = [0, input.requireFirstN, input.threshold, input.members.length];
  const script = ccc.hexFrom(ccc.bytesConcat(header, ...input.members.map((member) => member.keyHash)));
  return { ...input, script, args: ccc.hashCkbShort(script) };
}
