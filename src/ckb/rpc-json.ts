import type { ccc } from "@ckb-ccc/core";
import { cccA } from "@ckb-ccc/core/advanced";
import { ProblemError } from "../model/problem.js";

type JsonRpcTransaction = Parameters<typeof cccA.JsonRpcTransformers.transactionTo>[0];

const ARRAY_FIELDS = ["cell_deps", "header_deps", "inputs", "outputs", "outputs_data", "witnesses"] as const;

/**
 * Converts a snake_case JSON-RPC transaction, as ckb-cli writes it, into a CCC transaction.
 * `ccc.Transaction.from` reads only camelCase keys, so the JSON-RPC transformer is used.
 */
export function transactionFromRpcJson(value: unknown, where: string): ccc.Transaction {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ProblemError("unreadable", `${where} isn't a JSON object`);
  }
  const object = value as Record<string, unknown>;
  const missing = [
    ...(typeof object["version"] === "string" ? [] : ["version"]),
    ...ARRAY_FIELDS.filter((field) => !Array.isArray(object[field])),
  ];
  if (missing.length > 0) {
    throw new ProblemError("unreadable", `${where} isn't a JSON-RPC transaction: missing or wrong ${missing.join(", ")}`);
  }
  try {
    return cccA.JsonRpcTransformers.transactionTo(object as unknown as JsonRpcTransaction);
  } catch (error) {
    throw new ProblemError("unreadable", `${where} isn't a valid JSON-RPC transaction: ${(error as Error).message}`);
  }
}
