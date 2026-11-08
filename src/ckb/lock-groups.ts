import type { LockGroup } from "../model/lock-group.js";
import type { MultisigConfig, MultisigConfigInput } from "../model/multisig-config.js";
import type { Network, ResolvedInput } from "../model/partial-tx.js";
import { ProblemError } from "../model/problem.js";
import { addressFromScript } from "./addresses.js";
import { classifyLock } from "./lock-classifier.js";
import { buildMultisigConfig } from "./multisig-script.js";
import { addressPrefix } from "./network.js";

interface InputsByLock {
  readonly script: ResolvedInput["lock"];
  readonly first: number;
  readonly inputIndexes: number[];
}

function configFor(args: string, configs: readonly MultisigConfig[], txName: string): MultisigConfig {
  if (configs.length === 0) {
    throw new ProblemError("unsupported", `${txName}: the file has no multisig config for lock args ${args}`);
  }
  const match = configs.find((config) => config.args === args);
  if (match === undefined) {
    const hashes = configs.map((config) => config.args).join(", ");
    throw new ProblemError("unsupported", `${txName}: multisig config doesn't match lock args ${args}: the config's script hashes to ${hashes}`);
  }
  return match;
}

/**
 * Groups the inputs by their full lock script (code hash, hash type and args), since the
 * chain runs each lock once per group, and classifies each group. Refuses the transaction
 * when a lock is unsupported or a multisig group has no matching config.
 */
export function groupInputs(
  inputs: readonly ResolvedInput[],
  network: Network,
  configInputs: readonly MultisigConfigInput[],
  txName: string,
): LockGroup[] {
  const byLock: InputsByLock[] = [];
  for (const input of inputs) {
    const group = byLock.find((candidate) => candidate.script.eq(input.lock));
    if (group === undefined) byLock.push({ script: input.lock, first: input.index, inputIndexes: [input.index] });
    else group.inputIndexes.push(input.index);
  }

  const configs = configInputs.map(buildMultisigConfig);
  return byLock.map(({ script, first, inputIndexes }): LockGroup => {
    const lockClass = classifyLock(script, network);
    switch (lockClass.kind) {
      case "unsupported":
        throw new ProblemError("unsupported", `${txName} input ${first}: unsupported lock: ${lockClass.reason}`);
      case "sighash":
        return {
          kind: "sighash",
          script,
          inputIndexes,
          firstWitnessIndex: first,
          ownerKeyHash: script.args,
          ownerAddress: addressFromScript(script, addressPrefix(network)),
        };
      case "multisig":
        return {
          kind: "multisig",
          script,
          inputIndexes,
          firstWitnessIndex: first,
          deployment: lockClass.deployment,
          config: configFor(script.args, configs, txName),
        };
    }
  });
}
