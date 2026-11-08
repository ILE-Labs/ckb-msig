import { describe, expect, it, vi } from "vitest";
import { offlineClient } from "../../src/ckb/offline-client.js";

describe("offlineClient", () => {
  it.each(["mainnet", "testnet"] as const)("refuses a node request on %s and reports it", async (network) => {
    const onRequest = vi.fn();
    const client = offlineClient(network, onRequest);
    await expect(client.getTip()).rejects.toThrow();
    expect(onRequest).toHaveBeenCalled();
    expect(typeof onRequest.mock.calls[0]?.[0]).toBe("string");
  });

  it("uses the network's address prefix", () => {
    expect(offlineClient("mainnet").addressPrefix).toBe("ckb");
    expect(offlineClient("testnet").addressPrefix).toBe("ckt");
  });
});
