import type { LockGroup } from "./lock-group.js";
import type { Network, ResolvedInput } from "./partial-tx.js";
import type { CollectedSignature } from "./signature.js";

export type Verdict =
  | "valid"
  | "duplicate"
  | "not valid for this transaction"
  | "signed a different transaction"
  | "not a member";

export interface SignatureResult {
  readonly signature: CollectedSignature;
  readonly verdict: Verdict;
  readonly recoveredKeyHash?: string;
  /** The member the signature counts for, from 0. */
  readonly memberIndex?: number;
  /** Why the verdict was given, when the verdict alone doesn't say. */
  readonly detail?: string;
}

/** Members are numbered from 0 in config order. A single-key group has one member, the owner. */
export interface GroupStatus {
  readonly needed: number;
  readonly validMembers: readonly number[];
  readonly missingMembers: readonly number[];
  readonly missingFirstR: readonly number[];
  readonly thresholdMet: boolean;
  readonly firstRPresent: boolean;
  /** There are enough valid signatures, including every first-R member, to pick exactly the number needed. */
  readonly canFinalize: boolean;
}

export interface GroupReport {
  readonly group: LockGroup;
  readonly results: readonly SignatureResult[];
  readonly status: GroupStatus;
  readonly notes: readonly string[];
}

export interface TransactionReport {
  readonly name: string;
  readonly hash: string;
  /** The file also carries this transaction among its embedded transactions, under its own hash. */
  readonly listedUnderOwnHash: boolean;
  readonly inputs: readonly ResolvedInput[];
  readonly groups: readonly GroupReport[];
}

/** An extra input given on the command line. */
export interface InputReport {
  readonly path: string;
  readonly formatLabel: string;
  readonly signatureCount: number;
  readonly problems: readonly string[];
}

export interface InspectionReport {
  readonly path: string;
  readonly formatLabel: string;
  readonly network: Network;
  readonly networkSource: string;
  readonly embeddedLabel: string;
  readonly transactions: readonly TransactionReport[];
  readonly absentTransactions: readonly string[];
  readonly inputs: readonly InputReport[];
  /** Signatures meant for a transaction or lock group the base file doesn't have. */
  readonly unmatched: readonly SignatureResult[];
}
