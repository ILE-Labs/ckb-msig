export interface LockRuleConfig {
  /** Member key hashes in config order. */
  readonly members: readonly string[];
  /** R: the first R members must all sign. */
  readonly requireFirstN: number;
  /** M: the lock takes exactly M signatures. */
  readonly threshold: number;
}

export interface LockRuleResult {
  /** Members with a signature, by index, in the order first seen. */
  readonly signed: readonly number[];
  /** Members seen more than once, by index. Each key counts once. */
  readonly duplicates: readonly number[];
  readonly nonMembers: readonly string[];
  /** Members without a signature, by index, in config order. */
  readonly missing: readonly number[];
  readonly missingFirstR: readonly number[];
  readonly thresholdMet: boolean;
  readonly firstRPresent: boolean;
  /** Exactly M signatures that include every first-R member can be picked. */
  readonly complete: boolean;
}

/**
 * Applies the multisig lock's matching rules (`secp256k1_blake160_multisig_all.c`,
 * ckb-system-scripts) to a list of signer key hashes: the witness holds exactly M
 * signatures, each key is used at most once, and the first R keys must all be used.
 */
export function checkLockRules(config: LockRuleConfig, signers: readonly string[]): LockRuleResult {
  const signed: number[] = [];
  const duplicates: number[] = [];
  const nonMembers: string[] = [];
  for (const signer of signers) {
    const index = config.members.indexOf(signer);
    if (index === -1) nonMembers.push(signer);
    else if (signed.includes(index)) duplicates.push(index);
    else signed.push(index);
  }
  const missing = config.members.map((_, index) => index).filter((index) => !signed.includes(index));
  const missingFirstR = missing.filter((index) => index < config.requireFirstN);
  const thresholdMet = signed.length >= config.threshold;
  const firstRPresent = missingFirstR.length === 0;
  return {
    signed,
    duplicates,
    nonMembers,
    missing,
    missingFirstR,
    thresholdMet,
    firstRPresent,
    // R <= M, so the first R members plus any M - R others make a set of exactly M.
    complete: thresholdMet && firstRPresent,
  };
}
