# Lurro ProjectVault — P0 v1.2

Unaudited Solidity prototype. Local tests are not an independent security review. A separately executed Arc Testnet integration self-test has a deployed, source-verified vault and successful test-USDC payout/refund receipts; see [TESTNET-PROOF.md](TESTNET-PROOF.md). No Mainnet operation or independent human verification is claimed. Dub code/assets are not used.

## Reproduce

Requires Foundry (verified locally with forge 1.5.1), Solidity 0.8.30, and Node.js/npm for the independent viem hash check. From this directory:

```sh
git clone --depth 1 --branch v5.4.0 https://github.com/OpenZeppelin/openzeppelin-contracts.git lib/openzeppelin-contracts
git clone --depth 1 --branch v1.9.7 https://github.com/foundry-rs/forge-std.git lib/forge-std
npm ci --ignore-scripts
npm test
forge fmt --check
forge build --sizes
```

Dependency commits:

- OpenZeppelin v5.4.0: `c64a1edb67b6e3f4a15cca8909c9482ad33a02b0`
- forge-std v1.9.7: `77041d2ce690e692d6e03cc812b57d1ddaa4d505`
- viem 2.57.4: pinned by `package-lock.json`.

Dependency directories, compiled output, test vectors, broadcasts and secrets are ignored. Retain dependencies' upstream licenses. The vault/test/script sources carry MIT SPDX headers.

## Fixed agreement

`ProjectTerms` in `src/ProjectVault.sol` is the exact ABI schema. Recipients must be sorted numerically by address; roles are unique and separate from recipients. One funder, 1–5 recipients, 1–3 chronological milestones. Constructor must be deployed by the funder on Arc Testnet (5042002) or Mainnet (5042), using USDC `0x3600000000000000000000000000000000000000`, whose ERC-20 interface reports 6 decimals.

All values are USDC integer base units; 1 USDC = 1,000,000. All dates are Unix UTC seconds. Preset durations are constructor-validated: review 72h, approval/rejection challenge 48h, backup activation 72h, arbitration/proposal expiry 7d, final evidence deadline = submission deadline + 7d, maximum evidence revisions 3. Unsupported policies/durations revert.

Supported policy values are all `0`:

- `fallbackPolicy`: approved dispute snapshot becomes claimable; unapproved snapshot refunds.
- `cancellationPolicy`: unanimous project-wide cancellation of future/unsubmitted scope.
- `recoveryPolicy`: immutable addresses; no vault-managed key recovery.

`signedDocumentHash = keccak256(exactDocumentBytes)`. Constructor computes:

```solidity
keccak256(abi.encode(keccak256("LURRO_PROJECT_TERMS_V1_2"), block.chainid, address(this), terms))
```

Every required party, including funder and both arbiters, explicitly calls `acceptAgreement(termsHash)`. Anyone can lock once all have accepted. No implicit acceptance, off-chain signatures, factory, proxy, upgrades, redirection or sweep.

## Actions and accounting

1. Funder deposits with an exact ERC-20 allowance and `deposit(amount)` after lock. Actual received balance delta must equal amount.
2. Anyone calls `reserveMilestone(id)` for a fully funded, unexpired milestone. Earlier Planned milestones must first be reserved or validly cancelled.
3. Named submitter calls `submitEvidence(id, evidenceHash)`. Evidence locator/private document retention is handled off-chain; the hash commits to exact evidence bytes, not the quality of work.
4. Verifier approves/rejects the exact revision and hash before the 72h timeout. Only Rejected evidence may be resubmitted; repeated hashes and a fourth revision are rejected.
5. After 48h without challenge, approval is economically earned even if storage still says Approved. `effectiveStatus()` reports Claimable. Anyone may call `executePayout(id)` directly or materialize Claimable with `finalizeApproval(id)` first.
6. Payout sends every positive allocation to its immutable recipient in one atomic transaction. Any transfer failure rolls everything back, including events and state version.

No generic public dispute function. `challengeApproval` is restricted to funder/positive-allocation recipients before 48h; `challengeRejection` to named submitter before rejection close; `escalateReviewTimeout` to any fixed agreement participant at/after 72h. Primary/backup arbitration is restricted to original payout allocation or funder refund. Both lose authority exactly at day 7; anyone may apply `finalizeDefault` then.

Accounting buckets returned by `getProjectAccounting()`:

```text
deposited = available + reserved + refundOwed + paid + refunded
actual USDC balance >= available + reserved + refundOwed
available + reserved <= active nonterminal unpaid obligations
```

`refundOwed` is a liability, not reusable funding. Anyone can trigger `claimRefund()`, which always pays the funder. Failed refund transfers preserve the liability. Unsolicited token/native transfers are unaccounted excess and cannot be swept.

Funder creates a cancellation proposal (creation counts as explicit funder proposal approval). All recipients must approve the same proposal. Funder/recipients may revoke their own approval. Only the latest proposal is executable; a new proposal supersedes previous ones. Proposals expire strictly at 7d and are invalidated by an economic state-version change. Approval/revocation/proposal creation do not advance the version.

Cancellation blocks new deposits, reservations and first submissions, cancelling every Planned/Reserved milestone. Submitted/Rejected/Approved/Disputed/Claimable milestones retain reservations and continue normally. Resubmission remains allowed on in-flight Rejected milestones. Per-milestone expiry refunds only its reservation and objectively excess available funds; other active obligations stay protected.

Use current contract state, effective status and successful receipts as authority. Events are emitted from each vault; transaction hashes come from receipts, not user input. `PaymentSettled` includes milestone, recipient and amount. `StateVersionAdvanced` occurs exactly once per successful economic action, including batch payout/cancellation.

## Tests

See [SECURITY-REVIEW.md](SECURITY-REVIEW.md) for the internal threat review, additional adversarial tests and Slither alert triage. This is not an independent third-party audit.

- Unit and fuzz: permissions, constructor validation, exact review/challenge/arbitration boundaries, evidence revision limits, immutable payout addresses, zero allocations, payout/refund failures, proposal expiry/revocation/staleness, deposit limits and surplus refunds.
- Stateful handler: successful deposit/reserve/review/dispute/cancel/payout/refund sequences, time passage, unsolicited donations and failed payouts. Independent ghost counters and token balances check the ledger/destinations/version; handler self-check proves both payout and refund are reachable. Campaign defaults to 128 runs × 64 calls, `fail_on_revert = true`.
- `test/terms-hash.mjs` builds an independent viem tuple/literal agreement and compares encoded bytes/hash against a Solidity-generated vector in `out/`. Also checks changes to recipient, amount, deadline, recovery policy, chain and vault.

TestUSDC exists only in tests and is etched at the fixed USDC address on a local EVM. It is not a deployed token or live integration. Standard Foundry does not reproduce Arc's shared native/ERC-20 balance semantics; Arc-specific integration remains required.

## Testnet deployment preparation

The deployment script is deliberately Testnet-only. Prepare actual, reviewed terms and encode with viem `encodeAbiParameters` using the exact constructor tuple from the compiled ABI. Write the resulting `0x...` string without whitespace to `out/project-terms.hex`. Do not use the test fixture/vector as a real project agreement. Use a keystore or hardware wallet belonging to `terms.funder`; never put a private key in source or shell arguments.

Simulation only (no `--broadcast`):

```sh
LURRO_TERMS_FILE=out/project-terms.hex forge script script/Deploy.s.sol:DeployProjectVault --rpc-url arc_testnet --account <funder-keystore>
```

Only broadcast once parties, evidence policies and wallets are agreed. Then verify the source, read back terms/hash, collect each party's acceptance, and test every settlement/exit path with testnet USDC. The completed technical self-test used six automated wallets; its demonstrated paths and remaining live-test gaps are recorded in [TESTNET-PROOF.md](TESTNET-PROOF.md).

Arc references: [connection details](https://docs.arc.io/arc/references/connect-to-arc), [USDC address](https://docs.arc.io/arc/references/contract-addresses), [EVM differences](https://docs.arc.io/arc/references/evm-differences).

## Remaining limits

- Arbitration inactivity can produce an unfair default; approval is an actor's decision, not objective work validation.
- One blocked recipient can prevent the entire milestone payout. No address replacement/refund of earned rights is available as an escape hatch.
- Lost EOA keys can make received funds unusable; a recoverable wallet's own security is outside this vault.
- Normal work may invalidate cancellation proposals; this is deliberate protection against stale consent.
- Public addresses/amounts reveal relationships. No document custody, KYC, cron automation, insurance or fiat integration.
- Before meaningful Mainnet funding: independent security review, static analysis, actual Arc integration and jurisdictional/participant clearance.
