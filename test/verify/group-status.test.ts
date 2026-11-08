import { describe, expect, it } from "vitest";
import type { LockGroup } from "../../src/model/lock-group.js";
import type { SignatureResult, Verdict } from "../../src/model/report.js";
import { groupMembers, groupStatus } from "../../src/verify/group-status.js";

const key = (byte: string): string => `0x${byte.repeat(20)}`;
const origin = { file: "f", location: "l" };

function result(verdict: Verdict, memberIndex?: number): SignatureResult {
  const signature = { bytes: "0x", txName: "cell_tx", lockArgs: key("ff"), origin };
  return { signature, verdict, ...(memberIndex === undefined ? {} : { memberIndex }) };
}

// Only the fields the summary reads are filled in.
const multisig = {
  kind: "multisig",
  config: { requireFirstN: 1, threshold: 2, members: [key("aa"), key("bb"), key("cc")].map((keyHash) => ({ keyHash, address: keyHash })) },
} as unknown as LockGroup;
const sighash = { kind: "sighash", ownerKeyHash: key("aa") } as unknown as LockGroup;

describe("groupStatus", () => {
  it("lists a multisig group's members and counts only valid signatures", () => {
    expect(groupMembers(multisig)).toEqual([key("aa"), key("bb"), key("cc")]);
    const status = groupStatus(multisig, [result("valid", 1), result("duplicate", 1), result("not valid for this transaction")]);
    expect(status).toMatchObject({ needed: 2, validMembers: [1], missingMembers: [0, 2], missingFirstR: [0], thresholdMet: false, canFinalize: false });
  });

  it("needs the first R members", () => {
    expect(groupStatus(multisig, [result("valid", 1), result("valid", 2)])).toMatchObject({ thresholdMet: true, firstRPresent: false, canFinalize: false });
    expect(groupStatus(multisig, [result("valid", 0), result("valid", 2)]).canFinalize).toBe(true);
  });

  it("treats a single-key group as one member who must sign", () => {
    expect(groupMembers(sighash)).toEqual([key("aa")]);
    expect(groupStatus(sighash, [result("valid", 0)])).toMatchObject({ needed: 1, canFinalize: true });
    expect(groupStatus(sighash, [result("signed a different transaction")])).toMatchObject({ missingMembers: [0], canFinalize: false });
  });
});
