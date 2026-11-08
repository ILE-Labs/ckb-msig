import { describe, expect, it } from "vitest";
import { MULTISIG_DEPLOYMENTS, SIGHASH } from "../../src/ckb/deployments.js";
import { classifyLock } from "../../src/ckb/lock-classifier.js";

const ARGS20 = `0x${"ab".repeat(20)}`;
const ARGS28 = `0x${"ab".repeat(28)}`;

describe("classifyLock", () => {
  it("knows the single-key lock", () => {
    expect(classifyLock({ codeHash: SIGHASH.codeHash.mainnet, hashType: "type", args: ARGS20 }, "mainnet")).toEqual({ kind: "sighash" });
  });

  it.each(["genesis", "2024", "v2"] as const)("knows the %s multisig deployment on both networks", (deployment) => {
    const info = MULTISIG_DEPLOYMENTS[deployment];
    for (const network of ["mainnet", "testnet"] as const) {
      expect(classifyLock({ codeHash: info.codeHash[network], hashType: info.hashType, args: ARGS20 }, network)).toEqual({ kind: "multisig", deployment });
    }
  });

  it("refuses 28-byte multisig args as time-locked", () => {
    const v2 = MULTISIG_DEPLOYMENTS.v2;
    expect(classifyLock({ codeHash: v2.codeHash.mainnet, hashType: "data1", args: ARGS28 }, "mainnet")).toEqual({
      kind: "unsupported",
      reason: "time-locked multisig (lock args carry a since)",
    });
  });

  it("refuses the right code hash with the wrong hash type", () => {
    const v2 = MULTISIG_DEPLOYMENTS.v2;
    expect(classifyLock({ codeHash: v2.codeHash.mainnet, hashType: "type", args: ARGS20 }, "mainnet").kind).toBe("unsupported");
  });

  it("refuses the testnet 2024 code hash on mainnet", () => {
    const beta = MULTISIG_DEPLOYMENTS["2024"];
    expect(classifyLock({ codeHash: beta.codeHash.testnet, hashType: "type", args: ARGS20 }, "mainnet").kind).toBe("unsupported");
  });

  it("names an unknown lock's code hash and hash type", () => {
    const codeHash = `0x${"11".repeat(32)}`;
    expect(classifyLock({ codeHash, hashType: "type", args: ARGS20 }, "mainnet")).toEqual({
      kind: "unsupported",
      reason: `code hash ${codeHash}, hash type type`,
    });
  });

  it("refuses single-key args that aren't 20 bytes", () => {
    expect(classifyLock({ codeHash: SIGHASH.codeHash.mainnet, hashType: "type", args: ARGS28 }, "mainnet").kind).toBe("unsupported");
  });
});
