import { getAddress, isAddress, keccak256, toHex, zeroAddress, type Hex } from "viem";
export const usdc = "0x3600000000000000000000000000000000000000" as const;
const week = 604800n;
const maxUint = (1n << 256n) - 1n;
export type RecipientDraft = { id: string; name: string; address: string };
export type MilestoneDraft = { id: string; title: string; scope: string; deadline: string; submitter: string; amounts: Record<string, string> };
export type ProjectDraft = { name: string; description: string; funder: string; verifier: string; primaryArbiter: string; backupArbiter: string; recipients: RecipientDraft[]; milestones: MilestoneDraft[] };
export function parseAmount(value: string): bigint {
  if (!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(value)) throw new Error("Use a non-negative USDC amount with at most 6 decimals.");
  const [whole, fraction = ""] = value.split(".");
  const amount = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, "0"));
  if (amount > maxUint) throw new Error("Amount exceeds the contract limit.");
  return amount;
}
function actor(raw: string, label: string) {
  const value = raw.trim();
  if (!isAddress(value) || value.toLowerCase() === zeroAddress || value.toLowerCase() === usdc.toLowerCase()) throw new Error(`${label}: enter a valid, non-zero wallet address.`);
  return getAddress(value);
}
export function validatePeople(draft: ProjectDraft) {
  if (!draft.name.trim() || !draft.description.trim()) throw new Error("Add a project name and agreement description.");
  const funder = actor(draft.funder, "Funder");
  const verifier = actor(draft.verifier, "Verifier");
  const primaryArbiter = actor(draft.primaryArbiter, "Primary arbiter");
  const backupArbiter = actor(draft.backupArbiter, "Backup arbiter");
  if (new Set([funder, verifier, primaryArbiter, backupArbiter].map(a => a.toLowerCase())).size !== 4) throw new Error("Funder, verifier, and both arbiters must have different addresses.");
  return { funder, verifier, primaryArbiter, backupArbiter };
}
export function validateRecipients(draft: ProjectDraft) {
  if (draft.recipients.length < 1 || draft.recipients.length > 5) throw new Error("P0 supports 1–5 recipients.");
  if (new Set(draft.recipients.map(r => r.id)).size !== draft.recipients.length) throw new Error("Duplicate recipient identifiers.");
  const recipients = draft.recipients.map((r, index) => {
    if (!r.name.trim()) throw new Error(`Recipient ${index + 1}: add a name.`);
    return { ...r, address: actor(r.address, `Recipient ${index + 1}`) };
  }).sort((a, b) => BigInt(a.address) < BigInt(b.address) ? -1 : 1);
  const addresses = recipients.map(r => r.address.toLowerCase());
  const roles = [draft.funder, draft.verifier, draft.primaryArbiter, draft.backupArbiter].map(a => a.trim().toLowerCase());
  if (new Set(addresses).size !== addresses.length || addresses.some(a => roles.includes(a))) throw new Error("Recipients must have different addresses, separate from all other roles.");
  return recipients;
}
export function completedProjectSteps(draft: ProjectDraft, nowSeconds: number): [boolean, boolean, boolean] {
  let people = false, recipients = false, milestones = false;
  try { validatePeople(draft); people = true; } catch { /* Incomplete fields stay unmarked. */ }
  try { validateRecipients(draft); recipients = true; } catch { /* Invalid recipients stay unmarked. */ }
  if (people && recipients) {
    try { buildProject(draft, `0x${"00".repeat(32)}`, nowSeconds); milestones = true; } catch { /* Full milestone validation includes allocation entitlements. */ }
  }
  return [people, recipients, milestones];
}
export function buildProject(draft: ProjectDraft, salt: Hex, nowSeconds: number) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(salt)) throw new Error("Invalid project salt.");
  const { funder, verifier, primaryArbiter, backupArbiter } = validatePeople(draft);
  const recipients = validateRecipients(draft);
  if (draft.milestones.length < 1 || draft.milestones.length > 3) throw new Error("P0 supports 1–3 milestones.");
  let previous = BigInt(Math.floor(nowSeconds));
  let total = 0n;
  const milestones = draft.milestones.map((m, index) => {
    if (!m.title.trim() || !m.scope.trim()) throw new Error(`Milestone ${index + 1}: describe its title and scope.`);
    const seconds = Math.floor(new Date(m.deadline).getTime() / 1000);
    if (!Number.isFinite(seconds) || BigInt(seconds) <= previous || BigInt(seconds) + week >= (1n << 64n)) throw new Error("Submission deadlines must be in the future and increase with each milestone.");
    previous = BigInt(seconds);
    const submitter = recipients.find(r => r.id === m.submitter);
    if (!submitter) throw new Error(`Milestone ${index + 1}: choose a recipient to submit evidence.`);
    const amounts = recipients.map(r => parseAmount(m.amounts[r.id] || "0"));
    const subtotal = amounts.reduce((a, b) => a + b, 0n);
    if (!subtotal) throw new Error(`Milestone ${index + 1}: allocate a positive USDC amount.`);
    total += subtotal;
    if (total > maxUint) throw new Error("Project total exceeds the contract limit.");
    return { submitter: submitter.address, submissionDeadline: BigInt(seconds), finalEvidenceDeadline: BigInt(seconds) + week, scopeHash: keccak256(toHex(m.scope.trim())), recipientAmounts: amounts };
  });
  recipients.forEach((r, i) => { if (!milestones.some(m => m.recipientAmounts[i] > 0n)) throw new Error(`${r.name.trim() || r.address}: needs an allocation in at least one milestone.`); });
  const base = { projectSalt: salt, funder, usdcToken: usdc, verifier, primaryArbiter, backupArbiter, recipients: recipients.map(r => r.address), milestones, reviewPeriodSeconds: 259200, approvalChallengeSeconds: 172800, rejectionChallengeSeconds: 172800, backupDelaySeconds: 259200, arbitrationPeriodSeconds: 604800, cancellationProposalSeconds: 604800, maxEvidenceRevisions: 3, fallbackPolicy: 0, cancellationPolicy: 0, recoveryPolicy: 0 };
  // The downloaded UTF-8 document is the hash preimage. Acceptance is a separate on-chain action.
  const document = JSON.stringify({ schema: "LURRO_PROJECT_DOCUMENT_V1_2", chainId: 5042002, name: draft.name.trim(), description: draft.description.trim(), recipients: recipients.map(r => ({ address: r.address, name: r.name.trim() })), scopes: draft.milestones.map(m => ({ title: m.title.trim(), scope: m.scope.trim() })), terms: base }, (_, value) => typeof value === "bigint" ? value.toString() : value, 2) + "\n";
  const terms = { ...base, signedDocumentHash: keccak256(toHex(document)) };
  return { terms, document, total, recipients, titles: draft.milestones.map(m => m.title.trim()), name: draft.name.trim(), description: draft.description.trim(), scopes: draft.milestones.map(m => m.scope.trim()) };
}
export type ProjectReview = ReturnType<typeof buildProject>;
