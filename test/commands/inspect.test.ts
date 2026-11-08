import { describe, expect, it, vi } from "vitest";
import { inspect } from "../../src/commands/inspect.js";
import type { InspectionReport } from "../../src/model/report.js";
import { COMMENT_PATHS, MAINNET_PATH } from "../helpers/fixtures.js";

const MULTISIG_ARGS = "0x66712ae36e89b0e796155d004bebe2540ee7dfc9";
const SIGHASH_ARGS = "0x5cf028300e33eef47429c9cfcb1d53e7a537e4e1";

// What the real run proved (fiber-scripts #34 at 026027f): who made each signature.
const EXPECTED_MULTISIG = [
  { file: MAINNET_PATH, member: 1, keyHash: "0x5cf028300e33eef47429c9cfcb1d53e7a537e4e1" },
  { file: COMMENT_PATHS[0], member: 2, keyHash: "0x871dfe24b25f52a5746a5e7d7462f7460de2c638" },
  { file: COMMENT_PATHS[1], member: 4, keyHash: "0x36a50bd159a7e79c1f0bcca9407b3bcb2a740e9d" },
  { file: COMMENT_PATHS[2], member: 0, keyHash: "0xfb52471221d011bbef7e83f7168b70f47100c977" },
  { file: COMMENT_PATHS[3], member: 3, keyHash: "0xdaddc38a7f03be3bdbc85e3592f2987489292a5e" },
];

async function inspectReal(onNetworkRequest?: (method: string) => void): Promise<InspectionReport> {
  return inspect(MAINNET_PATH, COMMENT_PATHS, onNetworkRequest === undefined ? {} : { onNetworkRequest });
}

describe("inspect on fiber-scripts #34 and its four comments", () => {
  it("reads the file, the network and the transaction hash", async () => {
    const report = await inspectReal();
    expect(report.formatLabel).toBe("ckb-cli deploy info file");
    expect(report.absentTransactions).toEqual(["dep_group_tx"]);
    expect(report.network).toBe("mainnet");
    expect(report.transactions).toHaveLength(1);
    const [tx] = report.transactions;
    expect(tx?.name).toBe("cell_tx");
    expect(tx?.hash).toBe("0x4396de69818bd88b7fce64797ccec25d1294912d56846432f29fd192120992ee");
    expect(tx?.listedUnderOwnHash).toBe(true);
    expect(tx?.inputs.map((input) => [input.previousIndex, input.source])).toEqual([
      [2, "embedded"],
      [3, "embedded"],
    ]);
  });

  it("finds the v2 multisig group and the single-key group", async () => {
    const [tx] = (await inspectReal()).transactions;
    const [multisig, sighash] = tx?.groups ?? [];
    expect(multisig?.group).toMatchObject({ kind: "multisig", deployment: "v2", inputIndexes: [0], firstWitnessIndex: 0 });
    expect(multisig?.group.script.args).toBe(MULTISIG_ARGS);
    expect(multisig?.group.script.hashType).toBe("data1");
    if (multisig?.group.kind !== "multisig") throw new Error("expected a multisig group");
    expect(multisig.group.config).toMatchObject({ requireFirstN: 0, threshold: 3 });
    expect(multisig.group.config.members.map((member) => member.keyHash)).toEqual([
      "0xfb52471221d011bbef7e83f7168b70f47100c977",
      "0x5cf028300e33eef47429c9cfcb1d53e7a537e4e1",
      "0x871dfe24b25f52a5746a5e7d7462f7460de2c638",
      "0xdaddc38a7f03be3bdbc85e3592f2987489292a5e",
      "0x36a50bd159a7e79c1f0bcca9407b3bcb2a740e9d",
    ]);
    expect(multisig.notes).toHaveLength(1);
    expect(multisig.notes[0]).toContain("names the genesis deployment, but the input lock is the v2 deployment");
    expect(sighash?.group).toMatchObject({ kind: "sighash", ownerKeyHash: SIGHASH_ARGS, inputIndexes: [1], firstWitnessIndex: 1 });
  });

  it("gives every signature its verdict and member", async () => {
    const [tx] = (await inspectReal()).transactions;
    const [multisig, sighash] = tx?.groups ?? [];
    expect(
      multisig?.results.map((result) => ({
        file: result.signature.origin.file,
        member: result.memberIndex,
        keyHash: result.recoveredKeyHash,
        verdict: result.verdict,
      })),
    ).toEqual(EXPECTED_MULTISIG.map((expected) => ({ ...expected, verdict: "valid" })));
    expect(multisig?.status).toMatchObject({ needed: 3, thresholdMet: true, firstRPresent: true, canFinalize: true });
    expect(multisig?.status.validMembers).toHaveLength(5);

    expect(sighash?.results).toHaveLength(1);
    expect(sighash?.results[0]).toMatchObject({ verdict: "valid", memberIndex: 0, recoveredKeyHash: SIGHASH_ARGS });
    expect(sighash?.results[0]?.signature.origin).toEqual({ file: MAINNET_PATH, location: "cell_tx_signatures" });
    expect(sighash?.status.canFinalize).toBe(true);
  });

  it("never contacts a node: the client's transport refuses every call and is never called", async () => {
    const onNetworkRequest = vi.fn();
    const report = await inspectReal(onNetworkRequest);
    expect(onNetworkRequest).not.toHaveBeenCalled();
    expect(report.transactions[0]?.groups.flatMap((group) => group.results).every((result) => result.verdict === "valid")).toBe(true);
  });

  it("rejects two standard-input arguments", async () => {
    await expect(inspect("-", ["-"])).rejects.toMatchObject({ kind: "usage" });
  });

  it("reports an unreadable file", async () => {
    await expect(inspect(`${MAINNET_PATH}.missing`, [])).rejects.toMatchObject({ kind: "unreadable" });
  });
});
