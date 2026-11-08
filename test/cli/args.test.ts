import { describe, expect, it } from "vitest";
import { parseCommandLine } from "../../src/cli/args.js";

describe("parseCommandLine", () => {
  it("reads inspect with a file, inputs and a network", () => {
    expect(parseCommandLine(["inspect", "info.json", "a.txt", "-", "--network", "testnet"])).toEqual({
      command: "inspect",
      file: "info.json",
      inputs: ["a.txt", "-"],
      network: "testnet",
    });
  });

  it("leaves the network out when it isn't given", () => {
    expect(parseCommandLine(["inspect", "info.json"])).toEqual({ command: "inspect", file: "info.json", inputs: [] });
  });

  it.each([[[]], [["add", "x"]], [["inspect"]], [["inspect", "x", "--unknown"]], [["inspect", "x", "--network", "devnet"]]])(
    "refuses %j as bad usage",
    (argv) => {
      expect(() => parseCommandLine(argv)).toThrow(expect.objectContaining({ kind: "usage" }));
    },
  );
});
