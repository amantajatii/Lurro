# Lurro

Project funding on Arc: agree on payment rights, secure milestone funds in USDC, and trace authorized settlement to its receipt.

Lurro provides a Next.js workspace and an immutable Solidity `ProjectVault`. Each project defines 1–5 recipients, 1–3 milestones, a funder, a verifier, and primary/backup arbiters. Required parties accept the same agreement before funding begins. Payouts follow its review, challenge and arbitration rules and go to the original recipient addresses.

## Mainnet proof of concept

An owner-operated demonstration on **Arc Mainnet (chain 5042)** completed agreement acceptance, funding, evidence review, approval challenge, primary arbitration, and a **1 USDC payout** to the immutable recipient. All five role wallets were controlled by the owner; this is not an independent user trial or audit.

- [Completed demo vault](https://explorer.arc.io/address/0xE3f07fdFa237B159608Fa251CB5E16A3C4351A2b)
- [Successful 1 USDC payout](https://explorer.arc.io/tx/0x4f401afcea8f7f2cb4eec40cb0e31d0c0125385c50521b4a0ab08e1a1ba6a72d)
- [Full demo receipts, balances and artifact identity](docs/release/MAINNET-DEMO-PROOF.md)

The earlier deployment-only checkpoint remains below for provenance. It is a separate vault.

| Evidence | Link |
| --- | --- |
| ProjectVault | [0x7c9dfbe425c170e49da68459a72e4f7e9f58dd85](https://explorer.arc.io/address/0x7c9dfbe425c170e49da68459a72e4f7e9f58dd85) |
| Successful creation receipt | [Deployment transaction](https://explorer.arc.io/tx/0xd2e7a10cf0ce913882d633534f9603373c72bf5b11341a218257907ea8bc54a9) |
| Source verification | [Sourcify: exact creation and runtime match](https://sourcify.dev/server/v2/verify/5611443c-44d3-41ca-ac91-ebd6bf0929c5) |
| Deployment inputs and provenance | [Mainnet deployment report](docs/release/MAINNET-DEPLOYMENT.md) |

At the recorded deployment verification, the vault was unfunded and unlocked, with zero acceptances and zero accounting balances. That checkpoint proves deployment, not a completed Mainnet payment lifecycle. Consult current on-chain state for later activity. Historical [Testnet payout/refund receipts](docs/release/TESTNET-REHEARSAL.md) remain labelled as Testnet evidence.

**Unaudited prototype.** Source verification is not an independent security audit. Mainnet writes are disabled by default in the frontend. There is no vault-managed wallet recovery, upgrade or admin sweep; a blocked recipient can prevent an atomic milestone payout.

## Run the frontend

```sh
cd web
npm ci --ignore-scripts
NEXT_PUBLIC_LURRO_NETWORK=mainnet NEXT_PUBLIC_LURRO_MAINNET_WRITES_ENABLED=false npm run dev -- --port 3030
```

Open `http://127.0.0.1:3030`. The Mainnet build uses actual Mainnet RPCs, explorer links and chain-specific storage. To rehearse with test tokens, explicitly select `NEXT_PUBLIC_LURRO_NETWORK=testnet`.

```sh
# From web/: local checks and Mainnet static export
npm run lint
npm run typecheck
npm test
NEXT_PUBLIC_LURRO_NETWORK=mainnet NEXT_PUBLIC_LURRO_MAINNET_WRITES_ENABLED=false npm run build
```

Production defaults to Mainnet; development defaults to Testnet unless configured explicitly. Network selection is fixed at build time. Changing hosting environment variables requires a rebuild. `web/out/` is the static export.

## Contract development

See [contract setup, financial rules and tests](contracts/README.md). Compilation uses Solidity 0.8.30, optimizer 200, via IR, Cancun. Dependency versions, bytecode hashes and ABI identity are recorded in [release artifacts](docs/release/RELEASE-ARTIFACTS.md).

## Documentation

- [Frontend setup and wallet workflows](web/README.md)
- [Mainnet deployment and source verification](docs/release/MAINNET-DEPLOYMENT.md)
- [Release verification checkpoints](docs/release/MAINNET-READINESS.md)
- [Historical fresh-artifact Testnet rehearsal](docs/release/TESTNET-REHEARSAL.md)
- [Internal security review and known limitations](contracts/SECURITY-REVIEW.md)

The UI is original; Dub was used as a visual reference. Preserve dependency license notices. Private keys, local credentials, owner PRDs/checklists, `.DS_Store`, `dub/`, and all `brag-output*` artifacts are excluded from commits.
