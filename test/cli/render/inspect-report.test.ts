import { describe, expect, it } from "vitest";
import { renderInspectionReport } from "../../../src/cli/render/inspect-report.js";
import { runPipeline } from "../../../src/commands/pipeline.js";
import { MAINNET_PATH, readFixtureText, readMainnetJson } from "../../helpers/fixtures.js";

describe("renderInspectionReport", () => {
  it("shows what is still missing when the threshold isn't met", async () => {
    const report = await runPipeline({ path: MAINNET_PATH, text: readFixtureText(MAINNET_PATH) }, []);
    const lines = renderInspectionReport(report).split("\n");
    expect(lines).toContain("status    1 of 3 valid, 2 more needed; not signed yet:");
    expect(lines.filter((line) => /^ {10}member [1345], ckb1/.test(line))).toHaveLength(4);
    expect(lines).toContain("inputs    none");
    expect(lines).toContain("summary   not ready: 1 of 2 lock groups still need signatures");
  });

  it("names a missing first-R member", async () => {
    const report = await runPipeline({ path: MAINNET_PATH, text: readFixtureText(MAINNET_PATH) }, []);
    const [tx] = report.transactions;
    const [multisig, sighash] = tx?.groups ?? [];
    if (tx === undefined || multisig === undefined || sighash === undefined) throw new Error("expected two lock groups");
    // The #34 lock has R = 0, so a missing first-R member is shown on an edited status.
    const status = { ...multisig.status, thresholdMet: true, firstRPresent: false, missingFirstR: [0], canFinalize: false };
    const edited = { ...report, transactions: [{ ...tx, groups: [{ ...multisig, status }, sighash] }] };
    const text = renderInspectionReport(edited);
    expect(text).toContain("1 valid, 3 needed, but a first-R member is missing");
    expect(text).toContain("first-R member ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq0m2fr3ygwszxa77l5r7utgku85wyqvjac5wppfj has not signed");
  });

  it("explains a signature that recovers to a non-member", async () => {
    const json = readMainnetJson();
    const output = json["cell_tx"].outputs[1];
    output.capacity = `0x${(BigInt(output.capacity) - 1n).toString(16)}`;
    const text = renderInspectionReport(await runPipeline({ path: "changed.json", text: JSON.stringify(json) }, []));
    expect(text).toMatch(/signature not valid for this transaction: it recovers to 0x[0-9a-f]{40}, which isn't a member/);
    expect(text).toMatch(/signature signed a different transaction: it recovers to 0x[0-9a-f]{40}, not the owner 0x5cf028300e33eef47429c9cfcb1d53e7a537e4e1/);
    expect(text).toContain("not found among the keys of used_input_txs");
  });
});
