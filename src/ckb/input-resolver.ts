import type { ccc } from "@ckb-ccc/core";
import type { ResolvedInput } from "../model/partial-tx.js";
import { ProblemError } from "../model/problem.js";

export interface ResolvedTransaction {
  /** A copy of the transaction with every input's cell output and data filled in. */
  readonly tx: ccc.Transaction;
  readonly inputs: readonly ResolvedInput[];
}

/**
 * Fills each input's cell from the previous transactions a file embeds. With both the
 * cell output and its data present on every input, CCC computes signing messages
 * without asking a node for cells.
 */
export function resolveEmbeddedInputs(
  tx: ccc.Transaction,
  embedded: ReadonlyMap<string, ccc.Transaction>,
  embeddedLabel: string,
): ResolvedTransaction {
  const resolved = tx.clone();
  const inputs = resolved.inputs.map((input, index): ResolvedInput => {
    const previousTxHash = input.previousOutput.txHash;
    const previousIndex = Number(input.previousOutput.index);
    const previous = embedded.get(previousTxHash);
    if (previous === undefined) {
      throw new ProblemError("unsupported", `input ${index} spends ${previousTxHash} #${previousIndex}, but ${embeddedLabel} doesn't carry that transaction`);
    }
    const output = previous.outputs[previousIndex];
    const data = previous.outputsData[previousIndex];
    if (output === undefined || data === undefined) {
      throw new ProblemError("unsupported", `input ${index} spends ${previousTxHash} #${previousIndex}, but that transaction has ${previous.outputs.length} outputs`);
    }
    input.cellOutput = output.clone();
    input.outputData = data;
    return { index, previousTxHash, previousIndex, lock: output.lock, source: "embedded" };
  });
  return { tx: resolved, inputs };
}
