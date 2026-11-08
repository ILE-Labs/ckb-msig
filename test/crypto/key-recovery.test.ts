import { describe, expect, it } from "vitest";
import { recoverKeyHash } from "../../src/crypto/key-recovery.js";

const MESSAGE = `0x${"42".repeat(32)}`;

describe("recoverKeyHash", () => {
  it("gives a 20-byte key hash for a well-formed signature", () => {
    // Any r and s below the curve order with recovery id 0 recovers to some key.
    const signature = `0x${"01".repeat(32)}${"02".repeat(32)}00`;
    expect(recoverKeyHash(MESSAGE, signature)).toMatch(/^0x[0-9a-f]{40}$/);
  });

  it("gives undefined for a signature that isn't 65 bytes", () => {
    expect(recoverKeyHash(MESSAGE, `0x${"01".repeat(64)}`)).toBeUndefined();
    expect(recoverKeyHash(MESSAGE, "not hex")).toBeUndefined();
  });

  it("gives undefined when no key can be recovered", () => {
    expect(recoverKeyHash(MESSAGE, `0x${"00".repeat(65)}`)).toBeUndefined();
    expect(recoverKeyHash(MESSAGE, `0x${"01".repeat(64)}ff`)).toBeUndefined();
  });
});
