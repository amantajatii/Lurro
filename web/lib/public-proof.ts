import { network } from "./network";

// Deployment evidence is distinct from payment evidence: no Mainnet payout is claimed.
export const mainnetVault = "0x7c9dfbe425c170e49da68459a72e4f7e9f58dd85";
export const publicProof = network.mainnet ? {
  vault: `https://explorer.arc.io/address/${mainnetVault}`,
  title: "Mainnet deployment",
  description: "Inspect the deployed contract and creation receipt.",
  summary: "Lurro is deployed on Arc Mainnet. Inspect the successful contract creation, verified source, and immutable agreement directly. Deployment evidence is separate from funding and settlement receipts.",
  disclosure: "Mainnet deployment · USDC · unaudited prototype",
  cta: "Inspect the Mainnet vault",
  report: `/app/agreement/?project=${mainnetVault}`,
  reportLabel: "Review the Mainnet agreement",
  cards: [
    { title: "Verified source", detail: "Exact creation and runtime match on Sourcify", href: "https://sourcify.dev/server/v2/verify/5611443c-44d3-41ca-ac91-ebd6bf0929c5", kind: "code" },
    { title: "Successful deployment", detail: "Inspect the contract creation receipt on Arc Mainnet", href: "https://explorer.arc.io/tx/0xd2e7a10cf0ce913882d633534f9603373c72bf5b11341a218257907ea8bc54a9", kind: "route" },
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
