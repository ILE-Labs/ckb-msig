import { describe, expect, it } from "vitest";
import { buildMultisigConfig } from "../../src/ckb/multisig-script.js";
import { readReprMultisigConfig } from "../../src/formats/ckb-cli-shared/multisig-config.js";
import { readMainnetJson } from "../helpers/fixtures.js";

describe("buildMultisigConfig", () => {
  const json = readMainnetJson();
  const input = readReprMultisigConfig(json["deployment"].multisig_config, "multisig_config")?.config;
  if (input === undefined) throw new Error("the #34 file has a multisig config");

  it("hashes the #34 config to the lock args of its multisig input", () => {
    expect(buildMultisigConfig(input).args).toBe("0x66712ae36e89b0e796155d004bebe2540ee7dfc9");
  });

  it("encodes the same script the #34 multisig witness starts with", () => {
    const { script } = buildMultisigConfig(input);
    // The witness is a WitnessArgs: a 16-byte table header, a 4-byte length, then the lock.
    const lock = `0x${(json["cell_tx"].witnesses[0] as string).slice(2 + 40)}`;
    expect(script).toBe(lock.slice(0, 2 + 2 * (4 + 20 * 5)));
    expect(script.slice(0, 10)).toBe("0x00000305");
  });

  it("refuses a config that breaks the script rules", () => {
    expect(() => buildMultisigConfig({ ...input, threshold: 6 })).toThrow(/threshold 6 must be between 1 and the 5 members/);
    expect(() => buildMultisigConfig({ ...input, requireFirstN: 4 })).toThrow(/require_first_n 4 must be between 0 and the threshold 3/);
  });
});
