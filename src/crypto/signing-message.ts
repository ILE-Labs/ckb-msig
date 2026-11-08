import { ccc } from "@ckb-ccc/core";
import type { LockGroup } from "../model/lock-group.js";
import { ProblemError } from "../model/problem.js";

const SIGNATURE_BYTES = 65;

/**
 * The first witness's lock while the message is hashed: the multisig script followed by
 * M zeroed signatures, or one zeroed signature for a single-key lock
 * (`secp256k1_blake160_multisig_all.c` and `secp256k1_blake160_sighash_all.c`, ckb-system-scripts).
 */
export function placeholderLock(group: LockGroup): string {
  if (group.kind === "multisig") {
    return `${group.config.script}${"00".repeat(SIGNATURE_BYTES * group.config.threshold)}`;
  }
  return `0x${"00".repeat(SIGNATURE_BYTES)}`;
}

/**
 * Computes the 32-byte message the group's signers sign. The group's first witness is
 * rebuilt with the placeholder lock, keeping its input and output type fields, and the
 * message is hashed by CCC over the transaction hash and the group's witnesses.
 * Every input must already carry its cell output and data.
 */
export async function signingMessage(tx: ccc.Transaction, group: LockGroup, client: ccc.Client): Promise<string> {
  const index = group.firstWitnessIndex;
  const draft = tx.clone();
  let witness: ccc.WitnessArgs | undefined;
  try {
    witness = draft.getWitnessArgsUnsafe(index);
  } catch {
    throw new ProblemError("unsupported", `witness ${index} isn't a WitnessArgs, so its lock can't be checked (for example, a CoBuild witness)`);
  }
  if (witness === undefined) {
    throw new ProblemError("unsupported", `witness ${index} is missing or empty; it must be a WitnessArgs that holds the lock of input ${index}`);
  }
  draft.setWitnessArgs(
    index,
    ccc.WitnessArgs.from({ lock: placeholderLock(group), inputType: witness.inputType, outputType: witness.outputType }),
  );
  const info = await draft.getSignHashInfo(group.script, client);
  if (info === undefined || info.position !== index) {
    throw new Error(`CCC found no signing position ${index} for lock args ${group.script.args}`);
  }
  return info.message;
}
