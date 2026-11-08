import type { ccc } from "@ckb-ccc/core";
import type { MultisigConfigInput } from "./multisig-config.js";
import type { CollectedSignature } from "./signature.js";

/** A transaction as a file holds it. */
export interface SourceTransaction {
  /** Its name in the file, such as `cell_tx`. */
  readonly name: string;
  readonly tx: ccc.Transaction;
  readonly hash: string;
}

/** One file read into the model. */
export interface SourceDocument {
  readonly format: string;
  readonly path: string;
  /** The parsed file, kept unchanged. */
  readonly original: unknown;
  readonly transactions: readonly SourceTransaction[];
  /** Transactions the format can hold but this file leaves out, such as a null `dep_group_tx`. */
  readonly absentTransactions: readonly string[];
  /** Previous transactions the file carries, by hash, for resolving input cells. */
  readonly embeddedTransactions: ReadonlyMap<string, ccc.Transaction>;
  /** Where in the file the embedded transactions are, for messages, such as `used_input_txs`. */
  readonly embeddedLabel: string;
  readonly multisigConfigs: readonly MultisigConfigInput[];
  /** Address prefixes used in the file, for network detection. */
  readonly addressPrefixes: readonly string[];
  readonly signatures: readonly CollectedSignature[];
}
