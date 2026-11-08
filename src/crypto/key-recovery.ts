import { ccc } from "@ckb-ccc/core";

// 65 bytes: r (32), s (32), then the recovery id.
const SIGNATURE = /^0x[0-9a-f]{130}$/;

/**
 * Recovers who made a signature: the public key behind it, compressed, then hashed to its
 * 20-byte blake160 key hash. Returns undefined when the signature isn't 65 bytes or no key
 * can be recovered.
 */
export function recoverKeyHash(message: string, signature: string): string | undefined {
  if (!SIGNATURE.test(signature)) return undefined;
  try {
    return ccc.hashCkbShort(ccc.recoverMessageSecp256k1(message, signature));
  } catch {
    return undefined;
  }
}
