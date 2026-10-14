# Mainnet automated payment demonstration

Vault: `0xE3f07fdFa237B159608Fa251CB5E16A3C4351A2b` · Arc Mainnet (5042).

All five roles were controlled by the owner. This bounded demonstration is not an independent audit, independent user trial, or third-party work dispute. Transactions were locally signed with existing owner-authorized keys.

The frozen ProjectVault artifact was deployed, all five named parties accepted, and the agreement was locked. The funder approved exactly 1 USDC, deposited 1 USDC, and fully reserved the single milestone. Technical delivery evidence was committed and reviewed. An owner-controlled approval challenge opened the contract’s dispute path; the eligible primary arbiter authorized payout without changing any immutable deadlines.

Successful payout: [Mainnet receipt](https://explorer.arc.io/tx/0x4f401afcea8f7f2cb4eec40cb0e31d0c0125385c50521b4a0ab08e1a1ba6a72d). The original immutable recipient `0x21A601D380A667151B04Bd81fbf9F0d10E0EDF7a` gained exactly 1,000,000 micro-USDC (1 USDC) across receipt block 25967171. The vault ended at zero with accounting D=1, P=1, A=R=Q=F=0 USDC.

Conservative Funder outflow including the earlier deployment, new deployment, gas provisioning and payment: 1.343600148 USDC, below the authorized 5-USDC cap. Gas fees across both deployments and this lifecycle: 0.152916769 USDC. Prefunded gas balances remain in the owner-controlled role wallets.

Creation bytecode hash: `0x30d6d7e4c3dfd761fc3d4def540ae62ac513195cc9ee98dd665d6b4e335c8f70`. New deployed runtime hash: `0x8ab5232962ac12a35afb51be0bc5ef41d17012c56715275556d33380d65c1efb`.

[Sourcify exact creation/runtime verification](https://sourcify.dev/server/v2/verify/c94c027a-c98e-4192-be17-ba381b7a9793). Financial source and compiler settings were unchanged: Solidity 0.8.30, optimizer 200, via IR, Cancun.

## Completed receipts

| Action | Actor role | Receipt |
|---|---|---|
| deployment | funder | [0xb87b95108b…](https://explorer.arc.io/tx/0xb87b95108b851ccc641500d3603ea8cc8d6d571ac3a3b1a0455c728711810d35) |
| gas-recipient | funder | [0x1704793d36…](https://explorer.arc.io/tx/0x1704793d36aa9da1be4eb12269484392064c143769a242c62a523c963dc484cb) |
| gas-verifier | funder | [0x8966ca8c0f…](https://explorer.arc.io/tx/0x8966ca8c0ff3a37c044da89ca1584d270ca28f4bb834d3115b06b9a538a7e92b) |
| gas-primaryArbiter | funder | [0xc5054c0ef2…](https://explorer.arc.io/tx/0xc5054c0ef2a674c178e3ebdcbb9c48f0e2cba07de99cfc70e08c92f26e6cd6da) |
| gas-backupArbiter | funder | [0x9bd08afffc…](https://explorer.arc.io/tx/0x9bd08afffcf530c91c17bdf0003f532b69ba40cde000724cf040c4be0ba29c1b) |
| accept-funder | funder | [0x76f91d9a61…](https://explorer.arc.io/tx/0x76f91d9a61e75e2111a6cd133236f998c0f3170c5ba59c5494823fe01203f0d1) |
| accept-recipient | recipient | [0xf7166edb0c…](https://explorer.arc.io/tx/0xf7166edb0ce5271ca66bfbcb323144d307ba1648e986bfa6ad856d8970540b8e) |
| accept-verifier | verifier | [0xa43c03753d…](https://explorer.arc.io/tx/0xa43c03753dc2b6b8cbd6b16313e94cf2eb5b42127a545f45993d60e203228352) |
| accept-primaryArbiter | primaryArbiter | [0x46853d1680…](https://explorer.arc.io/tx/0x46853d1680df28854d49dc4a0b19947cceb2ae0053efc78f85103aad15f6a17b) |
| accept-backupArbiter | backupArbiter | [0x0dddfd7d46…](https://explorer.arc.io/tx/0x0dddfd7d4610c4ce50cc3e9f500d69e425a28c558f2188a3cd2bcc8d08edc751) |
| lock | funder | [0xb75651a60d…](https://explorer.arc.io/tx/0xb75651a60d2debec48a4f6dc0e07e34d55c9a644d808aee0e1afbc48f8e91a81) |
| approveUSDC | funder | [0x92cf77df93…](https://explorer.arc.io/tx/0x92cf77df934c8e0e0a9bdf1361813a3bcc9f5b3920aa5d33731b9ec51913367a) |
| deposit | funder | [0x3d9da64f1c…](https://explorer.arc.io/tx/0x3d9da64f1cc6eab22212e8b1bfbc7bc0b29242ac19ee420e8758ee39ee6edf33) |
| reserve | funder | [0x1f29db5858…](https://explorer.arc.io/tx/0x1f29db58586e8444e606cf1705d46fe9fb529e76736fb743e5f3388fd29d4673) |
| submitEvidence | recipient | [0x0652a83939…](https://explorer.arc.io/tx/0x0652a83939d0d83780aef19d5b5fee2786974d9cf9cb978f569f0b3a14f7723c) |
| approveEvidence | verifier | [0x5794ae05b4…](https://explorer.arc.io/tx/0x5794ae05b486f489013da8e73d7b1ea00d71f4c41db0b60e30d8a393cf242866) |
| challengeApproval | funder | [0xd4d65c0a86…](https://explorer.arc.io/tx/0xd4d65c0a860d36bdfd78017f26c97a874ef2c4cc09795c7ca5647cbf0a28d58d) |
| resolveDispute | primaryArbiter | [0x81ecd85f32…](https://explorer.arc.io/tx/0x81ecd85f3202b6d6a2f0c8800b6c92522583c63f803f3a7a965688370a8993de) |
| executePayout | funder | [0x4f401afcea…](https://explorer.arc.io/tx/0x4f401afcea8f7f2cb4eec40cb0e31d0c0125385c50521b4a0ab08e1a1ba6a72d) |

Exact events, receipt-block balances, and independent payout balance comparison are in `MAINNET-DEMO-PROOF.json`. No refund or cancellation was exercised in this one-milestone Mainnet payout demonstration. Ordinary unchallenged 48-hour finalization was not exercised; the valid primary arbitration route was exercised.

Video captures show the real Mainnet app read through a local read-only RPC proxy. Financial transactions were executed by the authorized local runner, not shown as wallet clicks. Captures are edited desktop screenshots, not an uninterrupted UI recording.
