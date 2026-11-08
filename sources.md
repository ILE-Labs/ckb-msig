# Sources

There are 47 sources: 43 from the CKB ecosystem and 4 from other ecosystems. They're grouped by kind. Each one's number is its rank by strength (1 is the strongest), so numbers jump within a group.

Every quote is verbatim. Translations from Chinese are marked as translations.

## Manual work, with times measured

| # | Source | Date | Author | Quote | What it shows |
|---|---|---|---|---|---|
| 1 | [t/10583/20](https://talk.nervos.org/t/10583/20) | 2026-09-07 | zz_tovarishch (DAO committee) | "一位委员会成员在 8月21 该项目通过投票后，以2500/$0.00087= 2,873,564 CKB 发起了打款，随后在 9.4 其他委员会成员才完成了多签" | Translation: one committee member started the payout on Aug 21, and the other members completed the multisig on Sept 4. A 14-day DAO payout. The same post: "因为委员会成员分布在各地，发起打款到完成多签的过程难免有一定时间的间隔" (translation: the members are spread out, so a gap between starting and completing is unavoidable). A community member, silenceport, then asked why the CKB amount didn't match that day's price: "为什么显示是287万个CKB呢？" (translation: "why does it show 2.87 million CKB?", [t/10583/19](https://talk.nervos.org/t/10583/19)) |
| 2 | [fiber-scripts #34](https://github.com/nervosnetwork/fiber-scripts/pull/34) | 2026-11-02 | quake, with XuJiandong, tinnendo, Hanssen0 and phroi signing | "for signers, please setup your ckb-cli url to mainnet, then switch to this branch and run:" … "reply the output in comment:" | A core contract upgrade. Signatures are pasted into PR comments and merged into `mainnet.json` by hand. The threshold was met in under 2 hours, but the upgrade wasn't on chain 6 days later ([timings.md](timings.md)) |
| 13 | [t/11089/13](https://talk.nervos.org/t/11089/13) | 2026-11-05 | LusoCryptoLabs | "Four signers have posted their signatures for the 3 of 5 deploy multisig. As of 2026-11-05 01:24 UTC it is not on chain yet." | Outside teams wait on the same flow: this team's DAO proposal depends on the Fiber upgrade in row 2 |
| 14 | fiber-scripts [#25](https://github.com/nervosnetwork/fiber-scripts/pull/25), [#27](https://github.com/nervosnetwork/fiber-scripts/pull/27), [#28](https://github.com/nervosnetwork/fiber-scripts/pull/28) | 2025-12-12 to 2026-01-14 | quake | No comments on the PRs. The times come from the git history and the explorer | v0.6.0: signatures were collected off GitHub, and the upgrade landed 22 to 33 days after it was prepared ([timings.md](timings.md)) |
| 15 | [nostr-binding#51](https://github.com/nervosnetwork/nostr-binding/pull/51) | 2026-01-14 | RetricSu | "A new mainnet deployment on nostr-binding-type and nostr-lock scripts has been taking effect to upgrade multisig signers." | Changing signers means redeploying. It took about 21 days from [#50](https://github.com/nervosnetwork/nostr-binding/pull/50) (2025-12-24) |

## Requests

| # | Source | Date | Author | Quote | What it shows |
|---|---|---|---|---|---|
| 3 | [ckb-cli#603](https://github.com/nervosnetwork/ckb-cli/issues/603) (forum copy: [t/8287](https://talk.nervos.org/t/8287)) | 2024-07-17 | doitian (core developer) | "Help users to prepare files for requesting multisig signatures from signers. Generate the tx json file and a markdown guidance for signers." / "Support sending request to ckb-cli and Neuron users." | A core developer's own plan for a signature-request tool. ckb-cli master (`d1e482b`) still has no `request-signature` or `inspect-config` subcommand |
| 17 | [kuai#233](https://github.com/ckb-js/kuai/issues/233) | 2023-04-12 | Keith-CY (Magickbase, Neuron maintainers) | "Supporting `secp256k1_blake160_multisig_all` to deploy a contract is enough" | A dApp framework needed multisig deploys. A later comment mentions feedback from .bit members |
| 26 | [t/10794/5](https://talk.nervos.org/t/10794/5) | 2026-10-09 | Hanssen (DevRel lead) | "I have recently been thinking about using a P2P network to enable a multisignature wallet to manage on-chain assets." | The DevRel lead is thinking about better multisig coordination |
| 32 | [neuron-public-issues#425](https://github.com/Magickbase/neuron-public-issues/issues/425) | 2024-10-03 | Keith-CY | "Support managing Nervos DAO assets with multisig addresses" | It was prompted by a Reddit user. The Reddit post couldn't be read (HTTP 403) |

## An earlier attempt

| # | Source | Date | Author | Quote | What it shows |
|---|---|---|---|---|---|
| 4 | [cryptape/ckb-multisig-cobuild-poc](https://github.com/cryptape/ckb-multisig-cobuild-poc) ([README](https://github.com/cryptape/ckb-multisig-cobuild-poc/blob/84bdc99ad5e62f8e7a90a30e4d8bcdc1a53b468a/README.md)) | 2024-02-22 to 2024-03-05 (40 commits) | doitian (Cryptape) | "This PoC utilizes the CoBuild building packet as an intermediate format for enabling collaboration among various tools in the collection of multisig signatures. Currently, it supports ckb-cli and Neuron." | A web proof of concept that reads and writes ckb-cli `tx` and Neuron files, merges signatures and submits. It handles the genesis multisig only and was written before the 2024 and v2 deployments. Its last commit was on 2024-03-05 |

## Holders of multisig funds

| # | Source | Date | Author | Quote | What it shows |
|---|---|---|---|---|---|
| 5 | [t/9995/48](https://talk.nervos.org/t/9995/48) | 2026-07-28 | zz_tovarishch (Spark committee) | "因为多签钱包有点问题，委员会决定临时用个人钱包先支付该项目的尾款" | Translation: "because the multisig wallet has a problem, the committee decided to pay this project's last installment from a personal wallet for now". The post doesn't describe the problem |
| 6 | [t/8752](https://talk.nervos.org/t/8752) (Spark rules, post 1) | 2025-04-28 | zz_tovarishch | "Each approved project establishes a multi-signature wallet for Spark funds management and distribution" | Every Spark grant is paid from a multisig. The same post says transfers need at least 3 committee members |
| 10 | [ckb-explorer#2934](https://github.com/nervosnetwork/ckb-explorer/issues/2934) | 2026-07-29 | janx | "while on-chain this script currently secures **95 live cells holding ~120.46M CKB**" | About 120M CKB sits under the 2024 multisig deployment (`0xd1a9…`), which ckb-cli and Neuron can't sign for ([formats.md](formats.md)) |
| 22 | [t/6968/1](https://talk.nervos.org/t/6968/1) | 2023-01-25 | neon.bit (Nervos Nation) | "CKB will be held in a shared L1 account until a L1 multisig becomes available." | A funded community group had no usable L1 multisig option in 2023 |
| 29 | [t/9824/1](https://talk.nervos.org/t/9824/1) | 2026-01-08 | xingtianchunyan (Spark) | "This wallet uses a 2/3 multisig scheme and is jointly managed by the following project committee members" | A Spark project wallet, 2-of-3 between Hanssen, Zhouzhou and Yixiu |
| 35 | [t/10937/1](https://talk.nervos.org/t/10937/1) | 2026-10-12 | Ayoub_Lesfer (CrowdCell) | "sent to a multisig treasury" | A DAO-funded project keeps fees in a multisig treasury |
| 36 | [t/10119/1](https://talk.nervos.org/t/10119/1) | 2026-03-19 | BuildUnion | "governed by Nervos DAO stewards via multi-sig" | A proposed $50,000 facility under steward multisig |
| 41 | [t/10143/23](https://talk.nervos.org/t/10143/23) | 2026-10-08 | chenyukang | "We may need to introduce a role such as administrator of Treasury (maybe it is a multi-sig lock), which has the power to veto a proposal." | The on-chain treasury design may add another multisig |
| 43 | [t/7306/74](https://talk.nervos.org/t/7306/74) | 2024-12-23 | ckbfans | "为团队或者DAO 等组织提供安全、高效的资产管理方案" | Translation: UTXO Global's multisig offers "safe, efficient asset management for teams, DAOs and other organisations" |

## Complaints

| # | Source | Date | Author | Quote | What it shows |
|---|---|---|---|---|---|
| 7 | [t/7849/1](https://talk.nervos.org/t/7849/1) | 2024-03-01 | JackyLHH (DAO) | "This is because DAO's funds are stored in a multisig wallet, so it takes some time to collect signatures due to timezone and other factors." | The DAO needed a rule for price swings, partly because multisig payouts are slow |
| 8 | [ckb-cli#569](https://github.com/nervosnetwork/ckb-cli/issues/569) | 2023-12-21 | doitian | "It's frustrated that `sign-txs` does not tell how to use the generated signatures" | A core developer had to edit the deployment file by hand and turn `sign-txs` output into arrays |
| 12 | [ckb-cli#658](https://github.com/nervosnetwork/ckb-cli/issues/658) | 2026-01-23 | RetricSu | "where I sign multisig with ckb-cli without adding the option `--add-signature` but the `info.json` still got updated, which is very confused to me." | Even a DevRel developer is unsure what ckb-cli wrote to the shared file |
| 16 | [kuai#276](https://github.com/ckb-js/kuai/issues/276) | 2023-05-25 | PainterPuppets (kuai team) | "Currently kuai deployment contract only supports local signature deployment, which is a very bad experience when using multiple devices for multi-signature." | The kuai framework then added its own ckb-cli-compatible import and export |
| 19 | [neuron#3048](https://github.com/nervosnetwork/neuron/issues/3048) (also [ckb-cli#584](https://github.com/nervosnetwork/ckb-cli/issues/584)) | 2024-02-29 | doitian | "`ckb-cli` saves the signature, and `Neuron` saves the pub key hash and stores the signatures in witnesses." | The two wallets store signatures differently. Neuron later imported ckb-cli `tx` files (row 39), but not the reverse and not deploy files |
| 20 | [neuron#2907](https://github.com/nervosnetwork/neuron/issues/2907) (comment) | 2024-06-07 | jordanmack | "I tried to send and I can't figure out how to sign and broadcast." | A long-time community developer couldn't complete a 1-of-1 multisig send in Neuron |
| 21 | [neuron#3260](https://github.com/nervosnetwork/neuron/issues/3260) | 2024-10-31 | rink1969 | "将交易转换成offline交易，用Neuron进行离线多签（提前已经配置好多签地址），报签名失败。" | Translation: the transaction was converted to an offline one and signed with Neuron's offline multisig (the address was set up in advance), and signing failed. Mixed-lock transactions broke Neuron's flow |
| 23 | [t/6868/1](https://talk.nervos.org/t/6868/1) | 2023-01-10 | taurenshaman | "Neuron的多签模式有点麻烦" | Translation: "Neuron's multisig mode is a bit of a hassle" |
| 24 | [ccc#235](https://github.com/ckb-devrel/ccc/pull/235) | 2025-07-03 | ashuralyk | "construction of multiple signature transaction is relatively complicated" | The same PR notes "multiple versions of multiple signature contract deployed" |
| 27 | [t/8609/1](https://talk.nervos.org/t/8609/1) | 2025-01-18 | loading | "I have checked and all signatures are correct. I don't understand where my problem is." | The signatures were valid, but the transaction failed because of the genesis-script bug in row 28. Nothing checked the signatures against the script before broadcast |
| 30 | [t/8973/1](https://talk.nervos.org/t/8973/1) | 2025-09-04 | zz_tovarishch | "终结 Nervos Talk + Metaforo + Multisig Wallet 的割裂模式" | Translation: "end the split between Nervos Talk, Metaforo and the multisig wallet". The DAO v1.1 proposal names the multisig step as part of the problem |
| 31 | [t/10091/1](https://talk.nervos.org/t/10091/1) | 2026-03-16 | phroi | "The multisig signers have no tool to independently verify vote results on-chain" | DAO signers sign without independent checks |
| 40 | [Akane-CN/quorum-cell](https://github.com/Akane-CN/quorum-cell) ([README](https://github.com/Akane-CN/quorum-cell/blob/4cfe1aa00cddd282a0e478b650ece364b4c370b5/README.md)) | 2026-07-25 | Akane | "Replacing a signer changes the multisig configuration, which changes the lock args and therefore the address." | Signer changes force moves and redeploys (rows 14 and 15) |
| 42 | [t/11130/1](https://talk.nervos.org/t/11130/1) | 2026-11-04 | LusoCryptoLabs | "Omnilock, multisig and smart contract wallets cannot bind at all." | Multisig holders are shut out of DAO voting on Metaforo |

## Code written to work around the gap

| # | Source | Date | Author | Quote | What it shows |
|---|---|---|---|---|---|
| 9 | [dotbitHQ/ckb-multisig-wizard](https://github.com/dotbitHQ/ckb-multisig-wizard) ([upload check](https://github.com/dotbitHQ/ckb-multisig-wizard/blob/e0882c74761cb0549b92a8540194ee89b19eb625/src/app/api/upload/tx/route.ts)) | 2024-09-22 to 2025-01-22 (29 commits) | .bit team | "Invalid transaction data, only ckb-cli format is supported." | Another team built its own self-hosted signing site (database, login, Ledger) for ckb-cli files only |
| 11 | [UTXO-Global/utxo-global-multi-sig-website](https://github.com/UTXO-Global/utxo-global-multi-sig-website) ([`utils/lumos-config.ts`](https://github.com/UTXO-Global/utxo-global-multi-sig-website/blob/7f248e6d668c8bd17ba66e9bb6f6f72092088f5b/utils/lumos-config.ts)) | 2024-07-24 to 2025-07-24 (323 commits) | UTXO Global | `"0xd1a9f877aed3f5e07cb9c52b61ab96d06f250ae6883cc7f0a2423db0976fc821",` | A hosted multisig wallet with its own backend (`api.utxo.global`), built on the 2024 deployment. It reads no ckb-cli or Neuron files |
| 18 | [toastmanAu/chain-pay](https://github.com/toastmanAu/chain-pay) ([README](https://github.com/toastmanAu/chain-pay/blob/a20289815a642dd6fe732eefcea875607a748d9f/README.md)) | 2026-05-20 to 2026-11-04 (141 commits) | toastmanAu | "ChainPay coordinates partial signatures." / "surfaced the witness-padding digest-divergence trap, now fixed" | A 2026 payroll app hand-rolled multisig coordination and hit a signing bug on the way |
| 25 | [ccc#349](https://github.com/ckb-devrel/ccc/pull/349) ([`transferFromMultisigAggregateTxs.ts`](https://github.com/ckb-devrel/ccc/blob/0961763da4a81c954e156a27c581aed0aeca9761/packages/examples/src/transferFromMultisigAggregateTxs.ts)) | 2026-01-09, merged 2026-06-28 | Hanssen0 | "await multisigSigners[0].aggregateTransactions(collectedTxs);" | CCC can merge signed copies in code, but has no command line, file reader or CI around it |
| 33 | [ckb-transaction-firewall#14](https://github.com/digitaldrreamer/ckb-transaction-firewall/pull/14) | 2026-05-14 | digitaldrreamer | "sign: secp256k1 multisig signing; uses @noble/curves v2 recovered format for correct recovery bit in CKB [r\|s\|recovery_bit] layout" | Another builder hand-rolled multisig signing and submits through ckb-cli |
| 34 | [CKBuilder#13](https://github.com/tiennt0212/CKBuilder/issues/13) | 2026-07-20 | tiennt0212 | "create M-of-N secp256k1-blake160-multisig addresses, collect and combine partial signatures." | A builder platform adding its own signature collection |
| 37 | [t/9621/1](https://talk.nervos.org/t/9621/1) | 2025-10-19 | Sonny | "既绕过了复杂的多签脚本" | Translation: "bypassing the complicated multisig script". A builder faked 2-of-2 in JavaScript rather than use the multisig lock |
| 38 | [ckb-sdk-rust `transfer_from_multisig.rs`](https://github.com/nervosnetwork/ckb-sdk-rust/blob/1fbf3d4c9b35ef90bdb9e6621a8d26edde6325ce/examples/transfer_from_multisig.rs) | 2026-03-17 (commit) | nervosnetwork | "struct TxInfo {" | The Rust SDK's example defines yet another file format (`TxInfo { tx, multisig_config }`) |

## Context

| # | Source | Date | Author | Quote | What it shows |
|---|---|---|---|---|---|
| 28 | [ckb#4788](https://github.com/nervosnetwork/ckb/issues/4788) (comment) | 2025-01-19 | quake | "The multisig contract deployed in the genesis block contains a bug that, under certain conditions, may fail to verify valid signatures." | Why there are now several multisig deployments |
| 39 | [neuron#3048 comment](https://github.com/nervosnetwork/neuron/issues/3048) on [PR #3169](https://github.com/nervosnetwork/neuron/pull/3169) | 2024-06-07 | Keith-CY; PR by devchenyan | "Should be resolved by https://github.com/nervosnetwork/neuron/pull/3169" | Neuron added a one-way import of ckb-cli `tx` files in 2024. The reverse direction and deploy files are still not covered |

## Other ecosystems

| # | Source | Date | Author | Quote | What it shows |
|---|---|---|---|---|---|
| 44 | [BIP-174](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki) | 2017-07-12 (assigned); status Deployed | Ava Chow | "holds the signatures for an input while the input does not have a complete set of signatures." | Bitcoin standardised one partly signed format (PSBT) that every wallet reads. CKB has none |
| 45 | [safe-transaction-service README](https://github.com/safe-global/safe-transaction-service) | read 2026-11-08 | Safe | "Transactions can also be sent to the service to allow offchain collecting of signatures" | Ethereum's main multisig has a dedicated signature-collection service |
| 46 | [caravan README](https://github.com/caravan-bitcoin/caravan) | read 2026-11-08 | Caravan (originally Unchained Capital) | "which is being re-branded as the "Caravan Coordinator"." | Bitcoin has a stateless multisig coordinator built on PSBT |
| 47 | [sparrow README](https://github.com/sparrowwallet/sparrow) | read 2026-11-08 | Sparrow | "built on common standards such as PSBT" | Desktop wallets work together through PSBT |
