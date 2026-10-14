import { encodeAbiParameters, encodeFunctionData, keccak256, toHex, hexToBytes, type Hex } from "viem";
import { vaultAbi } from "./vault-abi";
import { agreementAbi, immutableRanges, normalizedRuntimeHash, runtimeLength } from "./agreement-abi";
import * as legacyRuntime from "./legacy-vault-runtime";
import { arcClient } from "./arc-client";
import { chain, readVault, type Vault } from "./vault-reader";
const termsParameter = vaultAbi.find(item => item.name === "getTerms")!.outputs[0];
export function computeTermsHash(vault: Vault): Hex {
  return keccak256(encodeAbiParameters([{ type: "bytes32" }, { type: "uint256" }, { type: "address" }, termsParameter], [keccak256(toHex("LURRO_PROJECT_TERMS_V1_2")), BigInt(chain.id), vault.address, vault.terms]));
}
export function matchesVaultRuntime(code?: Hex) {
  if (!code) return false;
  return [{ runtimeLength, immutableRanges, normalizedRuntimeHash }, legacyRuntime].some(build => {
    if (code.length !== build.runtimeLength * 2 + 2) return false;
    const bytes = hexToBytes(code);
    for (const { start, length } of build.immutableRanges) bytes.fill(0, start, start + length);
    return keccak256(toHex(bytes)) === build.normalizedRuntimeHash;
  });
}
export async function readAgreement(address: Vault["address"]) {
  const vault = await readVault(address);
  const [termsHash, code] = await Promise.all([
    arcClient.readContract({ address, abi: agreementAbi, functionName: "termsHash", blockNumber: vault.block }),
    arcClient.getCode({ address, blockNumber: vault.block }),
  ]);
  return { vault, termsHash, runtimeMatches: matchesVaultRuntime(code), termsMatch: computeTermsHash(vault) === termsHash };
}
export type AgreementSnapshot = Awaited<ReturnType<typeof readAgreement>>;
export type ReviewedDocument = { hash: Hex; filename: string; name?: string; description?: string; scopes?: { title: string; scope: string }[] };
// Compare objects by keys, not insertion order, while allowing exact integer strings.
function equalTerms(actual: unknown, expected: unknown): boolean {
  if (typeof expected === "bigint") return typeof actual === "string" && /^\d+$/.test(actual) && BigInt(actual) === expected;
  if (typeof expected === "string") return typeof actual === "string" && (expected.startsWith("0x") ? actual.toLowerCase() === expected.toLowerCase() : actual === expected);
  if (Array.isArray(expected)) return Array.isArray(actual) && actual.length === expected.length && expected.every((v, i) => equalTerms(actual[i], v));
  if (expected && typeof expected === "object") {
    if (!actual || typeof actual !== "object" || Array.isArray(actual)) return false;
    const entries = Object.entries(expected);
    return Object.keys(actual).length === entries.length && entries.every(([k, v]) => equalTerms((actual as Record<string, unknown>)[k], v));
  }
  return actual === expected;
}
export function reviewDocument(bytes: Uint8Array, filename: string, vault: Vault): ReviewedDocument {
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new Error("Choose a non-empty agreement file up to 2 MB.");
  const hash = keccak256(toHex(bytes));
  if (hash !== vault.terms.signedDocumentHash) throw new Error("This file does not match the vault's agreement document hash. Ask the funder for the exact original file.");
  let parsed: unknown;
  try { parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); } catch { return { hash, filename }; }
  const doc = parsed as { schema?: string; chainId?: number; name?: unknown; description?: unknown; terms?: unknown; scopes?: unknown };
  if (doc?.schema !== "LURRO_PROJECT_DOCUMENT_V1_2") return { hash, filename };
  const base = { ...vault.terms }; delete (base as Partial<typeof base>).signedDocumentHash;
  if (doc.chainId !== chain.id || !equalTerms(doc.terms, base)) throw new Error("The document hash matches, but its encoded terms do not match this vault. Do not accept this agreement.");
  if (typeof doc.name !== "string" || typeof doc.description !== "string" || !Array.isArray(doc.scopes) || doc.scopes.length !== vault.milestones.length) throw new Error("The committed project document is incomplete.");
  const scopes = doc.scopes.map((s: unknown, i: number) => {
    const entry = s as { title?: unknown; scope?: unknown };
    if (typeof entry?.title !== "string" || typeof entry.scope !== "string" || keccak256(toHex(entry.scope)) !== vault.milestones[i].scopeHash) throw new Error("The document scope does not match the milestone commitment.");
    return { title: entry.title, scope: entry.scope };
  });
  return { hash, filename, name: doc.name, description: doc.description, scopes };
}
export function agreementEligibility(snapshot: AgreementSnapshot, account?: string, document?: ReviewedDocument) {
  const trusted = snapshot.runtimeMatches && snapshot.termsMatch;
  const party = snapshot.vault.accepted.find(a => a.address === account?.toLowerCase());
  return {
    canAccept: trusted && !snapshot.vault.locked && !!party && !party.accepted && document?.hash === snapshot.vault.terms.signedDocumentHash,
    canLock: trusted && !snapshot.vault.locked && !!account && snapshot.vault.accepted.length === snapshot.vault.terms.recipients.length + 4 && snapshot.vault.accepted.every(a => a.accepted) && snapshot.vault.acceptanceCount === BigInt(snapshot.vault.accepted.length),
    participant: !!party, alreadyAccepted: !!party?.accepted,
  };
}
export function acceptanceReceiptMatches(snapshot: AgreementSnapshot, account: string, action: "accept" | "lock") {
  return snapshot.runtimeMatches && snapshot.termsMatch && (action === "lock" ? snapshot.vault.locked : snapshot.vault.accepted.some(a => a.address === account.toLowerCase() && a.accepted));
}

export function agreementTransactionMatches(observed: { to: string | null; from: string; input: Hex; value: bigint }, expected: { address: string; account: string; termsHash: Hex; action: "accept" | "lock" }) {
  const input = expected.action === "accept" ? encodeFunctionData({ abi: agreementAbi, functionName: "acceptAgreement", args: [expected.termsHash] }) : encodeFunctionData({ abi: agreementAbi, functionName: "lockAgreement" });
  return observed.to?.toLowerCase() === expected.address.toLowerCase() && observed.from.toLowerCase() === expected.account.toLowerCase() && observed.input === input && observed.value === 0n;
}
export type AgreementTransaction = { chainId: number; hash: Hex; address: Vault["address"]; account: Vault["address"]; termsHash: Hex; action: "accept" | "lock" };
export function restoreAgreementTransaction(raw: string | null, address?: Vault["address"]): AgreementTransaction | undefined {
  if (!raw || raw.length > 4096 || !address) return;
  try {
    const saved = JSON.parse(raw);
    if (saved?.chainId !== chain.id || typeof saved.address !== "string" || saved.address.toLowerCase() !== address.toLowerCase() || !/^0x[0-9a-fA-F]{64}$/.test(saved.hash) || !/^0x[0-9a-fA-F]{40}$/.test(saved.account) || !/^0x[0-9a-fA-F]{64}$/.test(saved.termsHash) || !["accept", "lock"].includes(saved.action)) return;
    return { chainId: chain.id, hash: saved.hash, address, account: saved.account, termsHash: saved.termsHash, action: saved.action };
  } catch { return; }
}
