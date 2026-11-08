import { transactionFromRpcJson } from "../../ckb/rpc-json.js";
import { ProblemError } from "../../model/problem.js";
import type { CollectedSignature } from "../../model/signature.js";
import type { SourceTransaction } from "../../model/source-document.js";
import { readReprMultisigConfig } from "../ckb-cli-shared/multisig-config.js";
import type { TransactionReader } from "../format.js";

/** The info file's two transactions, either of which may be null, and the signature map of each. */
const TRANSACTIONS = [
  { name: "cell_tx", signatures: "cell_tx_signatures" },
  { name: "dep_group_tx", signatures: "dep_group_tx_signatures" },
] as const;

function unreadable(message: string): ProblemError {
  return new ProblemError("unreadable", message);
}

function asObject(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw unreadable(`${where} isn't a JSON object`);
  return value as Record<string, unknown>;
}

/** A signature map: lock args to a list of 65-byte signatures. */
function readSignatureMap(value: unknown, txName: string, location: string, path: string): CollectedSignature[] {
  if (value === undefined || value === null) return [];
  const map = asObject(value, `${path}: ${location}`);
  return Object.entries(map).flatMap(([lockArgs, list]) => {
    if (!Array.isArray(list) || !list.every((signature) => typeof signature === "string")) {
      throw unreadable(`${path}: ${location} ${lockArgs} isn't a list of signatures`);
    }
    return (list as string[]).map((bytes) => ({
      bytes: bytes.toLowerCase(),
      txName,
      lockArgs: lockArgs.toLowerCase(),
      origin: { file: path, location },
    }));
  });
}

/**
 * Reads a `ckb-cli deploy` info file. `cell_tx`, `dep_group_tx` and each entry of
 * `used_input_txs` are snake_case JSON-RPC transactions; `used_input_txs` carries the
 * previous transactions, so the input cells resolve offline.
 */
export const readDeployInfo: TransactionReader = (text, path) => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.replace(/^﻿/, ""));
  } catch (error) {
    throw unreadable(`${path} isn't valid JSON: ${(error as Error).message}`);
  }
  const json = asObject(parsed, path);

  const transactions: SourceTransaction[] = [];
  const absentTransactions: string[] = [];
  for (const { name } of TRANSACTIONS) {
    const value = json[name];
    if (value === undefined || value === null) {
      absentTransactions.push(name);
      continue;
    }
    const tx = transactionFromRpcJson(value, `${path}: ${name}`);
    transactions.push({ name, tx, hash: tx.hash() });
  }

  const embeddedTransactions = new Map<string, SourceTransaction["tx"]>();
  if (json["used_input_txs"] !== undefined) {
    const used = asObject(json["used_input_txs"], `${path}: used_input_txs`);
    for (const [hash, value] of Object.entries(used)) {
      embeddedTransactions.set(hash.toLowerCase(), transactionFromRpcJson(value, `${path}: used_input_txs ${hash}`));
    }
  }

  const deployment = asObject(json["deployment"], `${path}: deployment`);
  const repr = readReprMultisigConfig(deployment["multisig_config"], `${path}: deployment.multisig_config`);

  return {
    format: "ckb-cli-deploy",
    path,
    original: json,
    transactions,
    absentTransactions,
    embeddedTransactions,
    embeddedLabel: "used_input_txs",
    multisigConfigs: repr === undefined ? [] : [repr.config],
    addressPrefixes: repr?.addressPrefixes ?? [],
    signatures: TRANSACTIONS.flatMap(({ name, signatures }) => readSignatureMap(json[signatures], name, signatures, path)),
  };
};
