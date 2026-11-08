import type { CollectedSignature } from "../../model/signature.js";
import type { SignTxsOutput, SignTxsSection } from "./parser.js";

/** The deploy info file transaction each `sign-txs` section signs. */
export const SECTION_TRANSACTIONS: Readonly<Record<SignTxsSection, string>> = {
  cell_tx_signatures: "cell_tx",
  dep_group_tx_signatures: "dep_group_tx",
};

/** Turns parsed `sign-txs` output into signatures aimed at the info file's transactions. */
export function signTxsSignatures(output: SignTxsOutput, path: string): CollectedSignature[] {
  return output.entries.map((entry) => ({
    bytes: entry.signature,
    txName: SECTION_TRANSACTIONS[entry.section],
    lockArgs: entry.lockArgs,
    origin: { file: path, location: entry.line === undefined ? entry.section : `${entry.section}, line ${entry.line}` },
  }));
}
