import { recoverKeyHash } from "../crypto/key-recovery.js";
import { signingMessage } from "../crypto/signing-message.js";
import type { LockGroup } from "../model/lock-group.js";
import type { PartialTx } from "../model/partial-tx.js";
import type { SignatureResult } from "../model/report.js";
import type { CollectedSignature } from "../model/signature.js";
import { groupMembers } from "./group-status.js";
import { judgeSignature } from "./verdicts.js";

type SigningClient = Parameters<typeof signingMessage>[2];

export interface GroupSignatures {
  readonly group: LockGroup;
  readonly results: readonly SignatureResult[];
}

export interface CheckedSignatures {
  readonly groups: readonly GroupSignatures[];
  /** Signatures for this transaction whose lock args match no single lock group. */
  readonly unmatched: readonly SignatureResult[];
}

function recoveryDetail(bytes: string): string {
  if (/^0x[0-9a-f]{130}$/.test(bytes)) return "no public key can be recovered from it";
  return "it isn't a 65-byte signature";
}

/**
 * Checks every signature aimed at one transaction, in the order given: each is matched to
 * the lock group with its lock args, its key is recovered from the group's signing message,
 * and it gets a verdict. A single-key group's args name its signer.
 */
export async function checkSignatures(
  partial: PartialTx,
  signatures: readonly CollectedSignature[],
  client: SigningClient,
): Promise<CheckedSignatures> {
  const groups = [];
  for (const group of partial.groups) {
    groups.push({
      group,
      message: await signingMessage(partial.tx, group, client),
      members: groupMembers(group),
      counted: new Set<number>(),
      results: [] as SignatureResult[],
    });
  }

  const unmatched: SignatureResult[] = [];
  for (const signature of signatures) {
    if (signature.txName !== partial.name) continue;
    const targets = groups.filter((entry) => entry.group.script.args === signature.lockArgs);
    const [target] = targets;
    if (target === undefined || targets.length > 1) {
      const detail =
        target === undefined
          ? `no input of ${partial.name} has lock args ${signature.lockArgs}`
          : `lock args ${signature.lockArgs} match more than one lock group`;
      unmatched.push({ signature, verdict: "not valid for this transaction", detail });
      continue;
    }
    const recoveredKeyHash = recoverKeyHash(target.message, signature.bytes);
    const namedSigner = target.group.kind === "sighash" ? target.group.ownerKeyHash : signature.namedSigner;
    const outcome = judgeSignature({ recoveredKeyHash, namedSigner, members: target.members }, target.counted);
    target.results.push({
      signature,
      ...outcome,
      ...(recoveredKeyHash === undefined ? { detail: recoveryDetail(signature.bytes) } : { recoveredKeyHash }),
    });
  }

  return { groups: groups.map(({ group, results }) => ({ group, results })), unmatched };
}
