import type { FormatName } from "./format.js";
import { parseSignTxs } from "./sign-txs/parser.js";

function jsonObject(text: string): Record<string, unknown> | undefined {
  try {
    const value: unknown = JSON.parse(text.replace(/^﻿/, ""));
    if (typeof value === "object" && value !== null && !Array.isArray(value)) return value as Record<string, unknown>;
  } catch {
    // Not JSON: other formats are text.
  }
  return undefined;
}

/**
 * Decides a file's format:
 * 1. a ckb-cli deploy info file: a JSON object with `deployment` and `new_recipe`;
 * 2. pasted `ckb-cli deploy sign-txs` output: text or JSON with a
 *    `cell_tx_signatures` or `dep_group_tx_signatures` section.
 * Returns undefined for anything else.
 */
export function detectFormat(text: string): FormatName | undefined {
  const object = jsonObject(text);
  if (object !== undefined && "deployment" in object && "new_recipe" in object) return "ckb-cli-deploy";
  if (parseSignTxs(text).sections.length > 0) return "sign-txs";
  return undefined;
}
