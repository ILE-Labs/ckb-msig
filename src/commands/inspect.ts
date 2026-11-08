import { readFile } from "node:fs/promises";
import { ProblemError } from "../model/problem.js";
import type { InspectionReport } from "../model/report.js";
import { type LoadedFile, type PipelineOptions, runPipeline } from "./pipeline.js";

/** The argument that reads a file from standard input. */
export const STDIN = "-";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk as Uint8Array));
  return Buffer.concat(chunks).toString("utf8");
}

async function load(path: string): Promise<LoadedFile> {
  if (path === STDIN) return { path: "stdin", text: await readStdin() };
  try {
    return { path, text: await readFile(path, "utf8") };
  } catch (error) {
    throw new ProblemError("unreadable", `can't read ${path}: ${(error as Error).message}`);
  }
}

/**
 * Inspects a file and checks the signatures it carries, then those in each extra input,
 * in command-line order. Read-only: nothing is written and no node is contacted.
 */
export async function inspect(file: string, inputs: readonly string[], options: PipelineOptions = {}): Promise<InspectionReport> {
  if ([file, ...inputs].filter((path) => path === STDIN).length > 1) {
    throw new ProblemError("usage", "only one argument can be - (standard input)");
  }
  const base = await load(file);
  const extras: LoadedFile[] = [];
  for (const input of inputs) extras.push(await load(input));
  return runPipeline(base, extras, options);
}
