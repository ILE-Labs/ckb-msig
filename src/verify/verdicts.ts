import type { Verdict } from "../model/report.js";

export interface VerdictInput {
  /** The key hash recovered from the signature, or undefined when recovery failed. */
  readonly recoveredKeyHash: string | undefined;
  /** The key hash the file names as the signer, when it names one. */
  readonly namedSigner: string | undefined;
  /** The group's member key hashes in order. A single-key group has one: its owner. */
  readonly members: readonly string[];
}

export interface VerdictOutcome {
  readonly verdict: Verdict;
  readonly memberIndex?: number;
}

/**
 * Gives one signature its verdict. `counted` holds the members that already have a valid
 * signature in this group; a new valid member is added to it. Signatures are judged in
 * input order, so the first valid signature from a member is "valid" and later ones are
 * "duplicate".
 */
export function judgeSignature(input: VerdictInput, counted: Set<number>): VerdictOutcome {
  const { recoveredKeyHash, namedSigner, members } = input;
  if (namedSigner !== undefined) {
    const named = members.indexOf(namedSigner);
    if (named === -1) return { verdict: "not a member" };
    if (recoveredKeyHash === undefined) return { verdict: "not valid for this transaction" };
    if (recoveredKeyHash !== namedSigner) return { verdict: "signed a different transaction" };
    return countMember(named, counted);
  }
  if (recoveredKeyHash === undefined) return { verdict: "not valid for this transaction" };
  const member = members.indexOf(recoveredKeyHash);
  if (member === -1) return { verdict: "not valid for this transaction" };
  return countMember(member, counted);
}

function countMember(memberIndex: number, counted: Set<number>): VerdictOutcome {
  if (counted.has(memberIndex)) return { verdict: "duplicate", memberIndex };
  counted.add(memberIndex);
  return { verdict: "valid", memberIndex };
}
