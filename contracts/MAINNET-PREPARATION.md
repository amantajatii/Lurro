# Mainnet preparation — implementation and verification

Checked 14 October 2026, 12:05 UTC. **NOT CLEARED for Mainnet broadcast.**
This is an internal implementation report, not an independent audit.

## Reviewed implementation candidate

Code commit: `bcac11d2c5f4b3b82780f27537817c7a15cf66fa`.
Contract source and P0 money-moving rules were not changed by this preparation.
Solidity 0.8.30, optimizer 200, via IR, Cancun. ProjectVault runtime 12,270 bytes;
creation bytecode keccak256:
`0x30d6d7e4c3dfd761fc3d4def540ae62ac513195cc9ee98dd665d6b4e335c8f70`.

- Separate Mainnet-only script, expected USDC address and explicit funder signer.
  Wrong chain, wrong signer/token, invalid roles/policy fail closed. Both env
  and explicit-public-input entrypoints only create an unfunded, unlocked vault.
- Network selected per frontend build: Testnet by default, Mainnet explicitly.
  Wallet supports both chains, but reads, signing, documents and explorer stay
  bound to the app build. A wallet switch never submits an action.
- Mainnet linked projects, names and pending receipts use separate chain-5042
  keys. Existing Testnet keys are preserved. Other-chain pending receipts are
  rejected. Historical Testnet vaults are not seeded into Mainnet.
- Mainnet writes default off. After owner release review, enabling the public
  write flag still requires per-action real-USDC/immutable-recipient/unaudited
  acknowledgement plus network, role, current-state and wallet checks.

## Executed checks

| Check | Result |
| --- | --- |
| Forge formatting and size build | PASS; runtime below EIP-170 limit |
| Contract tests at the candidate commit | 52 passed, 0 failed, 0 skipped |
| Fuzz campaign | 1,024 runs per fuzz test |
| Stateful invariant campaign | 512 runs, depth 128; 65,536 calls, 0 reverts |
| Independent Solidity/viem encoding/hash checks | PASS |
| Web lint and TypeScript | PASS |
| Web + live Testnet + unsigned Mainnet tests at candidate commit | 79 passed, 0 failed, 0 skipped |
| Static Mainnet build | PASS; all product routes |
| Static Testnet build | PASS; restored as local default |
| Mainnet RPC/constructor simulation | PASS; chain 5042, USDC decimals 6, compiled runtime matched |
| Slither 0.11.6 | Analysis succeeded; 28 alerts, same detector/severity distribution as SECURITY-REVIEW.md |

Mainnet simulation snapshot: block **25,919,173**, timestamp **1791979417**.
Only read calls and unsigned creation `eth_call` were issued. Synthetic terms
exist solely inside the simulation test; they are not an actual project agreement.
There was **no Mainnet broadcast, deposit or payout**.

Slither returned exit 255 due to findings: 5 medium uninitialized-local,
3 low calls-loop, 15 low timestamp, 3 informational costly-loop,
1 informational cyclomatic-complexity and 1 optimization cache-array-length.
Existing triage remains in [SECURITY-REVIEW.md](SECURITY-REVIEW.md). Script/test
files are excluded from that Slither run; their guards were tested separately.
No high/critical detector results appeared. This does not establish absence of
vulnerabilities or independent review.

Reproduce:

```sh
# From contracts/
forge fmt --check
forge build --sizes
env FOUNDRY_INVARIANT_RUNS=512 FOUNDRY_INVARIANT_DEPTH=128 FOUNDRY_FUZZ_RUNS=1024 npm test

# From web/
npm run lint
npm run typecheck
LIVE_ARC_TEST=1 LIVE_MAINNET_READ=1 npm test
NEXT_PUBLIC_LURRO_NETWORK=mainnet npm run build
NEXT_PUBLIC_LURRO_NETWORK=testnet npm run build
```

Raw logs are retained locally in ignored `contracts/out/release-preparation/`.
Mainnet network/token values were checked against official Arc documentation
and then against the live RPC, not inferred from a Testnet fixture.

## Remaining release gates

- Complete browser smoke testing of the Mainnet build and intended desktop/mobile
  wallets. Computer Use stopped when the active browser changed; no Mainnet
  browser signing or end-to-end mobile signing is claimed.
- Rehearse the frozen candidate's full payout/refund lifecycle on a new Testnet
  release vault. Existing live checks inspect historical receipts and simulate
  the current constructor; they are not a fresh full-lifecycle release rehearsal.
- Review actual Mainnet agreement bytes, participant addresses, signer custody,
  source artifact and capped real-USDC budget with the owner/reviewer.
- Simulate the actual reviewed Mainnet deployment inputs; current live simulation
  used synthetic fixtures only.
- Obtain explicit limited-demo GO decision before broadcast. Then deploy, verify
  source/runtime/terms and perform a capped smoke test with public receipts.
- Keep production/meaningful third-party custody gated on independent security,
  operational and participant/jurisdiction review.

No checklist checkbox or GO decision was signed on the owner's behalf.
