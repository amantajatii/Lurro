import { pendingFor, rolesFor, type Vault } from "./vault-reader";
export function projectOverview(vault: Vault) {
  const [deposited, available, reserved, refundOwed, paid, refunded] = vault.accounting;
  const paidCount = vault.milestones.filter(m => m.status === 7).length;
  const cancelledCount = vault.milestones.filter(m => m.status === 8).length;
  const openMilestones = vault.milestones.filter(m => m.status !== 7 && m.status !== 8);
  const nextSubmission = openMilestones.filter(m => m.status === 0 || m.status === 1).sort((a, b) => a.submissionDeadline < b.submissionDeadline ? -1 : 1)[0];
  // Only the visual progress bar converts to Number, after bounding the integer ratio.
  const fundingBasisPoints = vault.value > 0n ? deposited * 10000n / vault.value : 0n;
  const barPercent = Number(fundingBasisPoints > 10000n ? 10000n : fundingBasisPoints) / 100;
  const recipients = vault.terms.recipients.map((address, index) => ({ address, committed: vault.milestones.reduce((sum, m) => sum + m.recipientAmounts[index], 0n), paid: vault.milestones.filter(m => m.status === 7).reduce((sum, m) => sum + m.recipientAmounts[index], 0n) }));
  return { deposited, available, reserved, refundOwed, paid, refunded, retained: available + reserved + refundOwed, paidCount, cancelledCount, openCount: openMilestones.length, nextSubmission, barPercent, recipients };
}
export function chainDate(seconds: bigint) { const date = new Date(Number(seconds) * 1000); return Number.isNaN(date.getTime()) ? `${seconds} Unix seconds` : date.toISOString().slice(0, 16).replace("T", " ") + " UTC"; }

export function projectNextSteps(vault: Vault, wallet?: string) {
  const actions = pendingFor(vault, wallet);
  if (!wallet || !vault.locked) return actions;
  const account = wallet.toLowerCase();
  const now = BigInt(Math.floor(vault.timestamp / 1000));
  const activeCommitment = vault.milestones.filter(m => m.status !== 7 && m.status !== 8).reduce((sum, m) => sum + m.recipientAmounts.reduce((a, b) => a + b, 0n), 0n);
  if (!vault.cancelled && rolesFor(vault, wallet).includes("Funder") && activeCommitment > vault.accounting[1] + vault.accounting[2]) actions.push("Unpaid obligations are not fully funded · review the deposit needed");
  const planned = vault.milestones.find(m => m.status === 0);
  if (!vault.cancelled && planned && planned.submissionDeadline > now && vault.accounting[1] >= planned.recipientAmounts.reduce((a, b) => a + b, 0n)) actions.push(`Milestone ${planned.index + 1} · full allocation available to reserve`);
  vault.milestones.filter(m => m.status === 1 && m.submitter.toLowerCase() === account && m.submissionDeadline > now).forEach(m => actions.push(`Milestone ${m.index + 1} · submit the agreed work evidence`));
  return actions;
}
