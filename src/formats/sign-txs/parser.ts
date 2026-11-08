import { stripVTControlCharacters } from "node:util";

/** The two maps `ckb-cli deploy sign-txs` prints, each from lock args to one signature. */
export const SIGN_TXS_SECTIONS = ["cell_tx_signatures", "dep_group_tx_signatures"] as const;
export type SignTxsSection = (typeof SIGN_TXS_SECTIONS)[number];

export interface SignTxsEntry {
  readonly section: SignTxsSection;
  readonly lockArgs: string;
  readonly signature: string;
  /** The line it was read from, from 1. Absent for JSON output. */
  readonly line?: number;
}

/** A line or JSON value that looks like part of the output but can't be read. */
export interface SignTxsProblem {
  readonly line?: number;
  readonly text: string;
  readonly reason: string;
}

export interface SignTxsOutput {
  readonly shape: "text" | "json";
  /** The sections present, including empty ones. */
  readonly sections: readonly SignTxsSection[];
  readonly entries: readonly SignTxsEntry[];
  readonly problems: readonly SignTxsProblem[];
}

const FENCE = /^```/;
// ckb-cli's YAML writer prints an empty map inline, as `cell_tx_signatures: {}`.
const HEADER = /^(cell_tx_signatures|dep_group_tx_signatures):\s*(\{\s*\})?$/;
const ENTRY = /^(0x[0-9a-fA-F]*)\s*:\s*(0x[0-9a-fA-F]*)$/;
const HEX = /^0x[0-9a-fA-F]*$/;

/**
 * Reads pasted `ckb-cli deploy sign-txs` output: YAML-style text (the default) or JSON
 * (`--output-format json`). Text may carry ANSI colour codes, CRLF or LF line endings,
 * code fences and lines before or after the block. Lines inside a section that can't be
 * read are reported, never skipped.
 */
export function parseSignTxs(input: string): SignTxsOutput {
  const text = stripVTControlCharacters(input).replace(/^﻿/, "");
  return parseJson(text) ?? parseText(text);
}

function isSection(key: string): key is SignTxsSection {
  return (SIGN_TXS_SECTIONS as readonly string[]).includes(key);
}

function byteCount(digits: number): string {
  return digits === 2 ? "1 byte" : `${digits / 2} bytes`;
}

/** Checks one `lock args: signature` pair and returns why it can't be read, if it can't. */
function entryProblem(lockArgs: string, signature: string): string | undefined {
  if (!HEX.test(lockArgs)) return "the lock args aren't 0x-prefixed hex";
  if (!HEX.test(signature)) return "the signature isn't 0x-prefixed hex";
  const argsDigits = lockArgs.length - 2;
  const signatureDigits = signature.length - 2;
  if (argsDigits % 2 !== 0) return "the lock args have an odd number of hex digits";
  if (signatureDigits % 2 !== 0) return "the signature has an odd number of hex digits";
  if (argsDigits !== 40 && argsDigits !== 56) {
    return `the lock args are ${byteCount(argsDigits)}; expected 20, or 28 with a since`;
  }
  if (signatureDigits !== 130) return `the signature is ${byteCount(signatureDigits)}; expected 65`;
  return undefined;
}

function parseText(text: string): SignTxsOutput {
  const sections = new Set<SignTxsSection>();
  const entries: SignTxsEntry[] = [];
  const problems: SignTxsProblem[] = [];
  let current: SignTxsSection | undefined;

  text.split(/\r\n|\n|\r/).forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();
    // A blank line or a code fence ends the block.
    if (trimmed === "" || FENCE.test(trimmed)) {
      current = undefined;
      return;
    }
    const header = HEADER.exec(trimmed);
    if (header !== null) {
      const section = header[1] as SignTxsSection;
      sections.add(section);
      current = header[2] === undefined ? section : undefined;
      return;
    }
    const entry = ENTRY.exec(trimmed);
    if (current === undefined) {
      if (entry !== null || trimmed.startsWith("0x")) {
        problems.push({ line, text: trimmed, reason: `a signature line outside a ${SIGN_TXS_SECTIONS.join(" or ")} section` });
      }
      return;
    }
    if (entry === null) {
      problems.push({ line, text: trimmed, reason: "not a `0x<lock args>: 0x<signature>` line" });
      return;
    }
    const [, lockArgs = "", signature = ""] = entry;
    const problem = entryProblem(lockArgs, signature);
    if (problem !== undefined) {
      problems.push({ line, text: trimmed, reason: problem });
      return;
    }
    entries.push({ section: current, lockArgs: lockArgs.toLowerCase(), signature: signature.toLowerCase(), line });
  });

  return { shape: "text", sections: [...sections], entries, problems };
}

/** The JSON candidate: the first fenced block when there is one, otherwise the whole text. */
function jsonCandidate(text: string): string {
  const fenced = /```[^\r\n]*\r?\n([\s\S]*?)```/.exec(text);
  return (fenced?.[1] ?? text).trim();
}

function parseJson(text: string): SignTxsOutput | undefined {
  const candidate = jsonCandidate(text);
  if (!candidate.startsWith("{")) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(candidate);
  } catch {
    return undefined;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const object = value as Record<string, unknown>;
  if (!Object.keys(object).some(isSection)) return undefined;

  const sections: SignTxsSection[] = [];
  const entries: SignTxsEntry[] = [];
  const problems: SignTxsProblem[] = [];
  for (const [key, map] of Object.entries(object)) {
    if (!isSection(key)) {
      problems.push({ text: key, reason: `an unknown key; expected ${SIGN_TXS_SECTIONS.join(" or ")}` });
      continue;
    }
    sections.push(key);
    if (typeof map !== "object" || map === null || Array.isArray(map)) {
      problems.push({ text: key, reason: "not an object from lock args to a signature" });
      continue;
    }
    for (const [lockArgs, signature] of Object.entries(map as Record<string, unknown>)) {
      const shown = `${key}.${lockArgs}`;
      if (typeof signature !== "string") {
        problems.push({ text: shown, reason: "the signature isn't a string" });
        continue;
      }
      const problem = entryProblem(lockArgs, signature);
      if (problem !== undefined) {
        problems.push({ text: shown, reason: problem });
        continue;
      }
      entries.push({ section: key, lockArgs: lockArgs.toLowerCase(), signature: signature.toLowerCase() });
    }
  }
  return { shape: "json", sections, entries, problems };
}
