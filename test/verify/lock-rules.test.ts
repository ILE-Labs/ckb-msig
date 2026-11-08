import { describe, expect, it } from "vitest";
import { checkLockRules } from "../../src/verify/lock-rules.js";

const key = (byte: string): string => `0x${byte.repeat(20)}`;
const [A, B, C, D] = [key("aa"), key("bb"), key("cc"), key("dd")] as [string, string, string, string];
const members = [A, B, C];

describe("checkLockRules", () => {
  describe("R = 0, M = 2 of 3", () => {
    const config = { members, requireFirstN: 0, threshold: 2 };

    it("is incomplete with fewer than M", () => {
      const result = checkLockRules(config, [C]);
      expect(result).toMatchObject({ signed: [2], missing: [0, 1], thresholdMet: false, firstRPresent: true, complete: false });
    });

    it("is complete with exactly M, in any order", () => {
      expect(checkLockRules(config, [C, A])).toMatchObject({ signed: [2, 0], missing: [1], complete: true });
    });

    it("is complete with more than M", () => {
      expect(checkLockRules(config, [A, B, C])).toMatchObject({ signed: [0, 1, 2], missing: [], complete: true });
    });

    it("is complete with no signatures needed from the first members", () => {
      expect(checkLockRules(config, [B, C]).missingFirstR).toEqual([]);
    });
  });

  describe("R = 1, M = 2 of 3", () => {
    const config = { members, requireFirstN: 1, threshold: 2 };

    it("needs the first member even when M others signed", () => {
      const result = checkLockRules(config, [B, C]);
      expect(result).toMatchObject({ thresholdMet: true, firstRPresent: false, missingFirstR: [0], complete: false });
    });

    it("is complete when the first member is among M", () => {
      expect(checkLockRules(config, [C, A])).toMatchObject({ firstRPresent: true, complete: true });
    });
  });

  describe("R = M = 2 of 3", () => {
    const config = { members, requireFirstN: 2, threshold: 2 };

    it("is complete only with both first members", () => {
      expect(checkLockRules(config, [A, B]).complete).toBe(true);
    });

    it("reports each missing first-R member", () => {
      expect(checkLockRules(config, [C])).toMatchObject({ missingFirstR: [0, 1], thresholdMet: false, complete: false });
      expect(checkLockRules(config, [A, C])).toMatchObject({ missingFirstR: [1], thresholdMet: true, complete: false });
    });

    it("is complete with more than M when the first R are there", () => {
      expect(checkLockRules(config, [C, B, A]).complete).toBe(true);
    });
  });

  it("counts a duplicate key once", () => {
    const result = checkLockRules({ members, requireFirstN: 0, threshold: 2 }, [A, A]);
    expect(result).toMatchObject({ signed: [0], duplicates: [0], thresholdMet: false, complete: false });
  });

  it("lists keys that aren't members and doesn't count them", () => {
    const result = checkLockRules({ members, requireFirstN: 0, threshold: 1 }, [D]);
    expect(result).toMatchObject({ signed: [], nonMembers: [D], complete: false });
  });

  it("treats a 1-of-1 group like a single key", () => {
    expect(checkLockRules({ members: [A], requireFirstN: 0, threshold: 1 }, [A]).complete).toBe(true);
    expect(checkLockRules({ members: [A], requireFirstN: 0, threshold: 1 }, []).missing).toEqual([0]);
  });
});
