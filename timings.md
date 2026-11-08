# Timings

Four multisig signing flows, timed from public records: GitHub timestamps and the CKB explorer.

| Flow | Asked or started | Threshold reached | Last signature | On chain | Records |
|---|---|---|---|---|---|
| Fiber contracts v0.7.0 mainnet upgrade, 3-of-5, multisig v2 | 2026-11-02 07:22 UTC: PR opened with the maintainer's own signature in the file | 09:13 UTC, third signer (+1 h 51 min) | 2026-11-03 14:08 UTC, fifth signer (+30 h 46 min) | **Not yet.** On 2026-11-08, both inputs of the PR's transaction (outputs 2 and 3 of [`0x95006eee…b9d6`](https://explorer.nervos.org/transaction/0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6)) were still live, and the PR was an open draft | [fiber-scripts #34](https://github.com/nervosnetwork/fiber-scripts/pull/34) |
| Community Fund DAO payout to Pocket Node iOS, $2,500, 2-of-3, genesis multisig | 2026-08-21, started by one committee member | Not recorded | Not recorded | **2026-09-04 08:50 UTC, 14 days later** (block 20,354,743) | [t/10583/20](https://talk.nervos.org/t/10583/20), [tx `0x63a7f3a5…baa4`](https://explorer.nervos.org/transaction/0x63a7f3a52fc91c52939186ca9c1064238ccdfe498d3398f25707537f591bbaa4) |
| Fiber contracts v0.6.0 mainnet upgrade, 3-of-5, multisig v2 | First prepared 2025-12-12 03:13 UTC; prepared again 2025-12-23 02:35 UTC | Not on GitHub; the PRs have no comments | Not on GitHub | **2026-01-14 03:03 UTC** (block 18,372,567): 33 days after the first preparation, 22 days after the second | [#25](https://github.com/nervosnetwork/fiber-scripts/pull/25), [#27](https://github.com/nervosnetwork/fiber-scripts/pull/27), [#28](https://github.com/nervosnetwork/fiber-scripts/pull/28), [tx `0x95006eee…b9d6`](https://explorer.nervos.org/transaction/0x95006eee7b4c0c8ad66e0514c88ed0ae43fc8db27793427de86a348ec720b9d6) |
| nostr-binding mainnet redeploy to new multisig signers | 2025-12-24, PR "Prepare multisig upgrade deployment" | Not on GitHub | Not on GitHub | By 2026-01-14 (#51: "has been taking effect"), about 21 days | [#50](https://github.com/nervosnetwork/nostr-binding/pull/50), [#51](https://github.com/nervosnetwork/nostr-binding/pull/51) |

## What the records show

- **The signing itself was quick.** In both Fiber upgrades and the DAO payout, the signing was quick or simple.
- **One person did the rest by hand:**
  - gathering signatures from comments or chat;
  - putting exactly the threshold number into one file;
  - broadcasting.
- **Nothing in the current tools says "the threshold is met and this transaction is ready".**

## How often

- fiber-scripts alone has had four mainnet multisig deployments in 20 months: 2025-02-28, 2025-04-14 and 2026-01-14, with v0.7.0 pending.
- Every Spark grant and every Community Fund DAO grant is paid from a multisig ([sources.md](sources.md), rows 1, 5, 6, 7 and 29).

## Limits

These timings don't show why each wait was long. The December waits span the holidays, and the v0.7.0 upgrade may be held on purpose.
