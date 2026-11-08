import type { ccc } from "@ckb-ccc/core";
import type { LockGroup } from "./lock-group.js";

export type Network = "mainnet" | "testnet";

/** Where an input's cell came from. */
export type CellSource = "embedded";

/** One input with the cell it spends. */
export interface ResolvedInput {
  readonly index: number;
  readonly previousTxHash: string;
  readonly previousIndex: number;
  readonly lock: ccc.Script;
  readonly source: CellSource;
}

/** One transaction with its input cells resolved and its inputs grouped by lock. */
export interface PartialTx {
  /** The transaction's name in the base file, such as `cell_tx`. */
  readonly name: string;
  /** The transaction, with every input's cell output and data filled in. */
  readonly tx: ccc.Transaction;
  readonly hash: string;
  readonly network: Network;
  readonly inputs: readonly ResolvedInput[];
  readonly groups: readonly LockGroup[];
}
