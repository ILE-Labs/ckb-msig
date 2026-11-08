import { describe, expect, it } from "vitest";
import { describeFailure, exitCodeFor } from "../../src/cli/errors.js";
import { ProblemError } from "../../src/model/problem.js";

describe("exit codes", () => {
  it("gives 1 when the work can't be done and 2 for bad usage or input", () => {
    expect(exitCodeFor("unsupported")).toBe(1);
    expect(exitCodeFor("usage")).toBe(2);
    expect(exitCodeFor("unreadable")).toBe(2);
  });

  it("shows usage only for usage errors", () => {
    expect(describeFailure(new ProblemError("usage", "no command given"))).toEqual({ message: "no command given", exitCode: 2, showUsage: true });
    expect(describeFailure(new ProblemError("unsupported", "x"))).toEqual({ message: "x", exitCode: 1, showUsage: false });
  });

  it("reports an unexpected error as internal", () => {
    expect(describeFailure(new TypeError("boom"))).toMatchObject({ exitCode: 1, showUsage: false });
    expect(describeFailure(new TypeError("boom")).message).toMatch(/^internal error: TypeError: boom/);
  });
});
