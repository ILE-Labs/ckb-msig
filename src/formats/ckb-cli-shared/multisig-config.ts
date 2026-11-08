import { scriptFromFullAddress } from "../../ckb/addresses.js";
import { classifyLock } from "../../ckb/lock-classifier.js";
import { networkFromAddressPrefix } from "../../ckb/network.js";
import type { MultisigConfigInput, MultisigMember } from "../../model/multisig-config.js";
import { ProblemError } from "../../model/problem.js";

export interface ReadMultisigConfig {
  readonly config: MultisigConfigInput;
  /** The prefix of every member address, for network detection. */
  readonly addressPrefixes: readonly string[];
}

function unreadable(message: string): ProblemError {
  return new ProblemError("unreadable", message);
}

function byte(value: unknown, where: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 255) {
    throw unreadable(`${where} isn't a number from 0 to 255`);
  }
  return value;
}

/**
 * Reads ckb-cli's `ReprMultisigConfig`:
 * `{ lock_code_hash, sighash_addresses, require_first_n, threshold }`, where each address is a
 * full-format single-key address whose args are the member's key hash. Returns undefined for
 * ckb-cli's default config, which has no addresses.
 */
export function readReprMultisigConfig(value: unknown, where: string): ReadMultisigConfig | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) throw unreadable(`${where} isn't an object`);
  const repr = value as Record<string, unknown>;
  const addresses = repr["sighash_addresses"];
  if (!Array.isArray(addresses) || !addresses.every((address) => typeof address === "string")) {
    throw unreadable(`${where}.sighash_addresses isn't a list of addresses`);
  }
  if (addresses.length === 0) return undefined;

  const lockCodeHash = repr["lock_code_hash"];
  if (lockCodeHash !== undefined && (typeof lockCodeHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(lockCodeHash))) {
    throw unreadable(`${where}.lock_code_hash isn't a 32-byte hash`);
  }

  const addressPrefixes: string[] = [];
  const members = (addresses as string[]).map((address): MultisigMember => {
    const { prefix, script } = scriptFromFullAddress(address);
    const network = networkFromAddressPrefix(prefix);
    if (network === undefined) throw unreadable(`${where}: ${address} has an unknown prefix "${prefix}"`);
    if (classifyLock(script, network).kind !== "sighash") {
      throw unreadable(`${where}: ${address} isn't a single-key (secp256k1_blake160_sighash_all) address`);
    }
    addressPrefixes.push(prefix);
    return { keyHash: script.args, address };
  });

  return {
    config: {
      requireFirstN: byte(repr["require_first_n"], `${where}.require_first_n`),
      threshold: byte(repr["threshold"], `${where}.threshold`),
      members,
      ...(lockCodeHash === undefined ? {} : { declaredCodeHash: lockCodeHash.toLowerCase() }),
    },
    addressPrefixes,
  };
}
