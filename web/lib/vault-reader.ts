import { isAddress, getAddress, keccak256, toHex, type Address } from "viem";
import { network } from "./network";
import { arcClient as client } from "./arc-client";
import { vaultAbi } from "./vault-abi";

export const chain = network.chain;
export const explorer = network.explorer;
export const proofVault = network.proofVault;
export const statuses = ["Planned", "Reserved", "Submitted", "Rejected", "Approved", "Disputed", "Claimable", "Paid", "Cancelled"];

export function addressFrom(value: string): Address {
  if (!isAddress(value)) throw new Error("Enter a valid EVM vault address (0x followed by 40 characters).");
  return getAddress(value);
}
export function shortAddress(value: string) { return `${value.slice(0, 6)}…${value.slice(-4)}`; }
export function formatUSDC(value: bigint) {
  const whole = value / 1_000_000n;
  const fraction = (value % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return `${whole.toLocaleString("en-US")}${fraction ? `.${fraction}` : ""}`;
}

export async function readVault(address: Address) {
  if (await client.getChainId() !== chain.id) throw new Error("RPC network mismatch. Vault data could not be verified.");
  const block = await client.getBlock();
  const read = <N extends typeof vaultAbi[number]["name"]>(functionName: N) => client.readContract({ address, abi: vaultAbi, functionName, blockNumber: block.number });
  const [schema, deploymentChain, terms, accounting, value, locked, cancelled, acceptanceCount] = await Promise.all([
    read("TERMS_SCHEMA"), read("deploymentChainId"), read("getTerms"), read("getProjectAccounting"),
    read("contractValue"), read("agreementLocked"), read("projectCancelled"), read("acceptanceCount"),
  ]);
  // Narrow each inferred union once, using the generated ABI for runtime decoding.
  const t = terms as Extract<typeof terms, { funder: Address }>;
  const a = accounting as readonly [bigint, bigint, bigint, bigint, bigint, bigint];
  if (schema !== keccak256(toHex("LURRO_PROJECT_TERMS_V1_2")) || deploymentChain !== BigInt(chain.id) || t.usdcToken.toLowerCase() !== "0x3600000000000000000000000000000000000000") throw new Error(`This address does not report a supported Lurro v1.2 ${network.label} vault.`);
  if (t.milestones.length < 1 || t.milestones.length > 3 || t.recipients.length < 1 || t.recipients.length > 5) throw new Error("This address does not report supported P0 milestone and recipient limits.");
  if (a[0] !== a.slice(1).reduce((sum, amount) => sum + amount, 0n)) throw new Error("Vault accounting is inconsistent. Summary withheld.");
  const milestones = await Promise.all(t.milestones.map((m, index) => client.readContract({ address, abi: vaultAbi, functionName: "effectiveStatus", args: [BigInt(index)], blockNumber: block.number }).then(status => ({ ...m, status, index }))));
  const actors = [t.funder, t.verifier, t.primaryArbiter, t.backupArbiter, ...t.recipients];
  const accepted = await Promise.all([...new Set(actors.map(x => x.toLowerCase()))].map(async actor => ({ address: actor, accepted: await client.readContract({ address, abi: vaultAbi, functionName: "acceptedAgreement", args: [getAddress(actor)], blockNumber: block.number }) })));
  return { address, terms: t, accounting: a, value: value as bigint, locked: locked as boolean, cancelled: cancelled as boolean, acceptanceCount: acceptanceCount as bigint, milestones, accepted, block: block.number, timestamp: Number(block.timestamp) * 1000 };
}
export type Vault = Awaited<ReturnType<typeof readVault>>;
export function rolesFor(vault: Vault, wallet?: string) {
  if (!wallet) return ["Observer"];
  const account = wallet.toLowerCase();
  const t = vault.terms;
  const roles: string[] = [];
  if (t.funder.toLowerCase() === account) roles.push("Funder");
  if (t.recipients.some(x => x.toLowerCase() === account)) roles.push("Recipient");
  if (t.verifier.toLowerCase() === account) roles.push("Verifier");
  if ([t.primaryArbiter, t.backupArbiter].some(x => x.toLowerCase() === account)) roles.push("Arbiter");
  if (t.milestones.some(x => x.submitter.toLowerCase() === account) && !roles.includes("Recipient")) roles.push("Submitter");
  return roles.length ? roles : ["Observer"];
}
export function vaultStatus(v: Vault) {
  if (v.cancelled) return "Cancelled";
  if (!v.locked) return "Awaiting agreement";
  if (v.milestones.every(m => m.status === 7 || m.status === 8)) return "Completed";
  if (v.milestones.some(m => m.status === 5)) return "Disputed";
  return "Active";
}
export function pendingFor(v: Vault, wallet?: string) {
  if (!wallet) return [];
  const account = wallet.toLowerCase();
  const roles = rolesFor(v, account);
  const pending: string[] = [];
  if (!v.locked && v.accepted.some(a => a.address === account && !a.accepted)) pending.push("Review and accept the agreement");
  if (!v.locked && v.accepted.every(a => a.accepted)) pending.push("All parties accepted · agreement ready to lock");
  if (v.locked && roles.includes("Verifier")) v.milestones.filter(m => m.status === 2).forEach(m => pending.push(`Milestone ${m.index + 1} · evidence needs review`));
  if (v.locked) v.milestones.filter(m => m.status === 6).forEach(m => pending.push(`Milestone ${m.index + 1} · ready for atomic settlement`));
  if (roles.includes("Arbiter") && v.milestones.some(m => m.status === 5)) pending.push("Open dispute · check arbiter eligibility and deadline");
  if (roles.includes("Funder") && v.accounting[3] > 0n) pending.push("Refund available for the original funder");
  return pending;
}
