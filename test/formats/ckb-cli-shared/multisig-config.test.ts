import { describe, expect, it } from "vitest";
import { addressFromScript } from "../../../src/ckb/addresses.js";
import { MULTISIG_DEPLOYMENTS } from "../../../src/ckb/deployments.js";
import { readReprMultisigConfig } from "../../../src/formats/ckb-cli-shared/multisig-config.js";
import { readMainnetJson } from "../../helpers/fixtures.js";

const repr = readMainnetJson()["deployment"].multisig_config;

describe("readReprMultisigConfig", () => {
  it("reads the #34 config with its members in order", () => {
    const read = readReprMultisigConfig(repr, "multisig_config");
    expect(read?.config.members.map((member) => member.address)).toEqual(repr.sighash_addresses);
    expect(read?.config.members[1]?.keyHash).toBe("0x5cf028300e33eef47429c9cfcb1d53e7a537e4e1");
  });

  it("treats ckb-cli's default config, with no addresses, as no config", () => {
    expect(readReprMultisigConfig({ lock_code_hash: `0x${"00".repeat(32)}`, sighash_addresses: [], require_first_n: 0, threshold: 0 }, "c")).toBeUndefined();
    expect(readReprMultisigConfig(undefined, "c")).toBeUndefined();
  });

  it("leaves the code hash out when the file doesn't name one", () => {
    const { lock_code_hash: _omitted, ...rest } = repr;
    expect(readReprMultisigConfig(rest, "c")?.config.declaredCodeHash).toBeUndefined();
  });

  it("refuses a member address that isn't a single-key lock", () => {
    const multisigAddress = addressFromScript(
      { codeHash: MULTISIG_DEPLOYMENTS.v2.codeHash.mainnet, hashType: "data1", args: `0x${"11".repeat(20)}` },
      "ckb",
    );
    expect(() => readReprMultisigConfig({ ...repr, sighash_addresses: [multisigAddress] }, "c")).toThrow(/isn't a single-key/);
  });

  it("refuses a threshold that isn't a byte", () => {
    expect(() => readReprMultisigConfig({ ...repr, threshold: 300 }, "c")).toThrow(/c.threshold isn't a number from 0 to 255/);
  });
});
