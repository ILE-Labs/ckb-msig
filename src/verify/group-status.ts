import type { LockGroup } from "../model/lock-group.js";
import type { GroupStatus, SignatureResult } from "../model/report.js";
import { checkLockRules } from "./lock-rules.js";

/** The group's members in order. A single-key group has one member: its owner. */
export function groupMembers(group: LockGroup): readonly string[] {
  return group.kind === "multisig" ? group.config.members.map((member) => member.keyHash) : [group.ownerKeyHash];
}

/** Summarizes a group from its signature verdicts. */
export function groupStatus(group: LockGroup, results: readonly SignatureResult[]): GroupStatus {
  const members = groupMembers(group);
  const validSigners: string[] = [];
  for (const result of results) {
    if (result.verdict !== "valid" || result.memberIndex === undefined) continue;
    const keyHash = members[result.memberIndex];
    if (keyHash !== undefined) validSigners.push(keyHash);
  }
  const rules =
    group.kind === "multisig"
      ? { members, requireFirstN: group.config.requireFirstN, threshold: group.config.threshold }
      : { members, requireFirstN: 0, threshold: 1 };
  const outcome = checkLockRules(rules, validSigners);
  return {
    needed: rules.threshold,
    validMembers: outcome.signed,
    missingMembers: outcome.missing,
    missingFirstR: outcome.missingFirstR,
    thresholdMet: outcome.thresholdMet,
    firstRPresent: outcome.firstRPresent,
    canFinalize: outcome.complete,
  };
}
