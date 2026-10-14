# Release artifact provenance and reproducibility

Verified 2026-10-14T13:17:44.507808+00:00. Implementation/test candidate: **`dc0b1153bdf3902405a65fa43baab0ce0354d422`**. Starting HEAD was `af130ddace5c845217e84fca01b6d45e4570c882`, not the supplied `bcac11d2c5f4b3b82780f27537817c7a15cf66fa`. Starting HEAD differed only by the historical preparation report. The new candidate adds two invariant-handler path tests; contract and frontend sources are unchanged from `bcac11d`. A later documentation-only commit may package these reports; it is not a different executable artifact.

## Frozen identities

| Item | Identity |
| --- | --- |
| Source | `contracts/src/ProjectVault.sol` at `dc0b1153bdf3902405a65fa43baab0ce0354d422` |
| Source SHA-256 | `65a6ac4d49cd2a915106f9448e0ef3372e6f3c2e2022a731db16b60f5750bde0` |
| Compiler | Solidity `0.8.30+commit.73712a01` |
| Settings | optimizer enabled, 200 runs; via IR; Cancun; metadata IPFS bytecode hash |
| Creation bytecode, excluding constructor arguments | 17175 bytes; keccak256 `0x30d6d7e4c3dfd761fc3d4def540ae62ac513195cc9ee98dd665d6b4e335c8f70` |
| Runtime template, including zero immutable placeholders | 12270 bytes; keccak256 `0xb8fc9ec281ae86f1eac93792d758db405305f3769e79c0597c90900f89ec686e` |
| Full ABI identity | keccak256 of UTF-8 `JSON.stringify(artifact.abi)` = `0xc21d86d5d5eca0d6b7848e6b1f947f5c38fb771e913876f87806249734a04024` |
| Testnet runtime with populated immutables | `0x50687b3bdae1cfbc5bfab37b8f98b20eb260682e6de13d8a78959d2b677395fa` |
| Toolchain | Foundry 1.5.1 (`b0a9dd9ceda36f63e2326ce530c10e6916f4b8a2`), Node v26.7.0 |
| OpenZeppelin v5.4.0 | `c64a1edb67b6e3f4a15cca8909c9482ad33a02b0` |
| forge-std v1.9.7 | `77041d2ce690e692d6e03cc812b57d1ddaa4d505` |
| viem | contracts 2.57.4; web 2.57.5, npm lockfiles |

Both dependency checkouts were clean. Two sequential forced rebuilds produced identical creation bytecode, runtime template and ABI. The frontend's embedded `vaultBytecode` and constructor/error ABI match the compiled artifact exactly. The fresh Testnet deployment input matches that bytecode plus the exact encoded constructor arguments. Real deployed runtime hashes differ by chain/address/terms/value immutables; compare immutable ranges and the remaining bytecode, not a naive template hash.

Full ABI: [ProjectVault.abi.json](ProjectVault.abi.json). Compiler metadata/settings and hashes: [evidence/artifact-summary.json](evidence/artifact-summary.json). Constructor terms and actual receipts: [TESTNET-REHEARSAL.json](TESTNET-REHEARSAL.json).

## Reproduce without any broadcast

```sh
git checkout dc0b1153bdf3902405a65fa43baab0ce0354d422
cd contracts
git clone --depth 1 --branch v5.4.0 https://github.com/OpenZeppelin/openzeppelin-contracts.git lib/openzeppelin-contracts
git clone --depth 1 --branch v1.9.7 https://github.com/foundry-rs/forge-std.git lib/forge-std
npm ci --ignore-scripts
forge fmt --check
forge build --sizes --force
FOUNDRY_FUZZ_RUNS=1024 FOUNDRY_INVARIANT_RUNS=512 FOUNDRY_INVARIANT_DEPTH=128 npm test
# Read-only static analysis. Output outside out/, because Slither runs forge clean.
uv run --no-project --with slither-analyzer==0.11.6 slither . --filter-paths 'lib/|test/|script/' --json /tmp/lurro-slither.json
# Slither exit 255 with JSON success=true is the finding result, not a passed no-alert scan.
forge build
cd ../web
npm ci --ignore-scripts
npm run lint
npm run typecheck
LIVE_ARC_TEST=1 LIVE_MAINNET_READ=1 npm test
NEXT_PUBLIC_LURRO_NETWORK=mainnet NEXT_PUBLIC_LURRO_MAINNET_WRITES_ENABLED=false npm run build
NEXT_PUBLIC_LURRO_NETWORK=testnet NEXT_PUBLIC_LURRO_MAINNET_WRITES_ENABLED=false npm run build
```

The twice-reproduced build was in the existing clean dependency checkout, not an independently provisioned machine. Live RPC checks depend on service availability. Tests are not evidence of wallet/browser/mobile interoperability.

## Public repository and packaging

GitHub repository `amantajatii/Lurro` is public (unauthenticated API HTTP 200, `private=false`). Public `main` was `f561abab59957e4272643f26b60710ee035e67cf`; it does **not** contain this final candidate or the reported preparation candidate. Lookup of `dc0b1153bdf3902405a65fa43baab0ce0354d422` returned HTTP 422 (unknown commit). **Publication gate FAIL until explicitly approved and pushed.** No push or release publication occurred.

Evidence logs have terminal carriage returns/trailing whitespace normalized for review; numeric results are unchanged. Raw local tool output remains in /private/tmp/lurro-final-*.log.

New files prepared: these three release reports, public ABI, public Testnet agreement/receipt JSON and sanitized evidence logs/JSON. Local test credentials and runners remain under ignored `contracts/.testnet/`; they are not publication inputs. PRD, owner checklists, `.DS_Store`, `dub/` and all `brag-output*` remain excluded. No such excluded file is tracked in this candidate.

After owner approval, the exact publication command for the reviewed local branch is:

```sh
git status --short
git log --oneline origin/main..HEAD
git push origin HEAD:main
```

This command is **prepared only, not executed**. Verify the final docs commit is included, then re-query GitHub for candidate commit availability. Publication is distinct from Mainnet authorization; keep writes disabled.
