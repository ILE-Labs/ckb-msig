/**
 * Why a command stopped:
 * - `usage`: the command line is wrong or incomplete;
 * - `unreadable`: a file can't be read or isn't in a known format;
 * - `unsupported`: the transaction can't be handled as asked, for example an unsupported lock.
 */
export type ProblemKind = "usage" | "unreadable" | "unsupported";

/** The error a command stops with. Its message is a plain sentence for the user. */
export class ProblemError extends Error {
  readonly kind: ProblemKind;

  constructor(kind: ProblemKind, message: string) {
    super(message);
    this.name = "ProblemError";
    this.kind = kind;
  }
}
