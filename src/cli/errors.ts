import { ProblemError, type ProblemKind } from "../model/problem.js";

/** Exit codes: 0 the command did its job, 1 the work can't be done as asked, 2 bad usage or input. */
export function exitCodeFor(kind: ProblemKind): 1 | 2 {
  return kind === "unsupported" ? 1 : 2;
}

export interface Failure {
  readonly message: string;
  readonly exitCode: 1 | 2;
  readonly showUsage: boolean;
}

/** What to tell the user when a command stops. An unexpected error keeps its stack trace. */
export function describeFailure(error: unknown): Failure {
  if (error instanceof ProblemError) {
    return { message: error.message, exitCode: exitCodeFor(error.kind), showUsage: error.kind === "usage" };
  }
  const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
  return { message: `internal error: ${detail}`, exitCode: 1, showUsage: false };
}
