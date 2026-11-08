import { ProblemError } from "../model/problem.js";
import type { SourceDocument } from "../model/source-document.js";

/**
 * Checks that every embedded previous transaction hashes to the key it is stored under.
 * An input names the transaction it spends from by hash, so only an entry whose content
 * hashes to its key can supply that input's cell. Any mismatch refuses the whole file.
 */
export function checkEmbeddedTransactions(document: SourceDocument): void {
  const mismatches: string[] = [];
  for (const [key, tx] of document.embeddedTransactions) {
    const hash = tx.hash();
    if (hash !== key) {
      mismatches.push(`input transaction ${key} in ${document.embeddedLabel} doesn't match its hash (its content hashes to ${hash})`);
    }
  }
  if (mismatches.length > 0) throw new ProblemError("unsupported", `${document.path}: ${mismatches.join("; ")}`);
}
