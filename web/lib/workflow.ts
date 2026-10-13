import { erc20Abi, type Address, type Hex } from "viem";
import { readAgreement } from "./agreement";
import { arcClient } from "./arc-client";
import { workflowAbi } from "./workflow-abi";
export async function readWorkflow(address: Address) {
  const agreement = await readAgreement(address);
  const { vault } = agreement;
  const base = { address, abi: workflowAbi, blockNumber: vault.block };
  const [states, closeTimes, activeObligations, stateVersion, proposalId, balance, allowance] = await Promise.all([
    Promise.all(vault.milestones.map(m => arcClient.readContract({ ...base, functionName: "getMilestone", args: [BigInt(m.index)] }))),
    Promise.all(vault.milestones.map(m => arcClient.readContract({ ...base, functionName: "rejectionCloseAt", args: [BigInt(m.index)] }))),
    arcClient.readContract({ ...base, functionName: "activeUnpaidObligations" }),
    arcClient.readContract({ ...base, functionName: "stateVersion" }),
    arcClient.readContract({ ...base, functionName: "latestProposalId" }),
    arcClient.readContract({ address: vault.terms.usdcToken, abi: erc20Abi, functionName: "balanceOf", args: [vault.terms.funder], blockNumber: vault.block }),
    arcClient.readContract({ address: vault.terms.usdcToken, abi: erc20Abi, functionName: "allowance", args: [vault.terms.funder, address], blockNumber: vault.block }),
  ]);
  const cancellationActors = [vault.terms.funder, ...vault.terms.recipients];
  const [proposal, approvals] = await Promise.all([
    arcClient.readContract({ ...base, functionName: "cancellationProposals", args: [proposalId] }),
    Promise.all(cancellationActors.map(actor => arcClient.readContract({ ...base, functionName: "cancellationApproved", args: [proposalId, actor] }).then(approved => ({ address: actor, approved })))),
  ]);
  return { ...agreement, states, closeTimes, activeObligations, stateVersion, proposalId, proposal, approvals, balance, allowance };
}
export type WorkflowSnapshot = Awaited<ReturnType<typeof readWorkflow>>;
export type ActionName = "approveUSDC" | "deposit" | "reserveMilestone" | "submitEvidence" | "resubmitEvidence" | "approveEvidence" | "rejectEvidence" | "challengeRejection" | "challengeApproval" | "escalateReviewTimeout" | "resolveDispute" | "finalizeDefault" | "finalizeApproval" | "finalizeRejection" | "expireUnsubmitted" | "executePayout" | "claimRefund" | "createCancellationProposal" | "approveCancellationProposal" | "revokeCancellationApproval" | "executeEarlyCancellation";
export type VaultAction = { name: ActionName; label: string; milestone?: number; amount?: bigint; hash?: Hex; reason?: Hex; payout?: boolean; revision?: number; proposalId?: bigint };
export function depositCapacity(s: WorkflowSnapshot) { const amount = s.activeObligations - s.vault.accounting[1] - s.vault.accounting[2]; return amount > 0n ? amount : 0n; }
export function parseAmount(value: string) {
  if (!/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(value.trim())) throw new Error("Enter a positive USDC amount with up to 6 decimal places.");
  const [whole, fraction = ""] = value.trim().split("."); const amount = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, "0"));
  if (amount <= 0n || amount >= 2n ** 256n) throw new Error("The USDC amount is outside the supported range."); return amount;
}
const same = (a?: string, b?: string) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
export function actionAllowed(s: WorkflowSnapshot, account: string | undefined, action: VaultAction): boolean {
  if (!account || !s.runtimeMatches || !s.termsMatch || !s.vault.locked) return false;
  const { vault: v } = s; const t = v.terms; const now = BigInt(Math.floor(v.timestamp / 1000));
  const funder = same(account, t.funder); const participant = v.accepted.some(a => same(account, a.address));
  const m = action.milestone === undefined ? undefined : s.states[action.milestone];
  const term = action.milestone === undefined ? undefined : t.milestones[action.milestone];
  const total = term?.recipientAmounts.reduce((a,b) => a+b, 0n) || 0n;
  const proposalLive = s.proposalId > 0n && !v.cancelled && !s.proposal[2] && s.proposal[0] === s.stateVersion && now < s.proposal[1];
  const signer = s.approvals.find(a => same(account, a.address));
  switch (action.name) {
    case "approveUSDC": return funder && !v.cancelled && !!action.amount && action.amount > 0n && action.amount <= depositCapacity(s);
    case "deposit": return funder && !v.cancelled && !!action.amount && action.amount > 0n && action.amount <= depositCapacity(s) && action.amount <= s.balance && action.amount <= s.allowance;
    case "claimRefund": return v.accounting[3] > 0n;
    case "createCancellationProposal": return funder && !v.cancelled && s.activeObligations > 0n;
    case "approveCancellationProposal": return proposalLive && action.proposalId === s.proposalId && !!signer && !signer.approved;
    case "revokeCancellationApproval": return proposalLive && action.proposalId === s.proposalId && !!signer && signer.approved;
    case "executeEarlyCancellation": return proposalLive && action.proposalId === s.proposalId && s.approvals.every(a => a.approved);
  }
  if (!m || !term || action.milestone === undefined) return false;
  const id = action.milestone; const submitter = same(account, term.submitter);
  switch (action.name) {
    case "reserveMilestone": return !v.cancelled && m.status === 0 && now < term.submissionDeadline && s.states.slice(0,id).every(m => m.status !== 0) && v.accounting[1] >= total;
    case "submitEvidence": return !v.cancelled && submitter && m.status === 1 && now < term.submissionDeadline;
    case "resubmitEvidence": return submitter && m.status === 3 && m.revision < t.maxEvidenceRevisions && now < term.finalEvidenceDeadline;
    case "approveEvidence": case "rejectEvidence": return same(account, t.verifier) && m.status === 2 && now < m.submittedAt + BigInt(t.reviewPeriodSeconds) && action.revision === m.revision && action.hash === m.evidenceHash;
    case "challengeRejection": return submitter && m.status === 3 && now < s.closeTimes[id];
    case "challengeApproval": return (funder || t.recipients.some((a,i) => same(a, account) && term.recipientAmounts[i] > 0n)) && m.status === 4 && now < m.approvedAt + BigInt(t.approvalChallengeSeconds);
    case "escalateReviewTimeout": return participant && m.status === 2 && now >= m.submittedAt + BigInt(t.reviewPeriodSeconds);
    case "resolveDispute": return m.status === 5 && now < m.disputeOpenedAt + BigInt(t.arbitrationPeriodSeconds) && (same(account,t.primaryArbiter) || (same(account,t.backupArbiter) && now >= m.disputeOpenedAt + BigInt(t.backupDelaySeconds)));
    case "finalizeDefault": return m.status === 5 && now >= m.disputeOpenedAt + BigInt(t.arbitrationPeriodSeconds);
    case "finalizeApproval": return m.status === 4 && now >= m.approvedAt + BigInt(t.approvalChallengeSeconds);
    case "finalizeRejection": return m.status === 3 && now >= s.closeTimes[id];
    case "expireUnsubmitted": return (m.status === 0 || m.status === 1) && now >= term.submissionDeadline;
    case "executePayout": return v.milestones[id].status === 6;
    default: return false;
  }
}
export function actionArgs(a: VaultAction): readonly (bigint | number | boolean | Hex)[] {
  const id = BigInt(a.milestone ?? 0);
  switch (a.name) {
    case "deposit": return [a.amount!];
    case "submitEvidence": case "resubmitEvidence": return [id,a.hash!];
    case "approveEvidence": return [id,a.revision!,a.hash!];
    case "rejectEvidence": return [id,a.revision!,a.hash!,a.reason!];
    case "resolveDispute": return [id,!!a.payout];
    case "approveCancellationProposal": case "revokeCancellationApproval": case "executeEarlyCancellation": return [a.proposalId!];
    case "claimRefund": case "createCancellationProposal": return [];
    default: return [id];
  }
}
