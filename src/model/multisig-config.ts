/** One multisig member: the blake160 hash of their compressed public key, and its address. */
export interface MultisigMember {
  readonly keyHash: string;
  readonly address: string;
}

/** A multisig configuration as a file states it, before any check. */
export interface MultisigConfigInput {
  /** R: the first R members must all sign. */
  readonly requireFirstN: number;
  /** M: the number of signatures the lock needs. */
  readonly threshold: number;
  readonly members: readonly MultisigMember[];
  /** The lock code hash the file names, when it names one. */
  readonly declaredCodeHash?: string;
}

/** A configuration that passed the multisig script rules, with its script bytes and lock args. */
export interface MultisigConfig extends MultisigConfigInput {
  /** `S | R | M | N` followed by the N key hashes. */
  readonly script: string;
  /** blake160 of the script: the 20-byte lock args. */
  readonly args: string;
}

const KEY_HASH = /^0x[0-9a-f]{40}$/;

/**
 * Checks R, M and N against the rules of `secp256k1_blake160_multisig_all.c`
 * (ckb-system-scripts): N > 0, 0 < M <= N and R <= M. S is always written as 0.
 * N, M and R are single bytes in the script, and each member is a 20-byte key hash.
 * Returns the first broken rule as a sentence, or undefined when the configuration is valid.
 */
export function multisigConfigProblem(config: MultisigConfigInput): string | undefined {
  const n = config.members.length;
  const m = config.threshold;
  const r = config.requireFirstN;
  if (n === 0) return "the multisig config has no members";
  if (n > 255) return `the multisig config has ${n} members; at most 255 fit in the script`;
  if (!Number.isInteger(m) || m < 1 || m > n) return `threshold ${m} must be between 1 and the ${n} members`;
  if (!Number.isInteger(r) || r < 0 || r > m) return `require_first_n ${r} must be between 0 and the threshold ${m}`;
  const bad = config.members.find((member) => !KEY_HASH.test(member.keyHash));
  if (bad !== undefined) return `member ${bad.address} doesn't have a 20-byte key hash`;
  return undefined;
}
