# Authorized limited Mainnet deployment

14 October 2026. The owner subsequently explicitly requested **deploy mainnet dulu**, superseding the earlier no-broadcast task scope **for this deployment only**. No independent audit or automatic owner GO signature is claimed.

- Arc Mainnet chain **5042**.
- Vault: [0x7c9dfbe425c170e49da68459a72e4f7e9f58dd85](https://explorer.arc.io/address/0x7c9dfbe425c170e49da68459a72e4f7e9f58dd85). This address also exists on Testnet: those are different contracts on different chains.
- Successful deployment receipt: [0xd2e7a10cf0ce913882d633534f9603373c72bf5b11341a218257907ea8bc54a9](https://explorer.arc.io/tx/0xd2e7a10cf0ce913882d633534f9603373c72bf5b11341a218257907ea8bc54a9).
- Deployment block **25950620**, UTC **2026-10-14T16:29:09Z**.
- Funder/signer `0xe22a343a3B347c13fE26a1Cb3530867c012140cb`, nonce 0; constructor value 0.
- Actual gas **3252346**, effective gas price **20000001153 wei**; actual cost **0.065046924 USDC**. Maximum transaction fee was bounded at **0.094444589 USDC** (<0.15 deployment cap and owner total budget 5 USDC).
- Source/test candidate dc0b1153bdf3902405a65fa43baab0ce0354d422; source HEAD at deployment 0a8f0d8ee1058ba04158b9337fe4e4f585f0749c; public code c91e264ae117c24bafd3d68a6a64322fe66d4be4 has identical contract source/artifact. Later differences are documentation/navigation.
- Solidity 0.8.30+73712a01, optimizer 200, via IR, Cancun.
- Creation bytecode keccak256 `0x30d6d7e4c3dfd761fc3d4def540ae62ac513195cc9ee98dd665d6b4e335c8f70`.
- Deployed runtime keccak256 `0x6c4da87183cc2c805c13c2610008c349f085bb9d5289b3b31c1f4cd193668c66`; immutable-normalized runtime matched frozen artifact.
- Exact document hash `0x9ea20134bb9c9be30d39d9850da79810326dedfbfd17c6d4a0f8d80bcd9ab455`; original bytes in [MAINNET-AGREEMENT.json](MAINNET-AGREEMENT.json).
- Actual terms hash `0x880bcd37d190e23939806a5943a03f69908d14215c632a2d49806c8ccd32584b` matched the simulated chain/vault-bound hash and exact constructor terms.

At verification block **25950627**, agreementLocked=false, acceptanceCount=0/5, contractValue=1,000,000 micro-USDC, all accounting buckets zero and actual vault USDC balance zero. All addresses, allocation, deadlines and policies read back exactly. **No acceptance, agreement lock, approval, funding, reservation, evidence, payout or refund was performed.** Recipient is 0x67D1086B3A620e984e6d5147A1481Cd1375cbd81 with 1 USDC allocation. Submission deadline remains 15 October 2026 22:08:51 WIB; it was not reset at deployment.

The private signer was loaded in process from an ignored 0600 contract-only local env file. It was not placed in shell arguments, logs, web bundles or commits. A signed deployment hash was checkpointed before sending; only one transaction was broadcast. Earlier signed-request zero-value normalization failed before any broadcast/record and was corrected locally; no second nonce/deployment resulted.

**Public source verification PASS on Sourcify:** creation and runtime both `exact_match`, verified at 2026-10-14T16:33:13Z. [Verification record](https://sourcify.dev/server/v2/verify/5611443c-44d3-41ca-ac91-ebd6bf0929c5). Arc Blockscout verification remains blocked by Cloudflare HTTP 403; its explorer badge is not claimed. Sourcify also submitted to Arc Etherscan, but its final external status was not checked. Source verification is not an independent audit.

Remaining budget planning: ~4.934953 USDC of the owner's 5-USDC cap remains; actual funder wallet balance after deployment was ~5.488425 USDC. The deposit remains capped by terms at 1 USDC. Participant gas provisioning and all subsequent real-USDC actions require separate owner instructions. Frontend Mainnet writes remain disabled; deployment did not change any frontend release flag or network deployment.
