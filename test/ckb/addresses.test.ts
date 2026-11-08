import { describe, expect, it } from "vitest";
import { addressFromScript, scriptFromFullAddress } from "../../src/ckb/addresses.js";
import { SIGHASH } from "../../src/ckb/deployments.js";
import { readMainnetJson } from "../helpers/fixtures.js";

const ADDRESSES: string[] = readMainnetJson()["deployment"].multisig_config.sighash_addresses;

describe("addresses", () => {
  it("decodes the #34 member addresses to single-key scripts and their key hashes", () => {
    const decoded = ADDRESSES.map(scriptFromFullAddress);
    expect(decoded.map((entry) => entry.prefix)).toEqual(Array(5).fill("ckb"));
    for (const { script } of decoded) {
      expect(script.codeHash).toBe(SIGHASH.codeHash.mainnet);
      expect(script.hashType).toBe("type");
    }
    expect(decoded.map(({ script }) => script.args)).toEqual([
      "0xfb52471221d011bbef7e83f7168b70f47100c977",
      "0x5cf028300e33eef47429c9cfcb1d53e7a537e4e1",
      "0x871dfe24b25f52a5746a5e7d7462f7460de2c638",
      "0xdaddc38a7f03be3bdbc85e3592f2987489292a5e",
      "0x36a50bd159a7e79c1f0bcca9407b3bcb2a740e9d",
    ]);
  });

  it("encodes the same scripts back to the same addresses", () => {
    for (const address of ADDRESSES) {
      expect(addressFromScript(scriptFromFullAddress(address).script, "ckb")).toBe(address);
    }
  });

  it("refuses text that isn't an address", () => {
    expect(() => scriptFromFullAddress("ckb1notanaddress")).toThrow(/isn't a valid CKB address/);
  });
});
