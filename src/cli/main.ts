#!/usr/bin/env node
import { inspect } from "../commands/inspect.js";
import { parseCommandLine, USAGE } from "./args.js";
import { describeFailure } from "./errors.js";
import { renderInspectionReport } from "./render/inspect-report.js";
import { readPackageVersion } from "./version.js";

async function main(argv: readonly string[]): Promise<number> {
  try {
    const command = parseCommandLine(argv);
    if (command.command === "help") {
      process.stdout.write(`${USAGE}\n`);
      return 0;
    }
    if (command.command === "version") {
      process.stdout.write(`${readPackageVersion()}\n`);
      return 0;
    }
    const options = command.network === undefined ? {} : { network: command.network };
    const report = await inspect(command.file, command.inputs, options);
    process.stdout.write(renderInspectionReport(report));
    return 0;
  } catch (error) {
    const failure = describeFailure(error);
    process.stderr.write(`ckb-msig: ${failure.message}\n${failure.showUsage ? `${USAGE}\n` : ""}`);
    return failure.exitCode;
  }
}

process.exitCode = await main(process.argv.slice(2));
