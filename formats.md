# How CKB wallets store a partly signed multisig transaction

Everything here was read in the source code at the linked commits on 2026-11-08.

## The lock every wallet has to satisfy

From [`secp256k1_blake160_multisig_all.c`](https://github.com/nervosnetwork/ckb-system-scripts/blob/72eb92fca090700dcb398cd8cad8fbd8bad40355/c/secp256k1_blake160_multisig_all.c):

- **Lock args:** the blake160 hash of the multisig script (20 bytes), optionally followed by an 8-byte `since`, for 28 bytes in total.
- **Multisig script:** `S | R | M | N | PubKeyHash1 … PubKeyHashN`.
  - S is reserved (0).
  - R is the number of keys at the front of the list that must sign.
  - M is the threshold.
  - N is the number of keys.
  - Each key hash is 20 bytes.
- **Witness lock:** the multisig script followed by exactly M 65-byte recoverable signatures. Any other length fails with `ERROR_WITNESS_SIZE`.
- **Order:** signatures can come in any order, and each key counts once. The first R keys must all have signed.

## Three multisig deployments are in use

| Deployment | Code hash | Hash type | Known to |
|---|---|---|---|
| Genesis | `0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8` (same on mainnet and testnet) | `type` | ckb-cli, ckb-sdk-rust, Neuron, CCC |
| 2024 (CCC calls it `Secp256k1MultisigV2Beta`) | mainnet `0xd1a9f877aed3f5e07cb9c52b61ab96d06f250ae6883cc7f0a2423db0976fc821`<br>testnet `0x765b3ed6ae264b335d07e73ac332bf2c0f38f8d3340ed521cb447b4c42dd5f09` | `type` | CCC and UTXO Global only |
| v2 | `0x36c971b8d41fbd94aabca77dc75e826729ac98447b46f91e00796155dddb0d29` (same on both) | `data1` | ckb-cli (its default), ckb-sdk-rust, Neuron, CCC |

- **Why there are three:**
  - CCC's [`knownScript.ts`](https://github.com/ckb-devrel/ccc/blob/0961763da4a81c954e156a27c581aed0aeca9761/packages/core/src/client/knownScript.ts) labels the 2024 deployment "Fix rare failing case" ([ckb-system-scripts#98](https://github.com/nervosnetwork/ckb-system-scripts/pull/98)) and v2 "Enhanced since handling" ([ckb-system-scripts#99](https://github.com/nervosnetwork/ckb-system-scripts/pull/99)).
  - quake confirmed the genesis bug in [ckb#4788](https://github.com/nervosnetwork/ckb/issues/4788): "The multisig contract deployed in the genesis block contains a bug that, under certain conditions, may fail to verify valid signatures."
- **Who can sign for the 2024 deployment:**
  - ckb-cli accepts only the genesis script and v2 as multisig locks (`check_lock_script` in [`tx_helper.rs`](https://github.com/nervosnetwork/ckb-cli/blob/d1e482b1318e42aadb6a89f7b2e33765e8d42763/src/utils/tx_helper.rs#L416)).
  - Neuron's [`.env`](https://github.com/nervosnetwork/neuron/blob/a926e3383d3a3e305b3bde7d233474515ef01a2e/packages/neuron-wallet/.env) defines only those two code hashes.
  - ckb-sdk-rust's `MultisigScript` has only `Legacy` and `V2` ([`constants.rs`](https://github.com/nervosnetwork/ckb-sdk-rust/blob/1fbf3d4c9b35ef90bdb9e6621a8d26edde6325ce/src/constants.rs)).
  - So a cell under the 2024 deployment can't be signed with ckb-cli or Neuron.
- **How much it holds:** 95 live cells holding about 120.46M CKB sat under the 2024 deployment on 2026-07-29 ([ckb-explorer#2934](https://github.com/nervosnetwork/ckb-explorer/issues/2934)). UTXO Global's multisig wallet uses it ([`lumos-config.ts`](https://github.com/UTXO-Global/utxo-global-multi-sig-website/blob/7f248e6d668c8bd17ba66e9bb6f6f72092088f5b/utils/lumos-config.ts)).
- **Mainnet cell deps** come from CCC's [`clientPublicMainnet.advanced.ts`](https://github.com/ckb-devrel/ccc/blob/0961763da4a81c954e156a27c581aed0aeca9761/packages/core/src/client/clientPublicMainnet.advanced.ts). All three are dep groups.

## How each tool stores signatures

### ckb-cli transaction file

`ckb-cli tx init / add-multisig-config / sign-inputs / add-signature / send`

`ReprTxHelper` in [`tx.rs`](https://github.com/nervosnetwork/ckb-cli/blob/d1e482b1318e42aadb6a89f7b2e33765e8d42763/src/subcommands/tx.rs) holds three fields:
- `transaction`, in snake_case JSON;
- `multisig_configs`, which maps each multisig lock arg to `{ lock_code_hash, sighash_addresses, require_first_n, threshold }`;
- `signatures`, which maps each lock arg to a list of 65-byte signatures.

The signatures live outside the transaction, keyed by lock arg. The file doesn't carry the input cells.

### ckb-cli deploy info file

`ckb-cli deploy gen-txs / sign-txs / apply-txs`

`IntermediumInfo` in [`intermedium_info.rs`](https://github.com/nervosnetwork/ckb-cli/blob/d1e482b1318e42aadb6a89f7b2e33765e8d42763/src/subcommands/deploy/intermedium_info.rs) holds:
- `deployment`, which includes `lock` and `multisig_config`;
- `last_recipe` and `new_recipe`;
- `used_input_txs`;
- `cell_tx`, `cell_tx_signatures` and `cell_changes`;
- `dep_group_tx`, `dep_group_tx_signatures` and `dep_group_changes`.

**How signing and applying work:**
- **Exact threshold:** `apply-txs` turns the file into the same `ReprTxHelper`. `TxHelper::build_tx` then requires exactly `threshold` signatures per multisig lock arg, and otherwise fails with "Invalid multisig signature length … expected: {threshold}" ([`tx_helper.rs` L332–L339](https://github.com/nervosnetwork/ckb-cli/blob/d1e482b1318e42aadb6a89f7b2e33765e8d42763/src/utils/tx_helper.rs#L332-L339)).
- **Output shape:** `sign-txs` prints `cell_tx_signatures: { <lock_arg>: <signature> }`, a single value, but the info file stores a list ([ckb-cli#569](https://github.com/nervosnetwork/ckb-cli/issues/569)).
- **Merging:** `--add-signatures` merges into the signer's own copy of the file only ([`deploy/mod.rs`](https://github.com/nervosnetwork/ckb-cli/blob/d1e482b1318e42aadb6a89f7b2e33765e8d42763/src/subcommands/deploy/mod.rs)).

### Neuron offline JSON

Neuron's multisig dialog, Export and Import.

`OfflineSignJSON` in [`offline-sign.ts`](https://github.com/nervosnetwork/neuron/blob/a926e3383d3a3e305b3bde7d233474515ef01a2e/packages/neuron-wallet/src/models/offline-sign.ts) holds:
- `transaction`, in camelCase, including `signatures`;
- `status`, `type` and `context` (the input transactions);
- optionally `description`, `asset_account`, `multisig_configs` and `signatures`.

**How Neuron records signatures:**
- **Who has signed** goes in `transaction.signatures`, as `{ <multisig lock hash>: [<signer key hash>] }`.
- **The signature bytes** are appended to the witness lock after the multisig script ([`transaction-sender.ts`](https://github.com/nervosnetwork/neuron/blob/a926e3383d3a3e305b3bde7d233474515ef01a2e/packages/neuron-wallet/src/services/transaction-sender.ts)).
- **Importing ckb-cli files:** since [PR #3169](https://github.com/nervosnetwork/neuron/pull/3169) (2024), Neuron imports ckb-cli `tx` files through `parseMultisigTxJsonFromCkbCli` ([`utils/multisig.ts`](https://github.com/nervosnetwork/neuron/blob/a926e3383d3a3e305b3bde7d233474515ef01a2e/packages/neuron-wallet/src/utils/multisig.ts)).
  - It works one way only.
  - It covers `tx` files only. Neuron has no reader for deploy info files.

### CCC

CCC has no file format. Signatures live in the witness, encoded by `MultisigCkbWitness` ([`signerMultisigCkbReadonly.ts`](https://github.com/ckb-devrel/ccc/blob/0961763da4a81c954e156a27c581aed0aeca9761/packages/core/src/signer/ckb/signerMultisigCkbReadonly.ts)).

- **The signers:** `SignerMultisigCkbReadonly` and `SignerMultisigCkbPrivateKey` come from [ccc#349](https://github.com/ckb-devrel/ccc/pull/349). Their methods include `signTransaction`, `needMoreSignatures` and `aggregateTransactions`.
- **Aggregation:** `aggregateTransactions` recovers the key behind every signature in every copy. It drops invalid, duplicate and non-member signatures ([example](https://github.com/ckb-devrel/ccc/blob/0961763da4a81c954e156a27c581aed0aeca9761/packages/examples/src/transferFromMultisigAggregateTxs.ts)).
- **Release:** it shipped in `@ckb-ccc/core` 1.15.0 ([CHANGELOG](https://github.com/ckb-devrel/ccc/blob/0961763da4a81c954e156a27c581aed0aeca9761/packages/core/CHANGELOG.md)).

### Others that wrote their own format

- **ckb-sdk-rust:** the example [`transfer_from_multisig.rs`](https://github.com/nervosnetwork/ckb-sdk-rust/blob/1fbf3d4c9b35ef90bdb9e6621a8d26edde6325ce/examples/transfer_from_multisig.rs) has `build`, `sign` and `send` around a `TxInfo { tx, multisig_config }` JSON.
- **.bit:** [`ckb-multisig-wizard`](https://github.com/dotbitHQ/ckb-multisig-wizard/blob/e0882c74761cb0549b92a8540194ee89b19eb625/src/app/api/upload/tx/route.ts) accepts only ckb-cli files.
- **Cryptape:** the [CoBuild proof of concept](https://github.com/cryptape/ckb-multisig-cobuild-poc/blob/84bdc99ad5e62f8e7a90a30e4d8bcdc1a53b468a/README.md) reads and writes ckb-cli `tx` and Neuron files through a CoBuild building packet.

## What can and can't move between formats

**Possible:**
- Every format holds the same three things: the transaction, the multisig config, and up to N signatures.
- A signature can move between formats if the signing message is known. The message is the hash of the transaction hash plus the lock group's witnesses, with the lock field zero-filled after the multisig script.
- The key behind each signature can be recovered and matched to the config, so a tool can tell which signer each signature belongs to, even when a file doesn't say.

**Not possible, or limited:**
- **A signature is tied to one exact transaction.** Any change to the transaction, the fee or the group's witnesses voids every signature.
- **Some files need a node.** ckb-cli `tx` files and bare CCC transactions don't carry the input cells, so telling which inputs belong to which lock group needs one RPC call. Deploy info files (`used_input_txs`) and Neuron files (`context`) can be checked offline.
- **ckb-cli and Neuron can't sign for the 2024 deployment.** Its signatures have to come from CCC or another wallet that supports it.
