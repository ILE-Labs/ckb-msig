import { describe, expect, it } from "vitest";
import { addressPrefix, detectNetwork, networkFromAddressPrefix } from "../../src/ckb/network.js";
import { transactionFromRpcJson } from "../../src/ckb/rpc-json.js";
import { readMainnetJson } from "../helpers/fixtures.js";

const cellTx = transactionFromRpcJson(readMainnetJson()["cell_tx"], "cell_tx");

describe("network detection", () => {
  it("maps address prefixes both ways", () => {
    expect(networkFromAddressPrefix("ckb")).toBe("mainnet");
    expect(networkFromAddressPrefix("ckt")).toBe("testnet");
    expect(networkFromAddressPrefix("xyz")).toBeUndefined();
    expect(addressPrefix("mainnet")).toBe("ckb");
    expect(addressPrefix("testnet")).toBe("ckt");
  });

  it("prefers the address prefixes", () => {
    expect(detectNetwork({ addressPrefixes: ["ckb"], transactions: [cellTx] })).toEqual({ network: "mainnet", source: "the multisig config addresses" });
  });

  it("falls back to the cell deps", () => {
    expect(detectNetwork({ addressPrefixes: [], transactions: [cellTx] })).toEqual({ network: "mainnet", source: "the cell deps" });
  });

  it("falls back to the option, and asks for it when nothing else decides", () => {
    expect(detectNetwork({ addressPrefixes: [], transactions: [], option: "testnet" })).toEqual({ network: "testnet", source: "--network" });
    expect(() => detectNetwork({ addressPrefixes: [], transactions: [] })).toThrow(/pass --network/);
  });

  it("refuses mixed prefixes and an option that contradicts the file", () => {
    expect(() => detectNetwork({ addressPrefixes: ["ckb", "ckt"], transactions: [] })).toThrow(/mixes mainnet and testnet addresses/);
    expect(() => detectNetwork({ addressPrefixes: ["ckb"], transactions: [], option: "testnet" })).toThrow(/but --network says testnet/);
  });
});
