# ckb-msig

Check, merge and convert CKB multisig signatures between ckb-cli, Neuron and CCC.

ckb-msig is a command-line tool and GitHub Action for teams that sign together on [Nervos CKB](https://www.nervos.org). You give it a partly signed multisig transaction in whatever format it arrives in. It does four things:
- tells you which signatures are valid for that exact transaction;
- tells you who still has to sign;
- merges what you've collected;
- writes a file that the next wallet, or the chain, accepts.

It never holds keys and never signs.

> **Status:** early development. Nothing is published yet. The commands below describe the planned interface for v0.1.0 and may change.

## Table of Contents

- [Security](#security)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [How it works](#how-it-works)
- [Supported formats](#supported-formats)
- [Supported multisig scripts](#supported-multisig-scripts)
- [Limitations](#limitations)
- [Roadmap](#roadmap)
- [Related projects](#related-projects)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Security

- **No keys:** ckb-msig never asks for, reads or stores private keys, and it never signs. Signing stays in your wallet: ckb-cli, Neuron or an app built on CCC.
- **Every signature is checked** against the transaction hash and the multisig's members. It's reported and never merged if it isn't valid for this transaction, or if it repeats a key that has already signed. When a file names the signer, the report says which: made on a different transaction, or from a key that isn't a member.
- **`convert` is designed never to change the transaction itself.** Its output keeps the input's transaction hash.
- **Before you sign,** review the transaction in your own wallet. Compare the transaction hash that `ckb-msig inspect` prints with your co-signers.
- **To report a vulnerability,** please use GitHub's private vulnerability reporting for this repository, not a public issue.

## Background

On CKB, a multisig is a lock script:
- **The multisig script** is `S | R | M | N | blake160(pubkey_1) … blake160(pubkey_N)`.
  - M is the threshold.
  - R is the number of keys at the front of the list that must sign.
- **Its lock args** are the blake160 hash of that script.
- **To unlock it,** the witness carries the same script followed by exactly M 65-byte signatures.

Three wallets can sign for a CKB multisig, and each keeps a half-signed transaction its own way (see [Supported formats](#supported-formats)). When signers use different wallets, someone has to collect the signatures by hand from chat, files or pull request comments. They check them by eye, then edit the file until it holds exactly M signatures, because that's what `ckb-cli` requires before it will send. In file-based workflows, nothing checks a signature until the node rejects the transaction.

There are also three multisig lock deployments in use, and not every wallet can sign for every one (see [Supported multisig scripts](#supported-multisig-scripts)).

## Install

Not on npm yet. Once v0.1.0 is released:

```sh
npm install --global ckb-msig
```

Or run it without installing:

```sh
npx ckb-msig --help
```

**Requirements:**
- Node.js 22 or later.
- Most files can be checked offline. ckb-cli transaction files and bare CCC transactions need a CKB node's RPC endpoint, because they don't carry the input cells.

## Usage

### CLI

| Command | What it does |
|---|---|
| `ckb-msig inspect <file> [inputs…]` | Detects the format and shows the multisig: members, threshold, the first-R rule and which lock deployment it uses. Also checks signatures from other files or pasted `ckb-cli deploy sign-txs` output, without changing anything. Gives every signature a verdict: valid, duplicate, or not valid for this transaction. When the file names the signer, it says whether the signature was made on a different transaction or by a key that isn't a member. Ends with what's still missing |
| `ckb-msig add <file> <inputs…>` | Merges signatures from other files, or from pasted `ckb-cli deploy sign-txs` output, checking each one |
| `ckb-msig convert <file> --to <format>` | Writes the same transaction and its valid signatures for `ckb-cli`, `ckb-cli-deploy`, `neuron` or `ccc` |
| `ckb-msig finalize <file> [--send <rpc>]` | Picks exactly M valid signatures that satisfy the first-R rule, builds the witness and writes a transaction ready to send. `--send` broadcasts it |
| `ckb-msig guide <file>` | Writes a Markdown note for signers. It covers what the transaction moves, which cells change in a script upgrade, and the command to sign it in each wallet |

**Inspect a file.** Illustrative output:

```console
$ ckb-msig inspect payout.json
format    Neuron offline JSON (PartiallySigned)
tx hash   0x4e0f…c2a1
lock      multisig 2-of-3, first 0 must sign (genesis deployment)
          ckb1qzda…3ka2  valid
          ckb1qzda…9gpd  signed a different transaction
          ckb1qzda…x7tz  not signed
status    1 of 2 valid, 1 more needed
```

**Collect signatures from signers who use different wallets:**

```sh
# Signer 1 built the transaction in Neuron and exported payout.json.
# Signer 2 uses ckb-cli:
ckb-msig convert payout.json --to ckb-cli > payout.cli.json
# ...signer 2 signs payout.cli.json in ckb-cli and sends it back...
ckb-msig add payout.json payout.cli.json
ckb-msig finalize payout.json --send http://127.0.0.1:8114
```

**Script upgrades with `ckb-cli deploy`.** Each signer runs `ckb-cli deploy sign-txs` and shares the printed output. `add` reads that output as it is, and `finalize` trims the info file to exactly M valid signatures, so it can be applied with `ckb-cli deploy apply-txs` as usual:

```sh
ckb-msig add info.json signer-a.txt signer-b.txt signer-c.txt
ckb-msig inspect info.json
ckb-msig finalize info.json
```

### GitHub Action

The Action runs on pull requests that carry a `ckb-cli deploy` info file. It:
- reads the `sign-txs` output signers paste in comments;
- checks each signature;
- keeps one status comment up to date, for example "3 of 5 valid";
- attaches the merged file once the threshold is met.

A workflow example will come with the first release.

## How it works

- **Readers** turn each format into one model:
  - the transaction;
  - its input cells, when the file carries them;
  - the multisig configs;
  - the signatures, by signer.
- **The verifier** handles each multisig lock group in turn:
  - It rebuilds the signing message: the transaction hash plus the group's witnesses, with the signature bytes zeroed.
  - It recovers the public key behind each signature and matches its blake160 hash against the members.
  - It applies the lock's own rules: exactly M signatures, each key once, and the first R keys present.
- **Writers** produce each format again. `finalize` chooses exactly M valid signatures.
- **It's built on [`@ckb-ccc/core`](https://github.com/ckb-devrel/ccc)** for transaction hashing, the multisig witness codec, the known multisig scripts and their cell deps, and secp256k1 key recovery.
- **Files in, files out.** ckb-msig doesn't care how files travel between signers, whether that's chat, email, pull requests or a relay.

## Supported formats

| Format | Written by | Where the signatures live | Checked offline |
|---|---|---|---|
| ckb-cli transaction file | `ckb-cli tx init`, `sign-inputs`, `add-signature` | Beside the transaction in `signatures`, keyed by lock arg. The configs are in `multisig_configs` | No. Input locks need one RPC call |
| ckb-cli deploy info file | `ckb-cli deploy gen-txs`, `sign-txs` | `cell_tx_signatures` and `dep_group_tx_signatures`, keyed by lock arg | Yes, from `used_input_txs` |
| Neuron offline JSON | Neuron's multisig Export | Signature bytes in the witness. The signers' key hashes are in `transaction.signatures` | Yes, from `context` |
| CCC transaction (JSON from `ccc.stringify`) | Apps built on CCC | In the witness only | No. Input locks need one RPC call |

`ckb-cli deploy sign-txs` prints one signature per lock arg, but the info file stores a list. ckb-msig accepts both.

## Supported multisig scripts

| Deployment | Code hash | Hash type | Wallets that can sign |
|---|---|---|---|
| Genesis | `0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8` | `type` | ckb-cli, Neuron, CCC |
| 2024 fix (`Secp256k1MultisigV2Beta` in CCC) | mainnet `0xd1a9f877aed3f5e07cb9c52b61ab96d06f250ae6883cc7f0a2423db0976fc821`<br>testnet `0x765b3ed6ae264b335d07e73ac332bf2c0f38f8d3340ed521cb447b4c42dd5f09` | `type` | CCC |
| v2 | `0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29` | `data1` | ckb-cli (its default), Neuron, CCC |

All three use the same witness layout, so ckb-msig can verify and merge signatures for each of them.

## Limitations

- **A signature is tied to one exact transaction.** Any change to the transaction, its fee or the group's witnesses voids every signature collected so far. ckb-msig detects this but can't repair it.
- **ckb-msig doesn't sign.** For the 2024 deployment, signatures have to come from a wallet that supports it, such as an app built on CCC.
- **Lock types:** ckb-msig checks multisig inputs and ordinary single-key (`secp256k1_blake160_sighash_all`) inputs in the same transaction. An input under any other lock, such as Omnilock, JoyID or anyone-can-pay, is refused with a message naming the lock.
- **Not supported yet:** time-locked multisig (lock args with a `since` value) and CoBuild building packets.

## Roadmap

- **v0.1.0:**
  - the five commands
  - the four formats
  - the three deployments
  - the GitHub Action
  - test fixtures made with each wallet on testnet
- **Later:**
  - shared signing sessions over a relay or peer-to-peer transport
  - notifications
  - time-locked multisig
  - other lock types next to multisig, starting with Omnilock's multisig mode, then JoyID and anyone-can-pay
  - a review view for script upgrades

## Related projects

- [ckb-cli](https://github.com/nervosnetwork/ckb-cli): a command-line wallet and deployment tool.
- [Neuron](https://github.com/nervosnetwork/neuron): a desktop wallet with multisig addresses.
- [CCC](https://github.com/ckb-devrel/ccc): a TypeScript SDK. ckb-msig builds on its multisig signers and witness codec.
- [ckb-system-scripts](https://github.com/nervosnetwork/ckb-system-scripts): the multisig lock script itself.
- [ckb-multisig-cobuild-poc](https://github.com/cryptape/ckb-multisig-cobuild-poc): an earlier browser proof of concept that collects multisig signatures through CoBuild building packets.

## Maintainers

[@steven3002](https://github.com/steven3002)

## Contributing

Issues and pull requests are welcome.

If you sign for a CKB multisig and your workflow isn't covered, open an issue describing the wallets and steps you use. Testnet files that show a format or an edge case help the most. Partly signed files don't contain private keys, but never paste keys or mnemonics anywhere.

## License

[MIT](LICENSE) © Steven Hert
