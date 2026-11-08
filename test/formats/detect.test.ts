import { describe, expect, it } from "vitest";
import { detectFormat } from "../../src/formats/detect.js";
import { COMMENT_PATHS, MAINNET_PATH, readFixtureText } from "../helpers/fixtures.js";

describe("detectFormat", () => {
  it("recognizes the deploy info file", () => {
    expect(detectFormat(readFixtureText(MAINNET_PATH))).toBe("ckb-cli-deploy");
  });

  it("recognizes each pasted comment as sign-txs output", () => {
    for (const path of COMMENT_PATHS) expect(detectFormat(readFixtureText(path))).toBe("sign-txs");
  });

  it("recognizes sign-txs JSON output", () => {
    expect(detectFormat('{"cell_tx_signatures":{},"dep_group_tx_signatures":{}}')).toBe("sign-txs");
  });

  it("recognizes nothing else", () => {
    expect(detectFormat('{"transaction":{}}')).toBeUndefined();
    expect(detectFormat("just some text")).toBeUndefined();
    expect(detectFormat("")).toBeUndefined();
  });
});
