import { multisigDeploymentName } from "../ckb/deployments.js";
import { checkEmbeddedTransactions } from "../ckb/embedded-check.js";
import { resolveEmbeddedInputs } from "../ckb/input-resolver.js";
import { groupInputs } from "../ckb/lock-groups.js";
import { detectNetwork } from "../ckb/network.js";
import { offlineClient, type RequestListener } from "../ckb/offline-client.js";
import { readDeployInfo } from "../formats/ckb-cli-deploy/reader.js";
import { detectFormat } from "../formats/detect.js";
import { FORMAT_LABELS, type FormatName, type TransactionReader } from "../formats/format.js";
import { parseSignTxs } from "../formats/sign-txs/parser.js";
import { signTxsSignatures } from "../formats/sign-txs/signatures.js";
import type { LockGroup } from "../model/lock-group.js";
import type { Network, PartialTx } from "../model/partial-tx.js";
import { ProblemError } from "../model/problem.js";
import type { InputReport, InspectionReport, SignatureResult, TransactionReport } from "../model/report.js";
import type { CollectedSignature } from "../model/signature.js";
import type { SourceDocument, SourceTransaction } from "../model/source-document.js";
import { groupStatus } from "../verify/group-status.js";
import { checkSignatures } from "../verify/signature-check.js";

/** A file's path, as given, and its text. */
export interface LoadedFile {
  readonly path: string;
  readonly text: string;
}

export interface PipelineOptions {
  readonly network?: Network;
  /** Told the method of any node request the offline client refuses. */
  readonly onNetworkRequest?: RequestListener;
}

const READERS: Readonly<Partial<Record<FormatName, TransactionReader>>> = {
  "ckb-cli-deploy": readDeployInfo,
};

function detect(file: LoadedFile): FormatName {
  const format = detectFormat(file.text);
  if (format === undefined) throw new ProblemError("unreadable", `${file.path}: unrecognized file format`);
  return format;
}

function readTransactionFile(file: LoadedFile, format: FormatName): SourceDocument {
  const reader = READERS[format];
  if (reader === undefined) {
    throw new ProblemError("usage", `${file.path} is ${FORMAT_LABELS[format]}, which holds no transaction; give it after the file it signs`);
  }
  const document = reader(file.text, file.path);
  checkEmbeddedTransactions(document);
  return document;
}

function buildPartialTx(source: SourceTransaction, document: SourceDocument, network: Network): PartialTx {
  const resolved = resolveEmbeddedInputs(source.tx, document.embeddedTransactions, document.embeddedLabel);
  const groups = groupInputs(resolved.inputs, network, document.multisigConfigs, source.name);
  return { name: source.name, tx: resolved.tx, hash: source.hash, network, inputs: resolved.inputs, groups };
}

/** An extra input: pasted `sign-txs` output, or another file that holds the same transaction. */
function readExtraInput(file: LoadedFile, base: SourceDocument): { signatures: CollectedSignature[]; report: InputReport } {
  const format = detect(file);
  const formatLabel = FORMAT_LABELS[format];
  if (format === "sign-txs") {
    const output = parseSignTxs(file.text);
    const signatures = signTxsSignatures(output, file.path);
    const problems = output.problems.map((p) => `${p.line === undefined ? "" : `line ${p.line}: `}${p.text}: ${p.reason}`);
    return { signatures, report: { path: file.path, formatLabel, signatureCount: signatures.length, problems } };
  }

  const document = readTransactionFile(file, format);
  const signatures: CollectedSignature[] = [];
  const problems: string[] = [];
  for (const tx of document.transactions) {
    const own = document.signatures.filter((signature) => signature.txName === tx.name);
    const match = base.transactions.find((candidate) => candidate.hash === tx.hash);
    if (match === undefined) {
      problems.push(`different transaction: ${tx.name} is ${tx.hash}, which ${base.path} doesn't hold; ${own.length} signatures not checked`);
      continue;
    }
    signatures.push(...own.map((signature) => ({ ...signature, txName: match.name })));
  }
  const held = new Set(document.transactions.map((tx) => tx.name));
  const orphans = document.signatures.filter((signature) => !held.has(signature.txName));
  if (orphans.length > 0) {
    const names = [...new Set(orphans.map((signature) => signature.txName))].join(", ");
    problems.push(`${orphans.length} signatures for ${names}, which this file doesn't hold, not checked`);
  }
  return { signatures, report: { path: file.path, formatLabel, signatureCount: signatures.length, problems } };
}

function groupNotes(group: LockGroup, network: Network): string[] {
  if (group.kind !== "multisig") return [];
  const declared = group.config.declaredCodeHash;
  if (declared === undefined || declared === group.script.codeHash) return [];
  const declaredName = multisigDeploymentName(declared, network);
  const names = declaredName === undefined ? "no known multisig deployment" : `the ${declaredName} deployment`;
  return [
    `the multisig config's lock_code_hash ${declared} names ${names}, but the input lock is the ${group.deployment} deployment. ` +
      "ckb-cli matches configs to inputs by lock args only, so this field doesn't affect signing.",
  ];
}

/**
 * The shared verification steps: read the base file and each extra input, detect the
 * network, resolve input cells, group and classify locks, build multisig configs, compute
 * signing messages, recover keys, give verdicts and summarize each group.
 */
export async function runPipeline(base: LoadedFile, extras: readonly LoadedFile[], options: PipelineOptions = {}): Promise<InspectionReport> {
  const document = readTransactionFile(base, detect(base));
  const { network, source } = detectNetwork({
    addressPrefixes: document.addressPrefixes,
    transactions: document.transactions.map((tx) => tx.tx),
    ...(options.network === undefined ? {} : { option: options.network }),
  });
  const partials = document.transactions.map((tx) => buildPartialTx(tx, document, network));

  const collected: CollectedSignature[] = [...document.signatures];
  const inputs: InputReport[] = [];
  for (const extra of extras) {
    const read = readExtraInput(extra, document);
    collected.push(...read.signatures);
    inputs.push(read.report);
  }

  const client = offlineClient(network, options.onNetworkRequest);
  const transactions: TransactionReport[] = [];
  const unmatched: SignatureResult[] = [];
  for (const partial of partials) {
    const checked = await checkSignatures(partial, collected, client);
    unmatched.push(...checked.unmatched);
    transactions.push({
      name: partial.name,
      hash: partial.hash,
      listedUnderOwnHash: document.embeddedTransactions.has(partial.hash),
      inputs: partial.inputs,
      groups: checked.groups.map(({ group, results }) => ({
        group,
        results,
        status: groupStatus(group, results),
        notes: groupNotes(group, network),
      })),
    });
  }
  const held = new Set(partials.map((partial) => partial.name));
  for (const signature of collected) {
    if (!held.has(signature.txName)) {
      unmatched.push({ signature, verdict: "not valid for this transaction", detail: `${base.path} has no ${signature.txName}` });
    }
  }

  return {
    path: base.path,
    formatLabel: FORMAT_LABELS[document.format as FormatName],
    network,
    networkSource: source,
    embeddedLabel: document.embeddedLabel,
    transactions,
    absentTransactions: document.absentTransactions,
    inputs,
    unmatched,
  };
}
