import { parseArgs } from "node:util";
import type { Network } from "../model/partial-tx.js";
import { ProblemError } from "../model/problem.js";

export const USAGE = [
  "usage: ckb-msig inspect <file> [inputs...] [--network mainnet|testnet]",
  "       ckb-msig --help | --version",
  "  <file>    the transaction file to check",
  "  inputs    more signatures: another file, or pasted ckb-cli deploy sign-txs output",
  "  -         reads one file or input from standard input",
].join("\n");

export interface InspectCommand {
  readonly command: "inspect";
  readonly file: string;
  readonly inputs: readonly string[];
  readonly network?: Network;
}

export interface HelpCommand {
  readonly command: "help";
}

export interface VersionCommand {
  readonly command: "version";
}

export type Command = InspectCommand | HelpCommand | VersionCommand;

export function parseCommandLine(argv: readonly string[]): Command {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: {
        network: { type: "string" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
      allowPositionals: true,
      strict: true,
    });
  } catch (error) {
    throw new ProblemError("usage", (error as Error).message);
  }

  if (parsed.values.help === true) return { command: "help" };
  if (parsed.values.version === true) return { command: "version" };

  const [command, file, ...inputs] = parsed.positionals;
  if (command === undefined) throw new ProblemError("usage", "no command given");
  if (command !== "inspect") throw new ProblemError("usage", `unknown command "${command}"`);
  if (file === undefined) throw new ProblemError("usage", "inspect needs a file");

  const network = parsed.values.network;
  if (network !== undefined && network !== "mainnet" && network !== "testnet") {
    throw new ProblemError("usage", `--network must be mainnet or testnet, not "${network}"`);
  }
  return { command, file, inputs, ...(network === undefined ? {} : { network }) };
}
