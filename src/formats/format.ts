import type { SourceDocument } from "../model/source-document.js";

export type FormatName = "ckb-cli-deploy" | "sign-txs";

export const FORMAT_LABELS: Readonly<Record<FormatName, string>> = {
  "ckb-cli-deploy": "ckb-cli deploy info file",
  "sign-txs": "pasted ckb-cli deploy sign-txs output",
};

/** Reads a file that holds one or more transactions into the model. */
export type TransactionReader = (text: string, path: string) => SourceDocument;
