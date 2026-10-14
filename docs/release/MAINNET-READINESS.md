# Final pre-Mainnet release verification

Candidate **`dc0b1153bdf3902405a65fa43baab0ce0354d422`**, verified 14 October 2026. **NO-GO for Mainnet broadcast at this checkpoint.** This is a technical readiness recommendation, not a decision signed on the owner's behalf. No Mainnet transaction was broadcast. No real USDC, owner key or independent audit was used or claimed.

## Executive summary and candidate comparison

The implementation matches the reported compiler settings, 1–5 recipient limit, guarded Mainnet deploy entrypoint and per-build frontend isolation. Starting HEAD was `af130ddace5c845217e84fca01b6d45e4570c882`, one documentation commit after the supplied `bcac11d2c5f4b3b82780f27537817c7a15cf66fa`. The starting working tree contained only two untracked owner checklist files, which were preserved.

Initial rerun independently reproduced **52 Solidity tests / 79 web tests**. Inspection found the invariant handler could take rejection/dispute paths but its deterministic reachability checks proved only payout/cancellation/refund/expiry. Two test-only checks now drive rejection, revision-two resubmission, approved/unapproved disputes, failed atomic payout, authorized payout and refund using the exact same handler. They are committed in the new candidate above. Final rerun: **54 Solidity tests / 79 web tests**. No production Solidity, ABI, financial policy or frontend code changed; creation bytecode is unchanged. Both forced builds match byte-for-byte.

A fresh frozen-artifact Testnet vault completed acceptance, lock, 2-USDC deposit, full reservation, evidence, approval, timely challenge, primary arbitration, 1-USDC payout, unanimous cancellation and 1-USDC refund. Final vault balance/refund liability are zero. This is a selected successful real lifecycle, not proof of every timeout route or independent participants.

Remaining release blockers: actual desktop browser validation, real mobile wallet validation, public availability of the candidate and reports, owner-approved actual Mainnet terms/signing custody/exposure/cost limits, actual-input unsigned simulation, and the owner's explicit limited-POC decision.

## Verification matrix

PASS means the stated scope passed; it does not absorb adjacent untested scope.

| Gate | Status | Fresh evidence / limitation |
| --- | --- | --- |
| Starting HEAD and changes identified | PASS | `af130dd` vs reported `bcac11d`; only documentation difference; two untracked owner checklists preserved |
| Final candidate identity | PASS | Test-only candidate `dc0b1153bdf3902405a65fa43baab0ce0354d422`; executable artifact unchanged; provenance report |
| Compiler/settings/dependencies | PASS | Solc 0.8.30+73712a01, optimizer 200, via IR, Cancun; pinned clean OZ/forge-std checkouts |
| Reproducible creation bytecode/runtime template/full ABI | PASS | Two sequential forced rebuilds identical; embedded frontend creation bytecode + constructor/errors match |
| Mainnet script guards | PASS | Chain 5042, funder signer, expected USDC; local guard/constructor tests; script only creates unfunded/unlocked vault |
| Network/data/write isolation in source and tests | PASS | Per-build explicit network; distinct bookmarks/names/pending namespaces; other-chain receipts rejected; Mainnet flag false and per-action acknowledgement guard before signer |
| Actual browser isolation/wrong-network/write behavior | BLOCKED | Native Brave control rejected with “The user changed /Applications/Brave Browser.app”; fresh observation showed another active user task. No smoke-test page was established. No UI, console or responsive PASS is claimed |
| Desktop wallet connect/disconnect/detection | BLOCKED | Actual browser interaction could not complete; configuration tests are not wallet E2E |
| Landing/application navigation, creation validation, agreement recipients and all project pages in browser | BLOCKED | Mainnet static server prepared on 127.0.0.1:3042, but controlled browser smoke session unavailable |
| Role visibility, live Mainnet reads and explorer links in browser | BLOCKED | Source/unit/live-RPC checks pass separately; actual UI behavior not validated |
| Static HTTP routes | PASS | All ten routes HTTP 200; hydration-only content means this cannot establish visible labels, no leakage, layout or console behavior |
| Real mobile Rainbow/WalletConnect E2E | BLOCKED | No accessible real mobile wallet/device/session. Discovery, disconnect, chain switch and supported signing flows remain unverified on mobile |
| New frozen-artifact Testnet lifecycle | PASS | 22 completed receipts; exact constructor input, domain hash, runtime, immutable destinations and final accounting verified independently |
| Live timeout/rejection/resubmission/default branches | NOT TESTED | Selected arbitration route avoids waiting lawfully; timeout branches require separate scenarios and actual deadlines |
| Forge formatting | PASS | `evidence/forge-fmt.log`, exit 0 |
| Size build | PASS | Runtime 12,270 B; creation 17,175 B, within EVM size limits |
| Full Solidity regression | PASS | 54 passed, 0 failed, 0 skipped; `evidence/contracts.log` |
| Fuzz | PASS | Four applicable fuzz tests, each 1,024 runs |
| Stateful invariant | PASS | 512 runs × depth 128 = 65,536 handler calls, zero unexpected reverts; independent financial ghosts and immutable/version assertions |
| Meaningful handler paths | PASS | Four deterministic tests prove payout/cancel/refund/expiry plus rejection/resubmit/dispute paths and rollback; random selector counts are not per-branch coverage guarantees |
| One and five recipients | PASS | Local single-recipient lifecycle, max-five/max-three exact settlement, empty/six rejected. Fresh live rehearsal used two, not the extremes |
| Solidity/viem canonical agreement hash | PASS | Independent encoded terms/vector; chain/vault/recipient/amount/deadline/policy alterations change hash; fresh on-chain hash recomputation matches |
| Slither analysis and current triage | PASS | Analysis JSON success=true, 28 alerts individually reviewed below. Exit 255 is expected finding output; no zero-alert or security-proof claim |
| Frontend lint / TypeScript | PASS | Logs `evidence/web-lint.log`, `web-types.log`, exit 0 |
| Frontend/integration tests | PASS | 79 passed, 0 failed, 0 skipped with live read-only flags; includes historical Testnet reads, not just the fresh rehearsal |
| Static Mainnet build | PASS | Explicit Mainnet, writes=false; ten routes; preserved isolated server copy |
| Static Testnet build | PASS | Explicit Testnet; ten routes; restored final web/out to Testnet |
| Mainnet RPC/token/unsigned synthetic constructor | PASS | Chain 5042, token decimals 6, runtime matcher passed at block 25,926,299, timestamp 1791983028; no broadcast |
| Actual Mainnet input simulation | BLOCKED | **PENDING OWNER INPUT**; no approved real terms/address/signer/exposure packet |
| Public candidate on GitHub | FAIL | Public main `f561aba`; local candidate lookup HTTP 422 unknown commit; no push performed |
| Independent security audit | NOT TESTED | Not performed; implementation-agent review + automated tests only |
| Owner GO approval | NOT TESTED | No owner sign-off recorded; this report cannot authorize broadcast |

## Invariant scope and financial review

Handler actions are deposit/reserve/review/reject/resubmit/dispute/default/payout/refund/cancel/donation/failed payout and bounded local time passage. Independent ghost deposits/payments/refunds/donations check wallet/vault balances, immutable hash, exact stateVersion and recipient maxima. All financial paths in scope are reachable in deterministic handler tests; zero reverts alone was not accepted as evidence. Random campaigns can terminate in expiry/cancellation and no-op terminal actions; there are no per-branch hit counters for each random sequence and no claim every random sequence pays or refunds. Two fixed recipients and two milestones limit invariant generalization; explicit one/five-recipient tests complement it. This is not formal proof.

Review of actual source confirmed immutable recipients/allocations, exact 6-decimal deposit/transfer deltas, nonReentrant guarded financial entrypoints, rollback on failed transfer, no double payout, earned effective Claimable amounts excluded from cancellation, stale proposals rejected by `stateVersion` and latest ID, exact deadline equality excludes arbitration/approvals while enabling maturity/default, and refund liabilities excluded from reusable funds. Tests include fee transfers, callbacks, unauthorized roles, paid/queued-refund deposit caps and preserved refund liabilities after failed transfers. No confirmed new financial-rule vulnerability was identified in this scope; no P0 rule was changed.

## Slither: every remaining finding

Raw results: [evidence/slither.json](evidence/slither.json). The original triage remains substantively valid with the limitations below. The earlier SECURITY-REVIEW is historical (48 tests and pre-extension scope); this report is the fresh 1–5-recipient checkpoint. Source locations below refer to `contracts/src/ProjectVault.sol`. Medium detector severity is not silently downgraded; five scalar-default alerts were examined and judged false positives, with no uninitialized storage pointer.

| # | Detector / reported severity | Source location / subject | Risk | Existing mitigation and fresh evidence | Triage still valid? |
| --- | --- | --- | --- | --- | --- |
| 1 | `uninitialized-local` / Medium | `ProjectVault.sol:213` — ProjectVault._validateTerms(ProjectVault.ProjectTerms).total | Apparent undefined accumulator/validation flag | Solidity scalar defaults are zero/false; no storage pointer. Constructor, invalid-role and allocation tests pass. | Valid false-positive triage |
| 2 | `uninitialized-local` / Medium | `ProjectVault.sol:158` — ProjectVault.constructor(ProjectVault.ProjectTerms).total | Apparent undefined accumulator/validation flag | Solidity scalar defaults are zero/false; no storage pointer. Constructor, invalid-role and allocation tests pass. | Valid false-positive triage |
| 3 | `uninitialized-local` / Medium | `ProjectVault.sol:212` — ProjectVault._validateTerms(ProjectVault.ProjectTerms).validSubmitter | Apparent undefined accumulator/validation flag | Solidity scalar defaults are zero/false; no storage pointer. Constructor, invalid-role and allocation tests pass. | Valid false-positive triage |
| 4 | `uninitialized-local` / Medium | `ProjectVault.sol:160` — ProjectVault.constructor(ProjectVault.ProjectTerms).amount | Apparent undefined accumulator/validation flag | Solidity scalar defaults are zero/false; no storage pointer. Constructor, invalid-role and allocation tests pass. | Valid false-positive triage |
| 5 | `uninitialized-local` / Medium | `ProjectVault.sol:198` — ProjectVault._validateTerms(ProjectVault.ProjectTerms).entitled | Apparent undefined accumulator/validation flag | Solidity scalar defaults are zero/false; no storage pointer. Constructor, invalid-role and allocation tests pass. | Valid false-positive triage |
| 6 | `calls-loop` / Low | `ProjectVault.sol:544-552, 546` — ProjectVault._transferExact(address,uint256) | External-call revert/gas/recipient blockage can stop whole payout | At most five immutable recipients; fixed USDC; exact deltas, nonReentrant, atomic rollback. Five-recipient and failed-transfer tests + real payout pass. | Valid accepted risk; USDC freeze/upgrade assumptions remain |
| 7 | `calls-loop` / Low | `ProjectVault.sol:544-552, 547` — ProjectVault._transferExact(address,uint256) | External-call revert/gas/recipient blockage can stop whole payout | At most five immutable recipients; fixed USDC; exact deltas, nonReentrant, atomic rollback. Five-recipient and failed-transfer tests + real payout pass. | Valid accepted risk; USDC freeze/upgrade assumptions remain |
| 8 | `calls-loop` / Low | `ProjectVault.sol:544-552, 549` — ProjectVault._transferExact(address,uint256) | External-call revert/gas/recipient blockage can stop whole payout | At most five immutable recipients; fixed USDC; exact deltas, nonReentrant, atomic rollback. Five-recipient and failed-transfer tests + real payout pass. | Valid accepted risk; USDC freeze/upgrade assumptions remain |
| 9 | `timestamp` / Low | `ProjectVault.sol:385-392, 389` — ProjectVault.challengeRejection(uint256) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 10 | `timestamp` / Low | `ProjectVault.sol:314-328, 317` — ProjectVault.reserveMilestone(uint256) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 11 | `timestamp` / Low | `ProjectVault.sol:477-483, 480` — ProjectVault.finalizeRejection(uint256) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 12 | `timestamp` / Low | `ProjectVault.sol:589-594, 592` — ProjectVault._proposal(uint256) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 13 | `timestamp` / Low | `ProjectVault.sol:330-337, 334` — ProjectVault.submitEvidence(uint256,bytes32) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 14 | `timestamp` / Low | `ProjectVault.sol:435-446, 439, 441-442` — ProjectVault.resolveDispute(uint256,bool) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 15 | `timestamp` / Low | `ProjectVault.sol:485-491, 488` — ProjectVault.expireUnsubmitted(uint256) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 16 | `timestamp` / Low | `ProjectVault.sol:448-456, 451` — ProjectVault.finalizeDefault(uint256) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 17 | `timestamp` / Low | `ProjectVault.sol:339-346, 343` — ProjectVault.resubmitEvidence(uint256,bytes32) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 18 | `timestamp` / Low | `ProjectVault.sol:394-405, 402` — ProjectVault.challengeApproval(uint256) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 19 | `timestamp` / Low | `ProjectVault.sol:407-414, 411` — ProjectVault.escalateReviewTimeout(uint256) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 20 | `timestamp` / Low | `ProjectVault.sol:377-383, 382` — ProjectVault._reviewable(uint256,uint32,bytes32) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 21 | `timestamp` / Low | `ProjectVault.sol:172-220, 208-210` — ProjectVault._validateTerms(ProjectVault.ProjectTerms) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 22 | `timestamp` / Low | `ProjectVault.sol:239-245, 241` — ProjectVault.effectiveStatus(uint256) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 23 | `timestamp` / Low | `ProjectVault.sol:416-433, 418` — ProjectVault._openDispute(uint256,ProjectVault.MilestoneState) | Boundary or chain timestamp behavior may change action eligibility | Intentional UTC deadlines; constructor pins periods. Local before/equality/after and fuzz tests pass. Chain time remains external assumption; live timeout branches not all exercised. | Valid intentional-use triage; live timing gap remains |
| 24 | `costly-loop` / Informational | `ProjectVault.sol:493-501, 495` — ProjectVault._cancelMilestone(uint256,ProjectVault.MilestoneState) | Repeated storage writes/cancellation gas growth | Constructor caps three milestones/five recipients; independent ledger, cancellation and three-milestone tests pass. | Valid bounded-gas triage |
| 25 | `costly-loop` / Informational | `ProjectVault.sol:503-510, 507` — ProjectVault._refundSurplus() | Repeated storage writes/cancellation gas growth | Constructor caps three milestones/five recipients; independent ledger, cancellation and three-milestone tests pass. | Valid bounded-gas triage |
| 26 | `costly-loop` / Informational | `ProjectVault.sol:512-516, 514` — ProjectVault._queueRefund(uint256) | Repeated storage writes/cancellation gas growth | Constructor caps three milestones/five recipients; independent ledger, cancellation and three-milestone tests pass. | Valid bounded-gas triage |
| 27 | `cyclomatic-complexity` / Informational | `ProjectVault.sol:172-220` — ProjectVault._validateTerms(ProjectVault.ProjectTerms) | Complex validator could conceal missed input combinations | Explicit chain/token/roles/order/limits/policy checks; fuzz and one/five-recipient tests pass. Complexity metric is not a vulnerability finding. | Valid informational triage; not exhaustive proof |
| 28 | `cache-array-length` / Optimization | `ProjectVault.sol:268` — Loop condition i < _milestones.length | Uncached length adds gas | Only three milestones; bounded loop, no money-rule change justified. | Valid optimization triage |

Forge build also emitted lint warnings/notes (retained in size-build logs), including timestamp-to-uint64 casts and unsafe-cheatcode notes in local tests/deployment scripts. Deadline casts assume real Arc epoch seconds far below 2^64; constructor validates uint64 term deadlines, periods and arithmetic. Broadcast cheatcodes exist only in explicitly guarded deployment scripts, not runtime contract code. These warnings were not suppressed or treated as absence-of-risk evidence.

## Remaining security assumptions and deployment risks

1. Verifier/arbiter decisions can be wrong or collusive. Lurro commits to evidence bytes; it does not validate work quality or retain the original files. Default payout/refund snapshots require informed participant acceptance.
2. Fixed Arc USDC and Arc chain timestamp/finality behavior are external dependencies. Issuer restrictions, blocked recipients or incompatible token behavior can freeze atomic payouts. No replacement address, privileged sweep, recovery administrator or contract pause exists; lost keys can strand funds. Unsolicited balances are unaccounted and unsweepable.
3. Frontend Mainnet disable flag is a **UI release guard**, not an on-chain pause. Anyone with a wallet can independently call a deployed contract. Rebuilding with another flag changes the frontend; owner must review the actual delivered bundle/origin and Reown allowed origins.
4. Browser hydration, desktop wallet interoperability and mobile signing are still blockers. RPC rate limits happened during rehearsal; persisted transaction hashes and independent receipts prevented duplicate broadcasting. Operators must follow receipts, not stale UI counters.
5. Real seven-day default and 48/72-hour maturity/backup inactivity paths have local boundary tests but no fresh live waited-through proof. Production/meaningful third-party custody remains gated on independent audit and operational/participant review; limited POC requires explicit personal exposure acceptance.
6. The final candidate is not publicly retrievable yet. A submission must not cite local-only Mainnet preparation as public source provenance.

## Owner Mainnet deployment input review template

**PENDING OWNER INPUT.** Testnet wallets, synthetic fixture addresses, salts and deadlines must not be silently reused as real project inputs. All addresses are public review values; keys stay in owner-controlled keystore/hardware wallet.

| Input | Required reviewed value / current status |
| --- | --- |
| Chain ID / RPC / explorer | 5042 / https://rpc.mainnet.arc.io / https://explorer.arc.io |
| USDC address / units | `0x3600000000000000000000000000000000000000`; ERC-20 6 decimals, native gas 18 decimals |
| Funder | **PENDING OWNER INPUT** — address, custody, participant consent |
| Deployment signer | **PENDING OWNER INPUT** — must equal funder; public address + signer method only |
| Recipients (1–5) | **PENDING OWNER INPUT** — sorted unique numeric addresses, identity/address checks, exact per-milestone base-unit allocations |
| Verifier | **PENDING OWNER INPUT** — unique role, availability, consent |
| Primary / backup arbiters | **PENDING OWNER INPUT** — separate unique addresses, custody, availability, consent |
| Milestones (1–3) | **PENDING OWNER INPUT** — submitter recipient, scope bytes/hash, allocation sum, chronological future UTC submission dates |
| Final evidence deadlines | submission deadline + exactly 604800 seconds; actual dates **PENDING OWNER INPUT** |
| Exact agreement document | **PENDING OWNER INPUT** — exact bytes distributed to all parties; keccak256 document hash |
| Project salt | **PENDING OWNER INPUT** — bytes32 chosen for actual project |
| Recovery / fallback / cancellation policy | All 0: immutable addresses; approved snapshot payout/unapproved snapshot refund; unanimous unsubmitted-scope cancellation |
| Dispute/cancellation parameters | review 259200; approval/rejection 172800; backup 259200; arbitration/proposal 604800 seconds; max revisions 3 |
| Expected deployment address | **PENDING OWNER INPUT** — funder + reviewed CREATE nonce, recheck immediately before any later approved deployment |
| Expected terms hash | **PENDING OWNER INPUT** — keccak256 canonical `abi.encode(schema,5042,predictedVault,terms)`; recheck actual deployed vault address |
| Maximum personal USDC exposure | **PENDING OWNER INPUT** — explicit deposit cap + gas budget + maximum acceptable stranded/lost funds; no assumed budget |
| Expected costs / fee cap | Actual-input deployment/action gas estimates and acceptable fee cap **PENDING OWNER INPUT**; fresh illustrative quote below |
| Actual unsigned deployment simulation | **PENDING OWNER INPUT**, only after complete reviewed terms and public signer/address; must not broadcast |

Fresh read-only illustrative fee quote: Mainnet block **25927584**, 2026-10-14T13:14:39+00:00, gas price **20000000000 wei**. A synthetic two-recipient/two-milestone deployment estimated **3489592 gas**, approximately **0.06979184 USDC** at that quote. This is not the owner's actual deployment cost, a spending authorization or a full lifecycle budget. Transaction cost = gas used × effective gas price / 10^18 USDC; review fresh deployment plus each participant acceptance, lock, allowance, deposit and selected workflow action before setting the budget. Constructor gas depends on arrays/amount storage; network fees may change. No full Mainnet action estimates are claimed without a real vault/input state.

Network/token definitions checked against [official Arc connection details](https://docs.arc.io/arc/references/connect-to-arc) and [official contract addresses](https://docs.arc.io/arc/references/contract-addresses), plus live RPC chain/decimals. Native and ERC-20 USDC are the same balance and must not be double counted.

## Required manual actions before any deployment

- Complete a controlled desktop Mainnet **read-only** smoke test: landing/nav, wallet connect/disconnect, chain detection/wrong chain, storage isolation, creation validation, immutable agreement, all project pages, role visibility, reads/explorer, write disabling, desktop responsiveness and console.
- Complete real mobile Rainbow/WalletConnect Testnet discovery, connect/disconnect, chain switching and signing; record actual receipts and supported wallet/device versions.
- Provide and review the entire actual Mainnet packet above, signer custody, document distribution, nonce/address, capped personal deposit/gas exposure and fee limits. Never provide a private key to the agent.
- Run the actual-input read-only simulation, confirm artifact/expected terms hash/nonce and retain results. Recheck dependencies and exact delivered frontend environment.
- Approve publishing the reviewed local commits/reports. Prepared commands are in RELEASE-ARTIFACTS; no push happened. Confirm public commit availability afterward.
- Personally decide whether the limited unaudited POC and remaining live timing assumptions are acceptable. **GO CANDIDATE would still not authorize broadcast**; a separate explicit deployment instruction is required. Mainnet writes remain disabled.

No Mainnet deploy, approval, acceptance, funding, payout or refund was issued during this task. The task ends with this report. Read-only server/evidence and Testnet receipts do not constitute owner release approval.

## Later owner-input checkpoint — 14 October 2026

Owner narrowed scope to desktop-only POC; mobile validation remains untested but is no longer required for that scoped release. Actual one-recipient/one-milestone input (1 USDC, total budget 5 USDC) passed unsigned Mainnet constructor simulation at block 25,943,108. Runtime and populated chain/value/terms-hash immutables matched. Deployment estimate was 3,279,326 gas (~0.065587 USDC at the observed quote). Local input packet and agreement are in ignored `contracts/out/mainnet-input-review/`; the exact submission deadline is 15 October 2026 22:08:51 WIB. Recheck nonce/deadline before any future approved deployment.

Anvil fork could not complete the unmodified USDC deposit: transferFrom reached Arc precompile 0x1800000000000000000000000000000000000001 and failed with invalid opcode locally. Mainnet RPC eth_simulateV1 is unsupported. Full lifecycle cost is a proxy based on the actual creation estimate and observed Testnet workflow gas (~0.089473 USDC gas, ~1.089473 including deposit), not a verified full Mainnet lifecycle. No production rule/token was changed and no Mainnet transaction was broadcast.

Public origin/main now contains c91e264ae117c24bafd3d68a6a64322fe66d4be4 (documentation/navigation added; contract artifact unchanged), so the earlier publication failure is historical. Desktop Mainnet browser validation and explicit owner deployment authorization remain outstanding. This checkpoint does not mark the owner GO or authorize broadcast.
