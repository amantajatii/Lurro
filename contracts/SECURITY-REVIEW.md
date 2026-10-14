# Lurro P0 v1.2 — internal technical security review

**Review scope is historical.** A later limited Mainnet vault deployment and exact source verification are documented in [MAINNET-DEPLOYMENT.md](../docs/release/MAINNET-DEPLOYMENT.md). They do not change the audit status or constitute a new security review. Statements below about actions not performed apply to the dated review scope.

Date: 12 October 2026. Scope: `src/ProjectVault.sol`, its token/library dependencies, deployment script, agreement encoding, unit/fuzz/invariant tests and cancellation/funding callers. Review assumes exactly one funder, 2–5 recipients and 1–3 milestones, the immutable Arc USDC interface, and the signed v1.2 arbitration/recovery policy.

This is an internal review by the implementation agent plus automated analysis, **not an independent third-party audit, formal verification or Mainnet approval**.

## Verdict

No confirmed critical, high or medium implementation vulnerability was identified within the reviewed scope. The P0 source is suitable as the baseline for frontend integration and continued Testnet testing under its disclosed assumptions. No production source change was justified; the previously source-verified Testnet vault still corresponds to this source. Meaningful Mainnet custody remains gated on independent review and real participant/jurisdiction approval.

## Reviewed controls

- Constructor pins token, decimals, chain, role separation, recipient ordering, allocation totals, milestone limits/deadlines and all supported policy constants. Unbounded recipient/milestone arrays cannot reach payout or cancellation.
- Every required role explicitly accepts the same chain/vault-bound agreement; replay/outsider acceptance cannot inflate the quorum. No role/address/amount mutation, proxy upgrade or privileged sweep exists.
- Deposits are funder-only and locked-agreement-only. Received ERC-20 delta is exact, donations stay outside accounting, and current active obligations cap accepted funding.
- Reservation is full-or-zero and respects preceding Planned milestones. Evidence may be replaced only after explicit rejection; verifier actions bind current hash/revision and close at the review deadline.
- Only three guarded dispute entries exist. Timestamp equality consistently enables the after-deadline path and excludes the before-deadline path. An Approved milestone is economically earned after its challenge deadline even before storage finalization.
- Primary/backup authority ends at the arbitration deadline; approved/unapproved fallback snapshots cannot change while disputed. Only original recipients or original funder may receive the allowed resolution amounts.
- Economic transfer functions use checks/effects plus `nonReentrant`. Exact payout/refund transfers are checked; failures roll back accounting and status. Zero allocations are skipped. Duplicate payout cannot transfer again.
- Cancellation requires every recipient plus funder approval of the current proposal/version. New proposals supersede previous consent. Normal economic changes invalidate stale proposals. In-flight/earned milestones remain reserved/payable.
- Refund liabilities stay separate from available funds. Individual expiry returns only its reservation and objectively excess funding; other active obligations are protected.
- No private key is in tracked source or the public proof document. The Testnet wallet directory is ignored; it must remain excluded from Git.

## Additional adversarial tests

`test/ProjectVaultSecurity.t.sol` adds seven executable checks:

1. During deposit, a token callback cannot reserve another already-funded milestone.
2. During payout, a callback cannot pay a different earned milestone.
3. During refund, a callback cannot take an earned payout; its reservation remains intact.
4. A contract wallet can accept, submit evidence and receive funds at the same bound address via direct calls.
5. A superseded cancellation proposal cannot reuse previously collected approvals.
6. One disputed milestone does not block another milestone's earned payout.
7. Funder/recipient cannot assume arbiter authority and choose a refund.

CallbackToken and ParticipantWallet are test fixtures only. The callback tests are deliberately more hostile than the assumed Arc USDC ERC-20 behavior; they assert the actual reentrancy guard rejection and resulting ledger/version, rather than only observing a mock invocation.

## Executed validation

```sh
env FOUNDRY_INVARIANT_RUNS=512 FOUNDRY_INVARIANT_DEPTH=128 FOUNDRY_FUZZ_RUNS=1024 npm test
forge fmt --check
forge build --sizes
```

Results: 48 tests passed, 0 failed; each fuzz test ran 1,024 cases; stateful campaign ran 512 sequences × 128 calls = 65,536 handler calls with 0 unexpected reverts. Independent token-balance/ghost-counter accounting and immutable destination/version checks passed. Solidity/viem encoding/hash checks passed. Format/build passed; ProjectVault runtime remains 12,270 bytes.

The previous Arc Testnet run demonstrated deployment, source verification, six-wallet acceptance, 2 test-USDC funding, actual atomic 1-USDC payout via challenge/arbitration, unanimous cancellation and 1-USDC refund. See [TESTNET-PROOF.md](TESTNET-PROOF.md) for exact receipts and live-test limits.

## Slither 0.11.6 triage

Executed from `contracts` with an isolated temporary dependency cache:

```sh
uv run --no-project --cache-dir /private/tmp/lurro-slither-cache --with slither-analyzer==0.11.6 slither . --filter-paths 'lib/|test/|script/' --json out/slither-review.json
```

Analysis succeeded: 7 contracts, 102 detectors, 28 results. The detector command returned a nonzero exit code because it found alerts; it did not represent a compiler/analysis failure. Raw JSON lives under ignored build output.

| Detector | Count / severity | Disposition |
| --- | --- | --- |
| `uninitialized-local` | 5 Medium | Not a confirmed vulnerability. Solidity initializes the local integer accumulators to 0 and boolean validation flags to false. Variables are scoped within their loops; constructor total/split and invalid-role/recipient tests verify the intended outcomes. No uninitialized storage pointer is used. |
| `calls-loop` | 3 Low | Accepted bounded operation: exact balance checks around transfers for at most 5 recipients, exclusively against fixed Arc USDC. Atomic failure is a signed P0 design requirement, not hidden partial success. |
| `timestamp` | 15 Low | Intentional contract deadline checks, not randomness. Exact before/at/after boundaries are covered by unit/fuzz tests. Chain timestamp behavior remains a protocol assumption; users must not treat wall-clock seconds as independently enforced by Lurro. |
| `costly-loop` | 3 Informational | At most 3 milestones in cancellation, with at most 3-state scans; constructor caps prevent an unbounded gas-denial path. |
| `cyclomatic-complexity` | 1 Informational | Constructor validation has many required boundary checks; removing them to quiet a metric would weaken safety. |
| `cache-array-length` | 1 Optimization | Up to 3 reads in accounting scan. No functional/security consequence at P0 limits; optimization not necessary. |

References: [Solidity default initialization and variable scope](https://docs.soliditylang.org/en/latest/control-structures.html#scoping-and-declarations), [Slither detector documentation](https://github.com/crytic/slither/wiki/Detector-Documentation).

## Remaining policy and release risks

- Arbitrator/verifier collusion or error is not prevented. Inactivity fallback can be unfair; all parties must accept it explicitly.
- A blocked or inaccessible positive-allocation recipient can hold the entire milestone payout. There is deliberately no replacement-address or earned-fund seizure escape hatch.
- Lost EOA keys can make funds unusable. A participant smart wallet's own recovery/signing policy is outside this vault's review.
- This review adds local security coverage, not new live Testnet transactions. Live 48h/72h/7d timeout/default, rejection/resubmission, and restriction scenarios still need their separate integration evidence.
- Public amounts/addresses expose relationships; document hashes do not provide evidence retention, legal identity or privacy.
- No independent third-party review, formal proof, Mainnet deployment, production operational/compliance sign-off, or guardian/address recovery feature was performed or added.

## Recipient limit extension — 14 October 2026

New deployments support 1–5 recipients. Existing deployments remain immutable with their original 2–5 limit. The earlier review/results above describe the pre-extension build. Regression coverage now also exercises a single recipient: five required acceptances before lock, ordinary approval/payout, unanimous funder/recipient cancellation and refund, and rejection of zero or six recipients. This extension is not an independent audit. The ABI, terms schema, other role separation rules and policy windows are unchanged.
