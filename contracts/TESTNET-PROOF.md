# Arc Testnet integration self-test

Completed 12 October 2026, 15:39:55 UTC (22:39:55 WIB). Chain ID 5042002. Six freshly generated wallets were controlled by the same automated test runner. This proves technical Testnet integration, not independent human verification, commercial adoption, Mainnet operation or an audited contract.

## Deployed contract

- Vault: [`0xa3b6db6a52ff3cf32438c0989af041d77d3dacae`](https://explorer.testnet.arc.io/address/0xa3b6db6a52ff3cf32438c0989af041d77d3dacae?tab=contract)
- Source verified through Blockscout: `Pass - Verified`. Solidity 0.8.30, optimizer 200 runs, via IR, Cancun target; local `src/ProjectVault.sol`.
- Agreement hash: `0x2f23cf72da4ca62ce3ed33386965485b68c66c56df77a3f790b7c9bf04b09f0b`; independently recomputed from constructor terms, deployed address and chain ID and checked against the live getter.
- Test agreement explicitly identifies the project as an automated integration self-test. It does not represent real clients or independent participants.

## Successful on-chain evidence

| Action | Receipt |
| --- | --- |
| Deploy | [Transaction](https://explorer.testnet.arc.io/tx/0x0e036d34c61233cb9460e107ecc4cd4637d02b28b3e820c979c813023d605af9) |
| Deposit 2 test USDC | [Transaction](https://explorer.testnet.arc.io/tx/0xf2a45669f535642e5b450ce5297b2994af9ff5141a7cc4ce23ba86b93c5bc4a1) |
| Verifier approval | [Transaction](https://explorer.testnet.arc.io/tx/0xdd5ae4ef230d0c4fe600f3e034513f25efeb2163a29a3c5d1e15b7d72a5fd931) |
| Funder challenge | [Transaction](https://explorer.testnet.arc.io/tx/0xfa1a6e9f177aa5b261f6150d453b1221d323d372cb640ff1b988f9dfb0bd98b9) |
| Primary arbitration authorizes payout | [Transaction](https://explorer.testnet.arc.io/tx/0xd059920fc278a145f00563997104aaf3115bb14322ec8c0af8f1e5392211afbf) |
| Atomic payout: 0.6 + 0.4 test USDC | [Transaction](https://explorer.testnet.arc.io/tx/0xc1b3b26acf41b2e347234f4c8115982e12d5d86edb27f6d7e9fde6731856a628) |
| Unanimous cancellation of unsubmitted second milestone | [Transaction](https://explorer.testnet.arc.io/tx/0xc8ec01b72bd59ac3ca25631bee65884cc8f31a039790d43015416052597ab9aa) |
| Refund 1 test USDC to original funder | [Transaction](https://explorer.testnet.arc.io/tx/0x74ae5db2eec9b7c0ebe2e1cd6d4ea40c6fc2a9a6e574617d63d203f87f52e585) |

Every broadcast receipt was checked for success. All six roles explicitly accepted before lock; both milestones were fully reserved. Payout receipts emitted two matching `PaymentSettled` events; ERC-20 balances of the recipients increased exactly by their respective 600,000 and 400,000 base-unit entitlements during payout (recipients did not submit transactions during this check).

Recipients:

- 0.6 USDC: `0x21A601D380A667151B04Bd81fbf9F0d10E0EDF7a`
- 0.4 USDC: `0x89ED790300cb0186BB0E94dd4fb9Bb1C3c51E16C`
- Original funder/refund recipient: `0xE882c1F3b40c1f2C121Df8E46ade52fef8f8C44C`

## Final live accounting

All figures below are test USDC, not real-money payments:

| Deposited | Available | Reserved | Refund owed | Paid | Refunded |
| --- | --- | --- | --- | --- | --- |
| 2 | 0 | 0 | 0 | 1 | 1 |

The runner asserted `D = A + R + Q + P + F`, actual ERC-20 balance covers outstanding liabilities, and active entitlement funding cap holds. Both milestones are terminal; project cancellation was executed.

## Negative cases

Live RPC `eth_call` simulations confirmed contract reverts for deposit before lock, outsider acceptance, skipping the earlier Planned milestone, wrong-wallet verifier approval, payout before earned, duplicate payout, and cancellation without unanimous consent. These are simulations of the deployed contract, **not failed broadcast transactions**.

## Limits and local custody

- Payout used the real challenge/arbitration route. The 48-hour earning window was not shortened or time-warped. Backup activation, 7-day default, review timeout, rejection/resubmission, token restrictions and other branches remain locally tested; they were not demonstrated through live Testnet transactions in this run.
- Secrets, runner checkpoints, private keys and faucet-funded test wallets live in ignored `contracts/.testnet/` with wallet file permissions 0600 and directory permissions 0700. Never commit that directory or fund these test wallets with meaningful assets. Public evidence in this document contains no private key.
- Foundry source verification establishes source/bytecode correspondence, not a security audit. Independent review and jurisdiction/participant approval remain required before meaningful Mainnet use.
