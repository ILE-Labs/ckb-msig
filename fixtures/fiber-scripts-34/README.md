# fiber-scripts PR #34

Real data from a mainnet script upgrade signed by a 3-of-5 multisig: https://github.com/nervosnetwork/fiber-scripts/pull/34

## mainnet.json (fetched, not committed)

`npm run fixtures:fetch` downloads the `ckb-cli deploy` info file from the pull request's head commit and checks its SHA-256. fiber-scripts has no license file, so the file is fetched rather than copied into this repository.

- Commit: `026027f54f6a90cb48d8cc184b230e2018bb8611`
- URL: https://raw.githubusercontent.com/nervosnetwork/fiber-scripts/026027f54f6a90cb48d8cc184b230e2018bb8611/deployment/mainnet/mainnet.json
- Size: 904,588 bytes
- SHA-256: `8563ba8dcd0d051822dd0cc21db995dc8e6a2984e900d3500068f0185a07b51e`

## comments/

Each file is the body of one pull request comment, copied byte for byte from the GitHub API on 2026-11-08 (https://api.github.com/repos/nervosnetwork/fiber-scripts/issues/34/comments). Each holds pasted `ckb-cli deploy sign-txs` output with one signature for lock args `0x66712ae36e89b0e796155d004bebe2540ee7dfc9`.

| File | Comment | Posted (UTC) | Shape |
|---|---|---|---|
| `comment-1.txt` | https://github.com/nervosnetwork/fiber-scripts/pull/34#issuecomment-6571892250 | 2026-11-02 07:48:44 | `signed:` line, indented key, CRLF |
| `comment-2.txt` | https://github.com/nervosnetwork/fiber-scripts/pull/34#issuecomment-6573354672 | 2026-11-02 09:13:05 | `signed:` line, key without indent, CRLF |
| `comment-3.txt` | https://github.com/nervosnetwork/fiber-scripts/pull/34#issuecomment-6581601897 | 2026-11-02 15:53:31 | `yaml` code fence, CRLF |
| `comment-4.txt` | https://github.com/nervosnetwork/fiber-scripts/pull/34#issuecomment-6605978601 | 2026-11-03 14:08:50 | `yaml` code fence, LF |

Git can change line endings when these files are committed or checked out, so the parser tests also build the CRLF and LF shapes from strings.
