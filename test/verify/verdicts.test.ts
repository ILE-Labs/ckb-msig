import { describe, expect, it } from "vitest";
import { judgeSignature } from "../../src/verify/verdicts.js";

const key = (byte: string): string => `0x${byte.repeat(20)}`;
const [A, B, X] = [key("aa"), key("bb"), key("ee")] as [string, string, string];
const members = [A, B];

describe("judgeSignature", () => {
  describe("when the file doesn't name the signer", () => {
    it("gives valid, then duplicate for the same member", () => {
      const counted = new Set<number>();
      expect(judgeSignature({ recoveredKeyHash: B, namedSigner: undefined, members }, counted)).toEqual({ verdict: "valid", memberIndex: 1 });
      expect(judgeSignature({ recoveredKeyHash: B, namedSigner: undefined, members }, counted)).toEqual({ verdict: "duplicate", memberIndex: 1 });
    });

    it("gives one combined verdict for a non-member key or a failed recovery", () => {
      const counted = new Set<number>();
      expect(judgeSignature({ recoveredKeyHash: X, namedSigner: undefined, members }, counted).verdict).toBe("not valid for this transaction");
      expect(judgeSignature({ recoveredKeyHash: undefined, namedSigner: undefined, members }, counted).verdict).toBe("not valid for this transaction");
      expect(counted.size).toBe(0);
    });
  });

  describe("when the file names the signer", () => {
    it("gives not a member for a named key outside the group", () => {
      expect(judgeSignature({ recoveredKeyHash: X, namedSigner: X, members }, new Set()).verdict).toBe("not a member");
    });

    it("gives signed a different transaction when the recovered key differs", () => {
      expect(judgeSignature({ recoveredKeyHash: X, namedSigner: A, members }, new Set()).verdict).toBe("signed a different transaction");
    });

    it("gives valid, then duplicate, when the keys match", () => {
      const counted = new Set<number>();
      expect(judgeSignature({ recoveredKeyHash: A, namedSigner: A, members }, counted)).toEqual({ verdict: "valid", memberIndex: 0 });
      expect(judgeSignature({ recoveredKeyHash: A, namedSigner: A, members }, counted)).toEqual({ verdict: "duplicate", memberIndex: 0 });
    });

    it("gives not valid for this transaction when recovery fails", () => {
      expect(judgeSignature({ recoveredKeyHash: undefined, namedSigner: A, members }, new Set()).verdict).toBe("not valid for this transaction");
    });
  });
});
