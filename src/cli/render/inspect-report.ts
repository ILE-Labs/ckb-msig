import type { LockGroup } from "../../model/lock-group.js";
import type { GroupReport, InspectionReport, SignatureResult, TransactionReport } from "../../model/report.js";

const LABEL_WIDTH = 10;

/** The label on the first line; later lines are indented under the value. */
function block(label: string, values: readonly string[]): string[] {
  return values.map((value, index) => `${(index === 0 ? label : "").padEnd(LABEL_WIDTH)}${value}`);
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function memberLabel(group: LockGroup, index: number): string {
  if (group.kind === "sighash") return "the owner";
  const member = group.config.members[index];
  return `member ${index + 1}${member === undefined ? "" : `, ${member.keyHash}`}`;
}

function verdictLine(result: SignatureResult, group: LockGroup | undefined): string {
  const { verdict, memberIndex, recoveredKeyHash, detail } = result;
  if (detail !== undefined) return `${verdict}: ${detail}`;
  if (group === undefined) return verdict;
  if (verdict === "valid") return `valid: ${memberLabel(group, memberIndex ?? 0)}`;
  if (verdict === "duplicate") return `duplicate: ${memberLabel(group, memberIndex ?? 0)} is already counted`;
  if (verdict === "signed a different transaction" && group.kind === "sighash") {
    return `${verdict}: it recovers to ${recoveredKeyHash}, not the owner ${group.ownerKeyHash}`;
  }
  if (recoveredKeyHash !== undefined) return `${verdict}: it recovers to ${recoveredKeyHash}, which isn't a member`;
  return verdict;
}

function signatureLines(result: SignatureResult, group: LockGroup | undefined): string[] {
  const { file, location } = result.signature.origin;
  return block("signature", [verdictLine(result, group), `from ${file}, ${location}`]);
}

function lockLines(group: LockGroup): string[] {
  const script = `code hash ${group.script.codeHash}, hash type ${group.script.hashType}`;
  const lines =
    group.kind === "multisig"
      ? [
          ...block("lock", [
            `multisig ${group.config.threshold}-of-${group.config.members.length}, first ${group.config.requireFirstN} must sign (${group.deployment} deployment)`,
            script,
          ]),
          ...block("args", [group.script.args]),
          ...block(
            "members",
            group.config.members.map((member, index) => `${index + 1}  ${member.keyHash}  ${member.address}`),
          ),
        ]
      : [
          ...block("lock", ["single key (secp256k1_blake160_sighash_all)", script]),
          ...block("args", [group.script.args]),
          ...block("owner", [group.ownerAddress]),
        ];
  return [...lines, ...block(group.inputIndexes.length === 1 ? "input" : "inputs", [group.inputIndexes.join(", ")])];
}

function statusLines(report: GroupReport): string[] {
  const { group, status } = report;
  if (group.kind === "sighash") {
    return block("status", [status.canFinalize ? "signed: 1 valid signature" : `not signed: needs a valid signature from ${group.ownerAddress}`]);
  }
  const valid = status.validMembers.length;
  const address = (index: number): string => group.config.members[index]?.address ?? `member ${index + 1}`;
  if (status.canFinalize) {
    return block("status", [`threshold met: ${valid} valid, ${status.needed} needed (finalize picks ${status.needed})`]);
  }
  const lines = status.thresholdMet
    ? [`${valid} valid, ${status.needed} needed, but a first-R member is missing`]
    : [`${valid} of ${status.needed} valid, ${status.needed - valid} more needed; not signed yet:`, ...status.missingMembers.map((index) => `member ${index + 1}, ${address(index)}`)];
  lines.push(...status.missingFirstR.map((index) => `first-R member ${address(index)} has not signed`));
  return block("status", lines);
}

function groupLines(report: GroupReport): string[] {
  return [
    "",
    ...lockLines(report.group),
    ...report.notes.flatMap((note) => block("note", [note])),
    ...report.results.flatMap((result) => signatureLines(result, report.group)),
    ...(report.results.length === 0 ? block("signature", ["none"]) : []),
    ...statusLines(report),
  ];
}

function transactionLines(report: TransactionReport, embeddedLabel: string): string[] {
  const listed = report.listedUnderOwnHash
    ? `matches its own key in ${embeddedLabel}`
    : `not found among the keys of ${embeddedLabel}`;
  return [
    "",
    ...block("tx", [report.name]),
    ...block("tx hash", [report.hash, listed]),
    ...block("cells", [
      `${plural(report.inputs.length, "input")}, cells from ${embeddedLabel}`,
      ...report.inputs.map((input) => `input ${input.index}: ${input.previousTxHash} #${input.previousIndex}`),
    ]),
    ...report.groups.flatMap(groupLines),
  ];
}

function summaryLine(report: InspectionReport): string {
  const groups = report.transactions.flatMap((tx) => tx.groups);
  const waiting = groups.filter((group) => !group.status.canFinalize).length;
  return waiting === 0
    ? `ready: all ${plural(groups.length, "lock group")} have enough valid signatures`
    : `not ready: ${waiting} of ${plural(groups.length, "lock group")} still need signatures`;
}

/** Renders an inspection report as plain terminal text. */
export function renderInspectionReport(report: InspectionReport): string {
  const held = report.transactions.map((tx) => tx.name).join(" and ");
  const absent = report.absentTransactions.length === 0 ? "" : `; no ${report.absentTransactions.join(" or ")}`;
  const lines = [
    ...block("file", [report.path]),
    ...block("format", [report.formatLabel]),
    ...block("holds", [`${held || "no transaction"}${absent}`]),
    ...block("network", [`${report.network} (from ${report.networkSource})`]),
    ...block(
      "inputs",
      report.inputs.length === 0
        ? ["none"]
        : report.inputs.flatMap((input) => [
            `${input.path}: ${input.formatLabel}, ${plural(input.signatureCount, "signature")}`,
            ...input.problems.map((problem) => `  not read: ${problem}`),
          ]),
    ),
    ...report.transactions.flatMap((tx) => transactionLines(tx, report.embeddedLabel)),
  ];
  if (report.unmatched.length > 0) {
    lines.push("", ...block("unmatched", [`${plural(report.unmatched.length, "signature")} match no lock group`]));
    lines.push(...report.unmatched.flatMap((result) => signatureLines(result, undefined)));
  }
  lines.push("", ...block("summary", [summaryLine(report)]));
  return `${lines.join("\n")}\n`;
}
