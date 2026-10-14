import { network } from "./network";

// Mainnet payment proof is the owner-operated live demonstration; Testnet history stays separate.
export const mainnetVault = "0xE3f07fdFa237B159608Fa251CB5E16A3C4351A2b";
export const publicProof = network.mainnet ? {
  vault: `https://explorer.arc.io/address/${mainnetVault}`,
  title: "Mainnet payment proof",
  description: "Inspect the vault, accepted agreement, and successful USDC payout.",
  summary: "Our owner-operated Arc Mainnet demonstration completed agreement acceptance, funding, evidence review, challenge/arbitration, and a 1 USDC payout to the immutable recipient. Inspect the source and settlement receipts.",
  disclosure: "Owner-operated Mainnet demo · real USDC · unaudited prototype",
  cta: "Inspect the Mainnet vault",
  report: `/app/agreement/?project=${mainnetVault}`,
  reportLabel: "Review the Mainnet agreement",
  cards: [
    { title: "Verified source", detail: "Exact creation and runtime match on Sourcify", href: "https://sourcify.dev/server/v2/verify/c94c027a-c98e-4192-be17-ba381b7a9793", kind: "code" },
    { title: "Successful payout", detail: "Follow the 1 USDC transfer to the agreed recipient", href: "https://explorer.arc.io/tx/0x4f401afcea8f7f2cb4eec40cb0e31d0c0125385c50521b4a0ab08e1a1ba6a72d", kind: "route" },
    { title: "Project agreement", detail: "Read the immutable recipients, allocations, and rules", href: `/app/agreement/?project=${mainnetVault}`, kind: "fund" },
  ],
} : {
  vault: "https://explorer.testnet.arc.io/address/0xa3b6db6a52ff3cf32438c0989af041d77d3dacae?tab=contract",
  title: "Testnet proof",
  description: "Inspect the test vault and recorded settlement receipts.",
  summary: "Our Arc Testnet self-test completed agreement acceptance, funding, payout, and cancellation/refund. The receipts are yours to inspect.",
  disclosure: "Automated test wallets · test USDC · unaudited prototype",
  cta: "Inspect the Testnet vault",
  report: "https://github.com/amantajatii/Lurro/blob/main/contracts/TESTNET-PROOF.md",
  reportLabel: "Read the self-test report",
  cards: [
    { title: "Verified contract", detail: "Inspect the source and agreed rules", href: "https://explorer.testnet.arc.io/address/0xa3b6db6a52ff3cf32438c0989af041d77d3dacae?tab=contract", kind: "code" },
    { title: "Successful payout", detail: "Follow the transfer to its recipients", href: "https://explorer.testnet.arc.io/tx/0xc1b3b26acf41b2e347234f4c8115982e12d5d86edb27f6d7e9fde6731856a628", kind: "route" },
    { title: "Cancellation & refund", detail: "See funds return to the original funder", href: "https://explorer.testnet.arc.io/tx/0x74ae5db2eec9b7c0ebe2e1cd6d4ea40c6fc2a9a6e574617d63d203f87f52e585", kind: "fund" },
  ],
};
