import type { ccc } from "@ckb-ccc/core";
import type { Network } from "../model/partial-tx.js";
import { ProblemError } from "../model/problem.js";
import { SUPPORTED_DEPLOYMENTS } from "./deployments.js";

const NETWORKS: readonly Network[] = ["mainnet", "testnet"];

/** CKB address prefixes: `ckb` on mainnet and `ckt` on testnet. */
export function networkFromAddressPrefix(prefix: string): Network | undefined {
  if (prefix === "ckb") return "mainnet";
  if (prefix === "ckt") return "testnet";
  return undefined;
}

export function addressPrefix(network: Network): string {
  return network === "mainnet" ? "ckb" : "ckt";
}

/** The networks whose known dep group cells appear among the transactions' cell deps. */
function networksFromCellDeps(transactions: readonly ccc.Transaction[]): Set<Network> {
  const found = new Set<Network>();
  for (const tx of transactions) {
    for (const dep of tx.cellDeps) {
      for (const network of NETWORKS) {
        const known = SUPPORTED_DEPLOYMENTS.some(
          (deployment) =>
            deployment.cellDep[network].txHash === dep.outPoint.txHash &&
            BigInt(deployment.cellDep[network].index) === dep.outPoint.index,
        );
        if (known) found.add(network);
      }
    }
  }
  return found;
}

export interface NetworkChoice {
  readonly network: Network;
  /** What decided the network, for the report. */
  readonly source: string;
}

export interface NetworkEvidence {
  readonly addressPrefixes: readonly string[];
  readonly transactions: readonly ccc.Transaction[];
  readonly option?: Network;
}

function single(networks: Set<Network>, what: string): Network | undefined {
  if (networks.size > 1) throw new ProblemError("unreadable", `the file mixes mainnet and testnet ${what}`);
  return [...networks][0];
}

/**
 * Decides the network, in this order: the address prefixes in the file, then the
 * transactions' cell deps, then the `--network` option. An option that contradicts
 * the file is a usage error.
 */
export function detectNetwork(evidence: NetworkEvidence): NetworkChoice {
  const prefixes = new Set<Network>();
  for (const prefix of evidence.addressPrefixes) {
    const network = networkFromAddressPrefix(prefix);
    if (network === undefined) throw new ProblemError("unreadable", `unknown address prefix "${prefix}"`);
    prefixes.add(network);
  }
  const fromPrefixes = single(prefixes, "addresses");
  const fromCellDeps = fromPrefixes === undefined ? single(networksFromCellDeps(evidence.transactions), "cell deps") : undefined;
  const detected: NetworkChoice | undefined =
    fromPrefixes !== undefined
      ? { network: fromPrefixes, source: "the multisig config addresses" }
      : fromCellDeps !== undefined
        ? { network: fromCellDeps, source: "the cell deps" }
        : undefined;

  if (detected !== undefined) {
    if (evidence.option !== undefined && evidence.option !== detected.network) {
      throw new ProblemError("usage", `the file is for ${detected.network} (from ${detected.source}), but --network says ${evidence.option}`);
    }
    return detected;
  }
  if (evidence.option !== undefined) return { network: evidence.option, source: "--network" };
  throw new ProblemError("usage", "can't tell the network from the file; pass --network mainnet or --network testnet");
}
