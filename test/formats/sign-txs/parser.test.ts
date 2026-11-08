import { describe, expect, it } from "vitest";
import { parseSignTxs } from "../../../src/formats/sign-txs/parser.js";
import { COMMENT_PATHS, readFixtureText } from "../../helpers/fixtures.js";

const ARGS = "0x66712ae36e89b0e796155d004bebe2540ee7dfc9";

// The signatures posted in fiber-scripts PR #34, comments 1 to 4.
const POSTED = [
  "0xeaa91c624b013d97220d6d1d8d510e24bb57f75ce0abc455cb9e9c0a1b147e55662bba67be48f77a56c91c7cc5756a0bee3588e6e264384d35b8e8447c7e311101",
  "0x83c83b2f9d7a4e5204a630aa9b7ae11eec0400e4b1f798e80c9f18878ca27f5d28d8fde5a3310f4b9675d9eea8725ac5a1bca7013667317c156ce335029b7e9a00",
  "0x12232ba21a3baac9de88b033570bcbbd811963f6ac74ea2f25eb842ca7a3c82935204d002002a3bfba13de356bed2a41d01ee9ba47f6135d638db3fe956912d700",
  "0xda8e7db8e3f4acd66806ecbdfa0ccee5bdb8eb81b619652708076d8859f43a7242bba83a24b75d650f1158982186b7e28c5304df87638a590e513fed50fe962600",
];

const SIG = POSTED[0] as string;
const OTHER_ARGS = "0x5cf028300e33eef47429c9cfcb1d53e7a537e4e1";

/** The four comment shapes, rebuilt with a given line ending. */
function shapes(eol: string): string[] {
  return [
    ["signed: ", "cell_tx_signatures:", `  ${ARGS}: ${SIG}`].join(eol),
    ["signed:", "cell_tx_signatures:", `${ARGS}: ${SIG}`].join(eol),
    ["```yaml", "cell_tx_signatures:", `  ${ARGS}: ${SIG}`, "```"].join(eol),
    ["```yaml", "cell_tx_signatures:", `  ${ARGS}: ${SIG}`, "```", ""].join(eol),
  ];
}

function asMap(text: string): Record<string, Record<string, string>> {
  const output = parseSignTxs(text);
  const map: Record<string, Record<string, string>> = {};
  for (const section of output.sections) map[section] = {};
  for (const entry of output.entries) (map[entry.section] as Record<string, string>)[entry.lockArgs] = entry.signature;
  return map;
}

describe("parseSignTxs", () => {
  it.each(COMMENT_PATHS.map((path, i) => [i + 1, path, POSTED[i]] as const))(
    "reads PR #34 comment %i",
    (_n, path, signature) => {
      const output = parseSignTxs(readFixtureText(path));
      expect(output.problems).toEqual([]);
      expect(asMap(readFixtureText(path))).toEqual({ cell_tx_signatures: { [ARGS]: signature } });
    },
  );

  it.each([
    ["CRLF", "\r\n"],
    ["LF", "\n"],
  ])("reads all four comment shapes with %s line endings", (_name, eol) => {
    for (const text of shapes(eol)) {
      expect(parseSignTxs(text).problems).toEqual([]);
      expect(asMap(text)).toEqual({ cell_tx_signatures: { [ARGS]: SIG } });
    }
  });

  it("reads JSON output", () => {
    const text = JSON.stringify({ cell_tx_signatures: { [ARGS]: SIG }, dep_group_tx_signatures: {} }, null, 2);
    const output = parseSignTxs(text);
    expect(output.shape).toBe("json");
    expect(output.problems).toEqual([]);
    expect(asMap(text)).toEqual({ cell_tx_signatures: { [ARGS]: SIG }, dep_group_tx_signatures: {} });
  });

  it("reads JSON output inside a code fence", () => {
    const text = ["```json", JSON.stringify({ cell_tx_signatures: { [ARGS]: SIG } }), "```"].join("\n");
    expect(asMap(text)).toEqual({ cell_tx_signatures: { [ARGS]: SIG } });
  });

  it("strips ANSI colour codes", () => {
    const text = `\u001b[1m\u001b[32mcell_tx_signatures\u001b[0m:\n  \u001b[33m${ARGS}\u001b[0m: \u001b[36m${SIG}\u001b[0m\n`;
    expect(parseSignTxs(text).problems).toEqual([]);
    expect(asMap(text)).toEqual({ cell_tx_signatures: { [ARGS]: SIG } });
  });

  it("reads both sections in one block", () => {
    const text = ["cell_tx_signatures:", `  ${ARGS}: ${SIG}`, "dep_group_tx_signatures:", `  ${OTHER_ARGS}: ${POSTED[1]}`].join("\n");
    expect(asMap(text)).toEqual({
      cell_tx_signatures: { [ARGS]: SIG },
      dep_group_tx_signatures: { [OTHER_ARGS]: POSTED[1] },
    });
  });

  it("reads an empty section written inline", () => {
    const text = ["cell_tx_signatures:", `  ${ARGS}: ${SIG}`, "dep_group_tx_signatures: {}"].join("\n");
    expect(asMap(text)).toEqual({ cell_tx_signatures: { [ARGS]: SIG }, dep_group_tx_signatures: {} });
  });

  it("reads 28-byte lock args", () => {
    const args = `${ARGS}0000000000000000`;
    expect(asMap(`cell_tx_signatures:\n  ${args}: ${SIG}`)).toEqual({ cell_tx_signatures: { [args]: SIG } });
  });

  it("reports a malformed line with its line number instead of dropping it", () => {
    const text = ["signed:", "cell_tx_signatures:", `  ${ARGS}: 0x1234`, "  not a signature", `  ${OTHER_ARGS}: ${SIG}`].join("\r\n");
    const output = parseSignTxs(text);
    expect(output.entries).toEqual([{ section: "cell_tx_signatures", lockArgs: OTHER_ARGS, signature: SIG, line: 5 }]);
    expect(output.problems).toEqual([
      { line: 3, text: `${ARGS}: 0x1234`, reason: "the signature is 2 bytes; expected 65" },
      { line: 4, text: "not a signature", reason: "not a `0x<lock args>: 0x<signature>` line" },
    ]);
  });

  it("reports a signature line outside any section", () => {
    const output = parseSignTxs(`${ARGS}: ${SIG}`);
    expect(output.entries).toEqual([]);
    expect(output.problems).toHaveLength(1);
    expect(output.problems[0]?.line).toBe(1);
  });

  it("reports lock args of the wrong length", () => {
    const output = parseSignTxs(`cell_tx_signatures:\n  0x1234: ${SIG}`);
    expect(output.problems[0]?.reason).toBe("the lock args are 2 bytes; expected 20, or 28 with a since");
  });

  it("reports bad JSON values", () => {
    const text = JSON.stringify({ cell_tx_signatures: { [ARGS]: 5, "0x12": SIG }, extra: {} });
    const output = parseSignTxs(text);
    expect(output.entries).toEqual([]);
    expect(output.problems.map((problem) => problem.text)).toEqual([`cell_tx_signatures.${ARGS}`, "cell_tx_signatures.0x12", "extra"]);
  });

  it("finds no section in unrelated text", () => {
    expect(parseSignTxs("hello\nworld").sections).toEqual([]);
  });
});
