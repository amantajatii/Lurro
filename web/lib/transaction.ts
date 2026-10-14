import { network } from "./network";
import { isAddress, isHex, type Address, type Hex } from "viem";
export type PendingAction = { address: Address; target: Address; account: Address; input: Hex; hash: Hex; label: string; chainId: number };
export function restoreAction(raw: string | null, address?: Address): PendingAction | undefined {
  try {
    if (!raw || raw.length > 10000 || !address) return;
    const tx = JSON.parse(raw) as PendingAction;
    if (tx.chainId !== network.chain.id || !isAddress(tx.address) || tx.address.toLowerCase() !== address.toLowerCase() || !isAddress(tx.account) || !isAddress(tx.target) || ![address.toLowerCase(),"0x3600000000000000000000000000000000000000"].includes(tx.target.toLowerCase()) || !isHex(tx.input) || tx.input.length < 10 || !/^0x[0-9a-fA-F]{64}$/.test(tx.hash) || typeof tx.label !== "string" || tx.label.length > 100) return;
    return { address:tx.address,target:tx.target,account:tx.account,input:tx.input,hash:tx.hash,label:tx.label,chainId:tx.chainId };
  } catch { return; }
}
export function transactionMatches(observed: { to?: string | null; from: string; input: string; value: bigint }, expected: PendingAction) {
  return observed.to?.toLowerCase() === expected.target.toLowerCase() && observed.from.toLowerCase() === expected.account.toLowerCase() && observed.input.toLowerCase() === expected.input.toLowerCase() && observed.value === 0n;
}
