# Evidence of demand: multisig signature coordination on CKB

This branch collects public evidence that people who sign together on Nervos CKB need a better way to collect, check and merge multisig signatures. It holds sources, quotes and measured timings, not code.

> **This branch is never merged.** It's an orphan branch: it shares no history with `main`, so it can't be merged into it, and it doesn't need to be. It exists so that anyone can check each claim against its source.

## Summary

- **47 sources:**
  - 43 from the CKB ecosystem, by 32 people and teams;
  - 4 from Bitcoin and Ethereum.
- **Seven kinds of evidence:**
  - requests;
  - complaints;
  - manual work, with times measured;
  - code written to work around the gap;
  - holders of multisig funds;
  - an earlier attempt at a coordinator;
  - other ecosystems.
- **Signing flows take days or weeks:**
  - A Community Fund DAO payout took 14 days to complete its 2-of-3 multisig.
  - A Fiber contract upgrade reached its 3-of-5 threshold within 2 hours of the request, but it still wasn't on chain 6 days later.
  - An earlier Fiber upgrade landed 22 days after it was prepared.
- **The wallets don't agree:**
  - ckb-cli, Neuron and CCC each store a partly signed transaction differently.
  - ckb-cli only accepts exactly the threshold number of signatures.
  - Three multisig lock deployments are in use. The 2024 one holds about 120M CKB, and neither ckb-cli nor Neuron can sign for it.
- **Who asks:**
  - core developers;
  - the DevRel lead;
  - the Spark committee and the DAO, which both pay grants from multisig wallets;
  - Fiber's contract maintainers;
  - teams that built their own workarounds.

## Files

| File | What it holds |
|---|---|
| [sources.md](sources.md) | All 47 sources, grouped by kind, each with a link, date, author, short verbatim quote and what it shows |
| [timings.md](timings.md) | Four multisig signing flows timed from public records |
| [formats.md](formats.md) | How ckb-cli, Neuron and CCC store a partly signed multisig transaction, and the three multisig deployments, with links to the source code |

## Method

- **What we searched:**
  - Nervos Talk;
  - GitHub issues, pull requests and code across CKB repositories: nervosnetwork, ckb-devrel, ckb-js, cryptape, Magickbase and community projects;
  - the Bitcoin and Ethereum projects listed in sources.md.
- **Quotes** are copied from the linked source and were checked word for word against it on 2026-11-08. Translations from Chinese are marked as translations.
- **Timings** come from GitHub timestamps and the CKB explorer.
- **Technical facts** were read in the source code at the commits linked in formats.md.

## Limits

- **Timings show how long each flow took, not why.** Some waits span the December holidays, and one upgrade may be held on purpose.
- **Reddit** couldn't be read (HTTP 403).
- **No earlier grant proposal** for a multisig coordinator was found on Nervos Talk. The closest earlier work is a 2024 proof of concept (sources.md, row 4).

Compiled on 8 November 2026.
