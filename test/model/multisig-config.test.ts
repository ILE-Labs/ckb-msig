import { describe, expect, it } from "vitest";
import { multisigConfigProblem } from "../../src/model/multisig-config.js";

const member = (byte: string) => ({ keyHash: `0x${byte.repeat(20)}`, address: `member-${byte}` });
const members = [member("aa"), member("bb"), member("cc")];

describe("multisigConfigProblem", () => {
  it("accepts R <= M <= N", () => {
    expect(multisigConfigProblem({ requireFirstN: 0, threshold: 2, members })).toBeUndefined();
    expect(multisigConfigProblem({ requireFirstN: 2, threshold: 2, members })).toBeUndefined();
    expect(multisigConfigProblem({ requireFirstN: 3, threshold: 3, members })).toBeUndefined();
  });

  it("refuses each broken rule", () => {
    expect(multisigConfigProblem({ requireFirstN: 0, threshold: 1, members: [] })).toBe("the multisig config has no members");
    expect(multisigConfigProblem({ requireFirstN: 0, threshold: 0, members })).toMatch(/threshold 0/);
    expect(multisigConfigProblem({ requireFirstN: 0, threshold: 4, members })).toMatch(/threshold 4/);
    expect(multisigConfigProblem({ requireFirstN: 3, threshold: 2, members })).toMatch(/require_first_n 3/);
    expect(multisigConfigProblem({ requireFirstN: 0, threshold: 1, members: [{ keyHash: "0x12", address: "short" }] })).toMatch(/short doesn't have a 20-byte key hash/);
  });
});
