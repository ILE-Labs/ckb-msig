import { ccc } from "@ckb-ccc/core";
import { cccA } from "@ckb-ccc/core/advanced";
import { ProblemError } from "../model/problem.js";

export interface DecodedAddress {
  readonly prefix: string;
  readonly script: ccc.Script;
}

/**
 * Decodes a full-format address (format byte 0x00) into its lock script, without a client.
 * The payload is the 32-byte code hash, one hash-type byte, then the args.
 */
export function scriptFromFullAddress(address: string): DecodedAddress {
  let decoded: ReturnType<typeof cccA.addressPayloadFromString>;
  try {
    decoded = cccA.addressPayloadFromString(address);
  } catch (error) {
    throw new ProblemError("unreadable", `${address} isn't a valid CKB address: ${(error as Error).message}`);
  }
  const { prefix, format, payload } = decoded;
  if (format !== cccA.AddressFormat.Full) {
    throw new ProblemError("unreadable", `${address} isn't a full-format address`);
  }
  if (payload.length < 33) {
    throw new ProblemError("unreadable", `${address} is too short for a full-format address`);
  }
  let hashType: ccc.HashType;
  try {
    hashType = ccc.hashTypeFromBytes(payload.slice(32, 33));
  } catch (error) {
    throw new ProblemError("unreadable", `${address} has an unknown hash type: ${(error as Error).message}`);
  }
  const script = ccc.Script.from({ codeHash: payload.slice(0, 32), hashType, args: payload.slice(33) });
  return { prefix, script };
}

/** Encodes a lock script as a full-format address with the given prefix, without a client. */
export function addressFromScript(script: ccc.ScriptLike, prefix: string): string {
  return ccc.Address.from({ script, prefix }).toString();
}
