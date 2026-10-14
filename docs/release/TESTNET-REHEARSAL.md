# Fresh Arc Testnet release rehearsal

Verified 2026-10-14T13:17:44.507808+00:00. **PASS for the selected arbitration payout + unanimous cancellation/refund lifecycle.** Not Mainnet, not an independent user trial or audit. All six roles are controlled by the authorized automated test runner. Existing ignored credentials were reused; no private keys are in this report.

Code candidate: `dc0b1153bdf3902405a65fa43baab0ce0354d422`. Deployment occurred with the unchanged artifact built from starting HEAD `af130ddace5c845217e84fca01b6d45e4570c882`. The subsequent candidate change adds handler tests only. Its creation bytecode is identical.

- Chain: **5042002**; USDC: `0x3600000000000000000000000000000000000000`, 6 decimals.
- New vault: [0xfa35fe25f9b4f162e2fcedca443c118d15b93026](https://explorer.testnet.arc.io/address/0xfa35fe25f9b4f162e2fcedca443c118d15b93026).
- Creation bytecode hash: `0x30d6d7e4c3dfd761fc3d4def540ae62ac513195cc9ee98dd665d6b4e335c8f70`.
- Actual deployed runtime hash (immutables populated): `0x50687b3bdae1cfbc5bfab37b8f98b20eb260682e6de13d8a78959d2b677395fa`.
- Agreement terms hash: `0x7205f9cff03a3e46db97990d9a879b47b53af0140c484247375fc993aaad9a5e`.
- Final verification block: **67165516**, UTC 2026-10-14T13:21:41+00:00.
- **22 successful transaction receipts** independently reread. Chain, sender role, target, zero native value, status and block checked. Deployment input exactly equals frozen creation bytecode + canonical ABI constructor arguments. On-chain terms bytes, domain-separated hash and normalized runtime match the artifact.
- Final accounting in USDC: deposited **2**, available **0**, reserved **0**, refund owed **0**, paid **1**, refunded **1**; actual vault ERC-20 balance **0**. `D=A+R+Q+P+F` holds.

## Participants

| Role | Address |
| --- | --- |
| funder | `0xE882c1F3b40c1f2C121Df8E46ade52fef8f8C44C` |
| recipient1 | `0x21A601D380A667151B04Bd81fbf9F0d10E0EDF7a` |
| recipient2 | `0x89ED790300cb0186BB0E94dd4fb9Bb1C3c51E16C` |
| verifier | `0xFDd4b048A5F94700aCAAda444F61Ae0cb6B8C5a0` |
| primaryArbiter | `0x2Be79aB32DfFDDCEA9f68DDE116E8F157979A365` |
| backupArbiter | `0xcb2405963c14bbf9b29a0E2CB164E66d4ee2C898` |

## Transactions and balances

Every link below is a completed receipt. Amounts are **integer micro-USDC (6 decimals)**. Balance columns are **funder / recipient1 / recipient2 / vault**. All six actor balances, gas used, effective gas price and decoded ProjectVault/USDC events are preserved in [TESTNET-REHEARSAL.json](TESTNET-REHEARSAL.json). Before/after snapshots are observed reads surrounding the transaction; one acceptance interrupted by rate limiting was reconstructed at preceding/receipt blocks and marked in JSON. Actor balances also change through gas, since native gas and ERC-20 USDC represent the same funds. They must not be treated as two separate assets.

| Step | Actor | Transaction | Block / timestamp | Relevant events | Balances before → after | Outcome |
| --- | --- | --- | --- | --- | --- | --- |
| deploy | funder | [receipt](https://explorer.testnet.arc.io/tx/0xa92034e15541b95c509b67c91ce1a7a7a1ff855ebd0d9ee17239e528203ca881) | 67163561 / 1791983110 | ProjectCreated | 17628678 / 843947 / 646712 / 0 → 17542108 / 843947 / 646712 / 0 | success |
| accept-funder | funder | [receipt](https://explorer.testnet.arc.io/tx/0xd5eb464803c1ab97fd62137bc80c82f2c1b84fe73dba859974f14b4afcfcae66) | 67163567 / 1791983113 | AgreementAccepted | 17542108 / 843947 / 646712 / 0 → 17540285 / 843947 / 646712 / 0 | success |
| accept-recipient1 | recipient1 | [receipt](https://explorer.testnet.arc.io/tx/0x46f7d77c41207d0eb44e81558dfd396beb3b6c425ab1d3a0786418b393109ae7) | 67163571 / 1791983115 | AgreementAccepted | 17540285 / 843947 / 646712 / 0 → 17540285 / 842277 / 646712 / 0 | success |
| accept-recipient2 | recipient2 | [receipt](https://explorer.testnet.arc.io/tx/0x194e85adf68685b159fe991c54f6e9d7076cc9558d1464e81ef7687eba0140a8) | 67163574 / 1791983117 | AgreementAccepted | 17540285 / 842277 / 646712 / 0 → 17540285 / 842277 / 644982 / 0 | success |
| accept-verifier | verifier | [receipt](https://explorer.testnet.arc.io/tx/0xc2a28aaa1a8cb9009877b2a9eb038e988768a3dc90ecfe3086b7aebc785d060f) | 67163578 / 1791983118 | AgreementAccepted | 17540285 / 842277 / 644982 / 0 → 17540285 / 842277 / 644982 / 0 | success |
| accept-primaryArbiter | primaryArbiter | [receipt](https://explorer.testnet.arc.io/tx/0x5e761d3bef599127e5fdea1e6c6f6635b6d4a7b6f773fee9b4e473d007f0fec2) | 67163582 / 1791983121 | AgreementAccepted | 17540285 / 842277 / 644982 / 0 → 17540285 / 842277 / 644982 / 0 | success |
| accept-backupArbiter | backupArbiter | [receipt](https://explorer.testnet.arc.io/tx/0x3f8b929848d3e060571d714c5f9654fec32912ba9d44929f77d2f16b719929e1) | 67163585 / 1791983122 | AgreementAccepted | 17540285 / 842277 / 644982 / 0 → 17540285 / 842277 / 644982 / 0 | success |
| lock | funder | [receipt](https://explorer.testnet.arc.io/tx/0xc01f3a76efa207045026936500c2ac28aa7cab162f20217b2838d93f139cd935) | 67163590 / 1791983125 | AgreementLocked | 17540285 / 842277 / 644982 / 0 → 17539050 / 842277 / 644982 / 0 | success |
| approve-usdc | funder | [receipt](https://explorer.testnet.arc.io/tx/0x849a107a7b0abf5c8177377f4fa1e938fb72f1aff1af35a905f160341e89fe57) | 67163593 / 1791983126 | Approval | 17539050 / 842277 / 644982 / 0 → 17537664 / 842277 / 644982 / 0 | success |
| deposit | funder | [receipt](https://explorer.testnet.arc.io/tx/0x22fc18b184bbe59f46cadeb04bd42b9dbe2c116e9c1306f4d8e96138a3f554e2) | 67163597 / 1791983128 | Transfer, USDCDeposited, StateVersionAdvanced | 17537664 / 842277 / 644982 / 0 → 15534456 / 842277 / 644982 / 2000000 | success |
| reserve-0 | funder | [receipt](https://explorer.testnet.arc.io/tx/0x3f68a688b33691089e3ff2c3d8614ffd0e56db45b789a2db898c63114efe9e73) | 67163600 / 1791983130 | FundsReserved, StateVersionAdvanced | 15534456 / 842277 / 644982 / 2000000 → 15532140 / 842277 / 644982 / 2000000 | success |
| reserve-1 | funder | [receipt](https://explorer.testnet.arc.io/tx/0xeeb50439325cb0b5e14664408dd3a2b0b69e79102672b0583b1b2d7a603fcafd) | 67163603 / 1791983131 | FundsReserved, StateVersionAdvanced | 15532140 / 842277 / 644982 / 2000000 → 15530311 / 842277 / 644982 / 2000000 | success |
| submit-0 | recipient1 | [receipt](https://explorer.testnet.arc.io/tx/0x76669c1a5f2b3f59e2349d4712095e227269845f9fc8c19a480ad268dceb4ffa) | 67163609 / 1791983134 | EvidenceSubmitted, StateVersionAdvanced | 15530311 / 842277 / 644982 / 2000000 → 15530311 / 839392 / 644982 / 2000000 | success |
| approve-0 | verifier | [receipt](https://explorer.testnet.arc.io/tx/0xa970129f0e5b4ca3e99fcb1d31a389005a048e48a05f7a079a57a3b3f05cd5c4) | 67163612 / 1791983136 | EvidenceReviewed, StateVersionAdvanced | 15530311 / 839392 / 644982 / 2000000 → 15530311 / 839392 / 644982 / 2000000 | success |
| challenge-0 | funder | [receipt](https://explorer.testnet.arc.io/tx/0xb043edf7715752c7953086bab23196e949879d38e3a896119436a277722aa3f1) | 67163615 / 1791983137 | DisputeOpened, StateVersionAdvanced | 15530311 / 839392 / 644982 / 2000000 → 15528231 / 839392 / 644982 / 2000000 | success |
| arbitration-payout | primaryArbiter | [receipt](https://explorer.testnet.arc.io/tx/0x12c1d620ed313de2af2f26a52f9856cf527722c38b7be2196458aac21589d526) | 67163619 / 1791983139 | MilestoneClaimable, DisputeResolved, StateVersionAdvanced | 15528231 / 839392 / 644982 / 2000000 → 15528231 / 839392 / 644982 / 2000000 | success |
| payout-0 | funder | [receipt](https://explorer.testnet.arc.io/tx/0x23b3369e2e5c7c7b4158bdd8fcc88cf8399fbd9731aac88a9e8d0dc69a673d57) | 67163624 / 1791983142 | Transfer, PaymentSettled, StateVersionAdvanced | 15528231 / 839392 / 644982 / 2000000 → 15524167 / 1439392 / 1044982 / 1000000 | success |
| propose-cancel | funder | [receipt](https://explorer.testnet.arc.io/tx/0xf8a4e5f063261033b88669388a1cde07bc9371f7c0f551a33fa0c74d6652b4e6) | 67163629 / 1791983144 | CancellationProposed, CancellationApproval | 15524167 / 1439392 / 1044982 / 1000000 → 15521391 / 1439392 / 1044982 / 1000000 | success |
| cancel-approved-recipient1 | recipient1 | [receipt](https://explorer.testnet.arc.io/tx/0x1e8cb9d9e601e48aa8e8f8ed319aa1e25789e8c1626d61ae2d87b1d9f9f1ef0d) | 67163633 / 1791983146 | CancellationApproval | 15521391 / 1439392 / 1044982 / 1000000 → 15521391 / 1437894 / 1044982 / 1000000 | success |
| cancel-approved-recipient2 | recipient2 | [receipt](https://explorer.testnet.arc.io/tx/0x46c2f8b11b4afda2241b44b3d4f07e85edf7af34c293b18bddec938c175d1a41) | 67163636 / 1791983148 | CancellationApproval | 15521391 / 1437894 / 1044982 / 1000000 → 15521391 / 1437894 / 1043424 / 1000000 | success |
| cancel | funder | [receipt](https://explorer.testnet.arc.io/tx/0xd2733de0a935b70b1360521682eb445c6a3d78ed49cd00d7964dd1e51e0c8659) | 67164189 / 1791983428 | RefundQueued, MilestoneCancelled, ProjectCancelled, StateVersionAdvanced | 15521391 / 1437894 / 1043424 / 1000000 → 15518162 / 1437894 / 1043424 / 1000000 | success |
| refund | funder | [receipt](https://explorer.testnet.arc.io/tx/0xca5e234e40cb07284c66d774149cb9a12511b03725792f07e31ad990a4dfdd3c) | 67164194 / 1791983431 | Transfer, RefundSettled, StateVersionAdvanced | 15518162 / 1437894 / 1043424 / 1000000 → 16515163 / 1437894 / 1043424 / 0 | success |

The payout receipt emitted two `PaymentSettled` events: **600,000** to `0x21A601D380A667151B04Bd81fbf9F0d10E0EDF7a` and **400,000** to `0x89ED790300cb0186BB0E94dd4fb9Bb1C3c51E16C`. Recipient balances increased by those exact amounts at payout; the funder sent it and paid its gas. Both destinations match immutable constructor recipients. Refund emitted `RefundSettled` for **1,000,000** to the original funder; gas explains its net wallet increase below one USDC.

## Actual timing and coverage limits

- Verifier approval: **1791983136**, 2026-10-14T13:05:36+00:00.
- Funder challenge: **1791983137**, 2026-10-14T13:05:37+00:00, strictly before the 48-hour challenge close.
- Primary arbiter resolution: **1791983139**, 2026-10-14T13:05:39+00:00, strictly before the seven-day arbitration deadline. Primary arbitration is permitted immediately; backup authority still requires 72 hours.
- Unchallenged earliest payout would have been **1792155936**, 2026-10-16T13:05:36+00:00.
- Default arbitration earliest continuation would have been **1792587937**, 2026-10-21T13:05:37+00:00.

Those latter times were **not waited through**. The chosen lawful arbitration path completed; this terminal vault has no pending continuation. Live unchallenged maturity, backup activation, review timeout, rejection/resubmission and seven-day default remain **NOT TESTED** on this vault. They require separate new scenarios and real waiting; local `vm.warp` boundary tests are not live timeout evidence. One/five-recipient extremes were tested locally; this live rehearsal used two recipients.

Negative cases (deposit-before-lock, outsider-acceptance, later-reservation-cannot-skip, wrong-verifier, payout-before-earned, double-payout, cancel-without-unanimous-consent) were reverted unsigned **eth_call simulations**, not failed broadcast transactions. They are separate from the 22 successful receipts. Testnet RPC rate limiting interrupted one receipt read; its already-submitted hash was retained, independently confirmed, and execution resumed without redeployment or duplicate acceptance. No security control, deadline or policy was changed. No new explorer source-verification publication is claimed; source provenance is established through exact transaction input and runtime comparison.

Independent final reads also confirmed agreementLocked=true, acceptanceCount=6, projectCancelled=true, milestone 0 Paid and milestone 1 Cancelled. The token Approval event was checked for the exact vault and 2,000,000 allowance. All receipt senders and targets match their recorded roles/contracts.
