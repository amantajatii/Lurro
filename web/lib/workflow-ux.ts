import { formatUSDC, statuses } from "./vault-reader";
import { type WorkflowSnapshot, type VaultAction } from "./workflow";
export function actionHint(s: WorkflowSnapshot, account: string | undefined, a: VaultAction): string {
  if (!account) return "Connect your wallet to perform this action.";
  const same = (address: string) => address.toLowerCase() === account.toLowerCase();
  const t = s.vault.terms; const m = a.milestone === undefined ? undefined : s.states[a.milestone];
  const term = a.milestone === undefined ? undefined : t.milestones[a.milestone];
  if (!s.runtimeMatches || !s.termsMatch) return "Contract identity must be verified before sending an action.";
  if (!s.vault.locked) return "Accept and lock the agreement first.";
  if (["deposit", "approveUSDC", "createCancellationProposal"].includes(a.name) && !same(t.funder)) return "Switch to the Funder wallet.";
  if (["approveEvidence", "rejectEvidence"].includes(a.name) && !same(t.verifier)) return "Switch to the Verifier wallet.";
  if (["submitEvidence", "resubmitEvidence", "challengeRejection"].includes(a.name) && term && !same(term.submitter)) return "Switch to the assigned Recipient / submitter wallet.";
  if (a.name === "reserveMilestone" && m && term) {
    if (m.status !== 0) return `Milestone is ${statuses[s.vault.milestones[a.milestone!].status].toLowerCase()}; no new reservation is needed.`;
    if (s.vault.cancelled) return "The project is cancelled.";
    if (BigInt(Math.floor(s.vault.timestamp / 1000)) >= term.submissionDeadline) return "The submission deadline has passed.";
    if (s.states.slice(0,a.milestone).some(m => m.status === 0)) return "Reserve or close earlier planned milestones first.";
    const total = term.recipientAmounts.reduce((sum,n) => sum+n,0n);
    if (s.vault.accounting[1] < total) return `Deposit funds first. This milestone needs ${formatUSDC(total)} USDC available in the vault.`;
  }
  if (a.name === "executePayout" && m) return m.status === 7 ? "This milestone has already been paid." : "Payout becomes available when this milestone is claimable.";
  if (a.name === "claimRefund") return "There is no refund currently owed.";
  if (a.name === "resolveDispute") return "Only the assigned arbiter can resolve an active dispute. Backup becomes eligible after 72 hours.";
  if (a.name === "finalizeApproval") return "Finalization is available after the 48-hour approval challenge window.";
  if (a.name === "finalizeRejection") return "Finalization is available after the rejection window closes.";
  if (a.name === "finalizeDefault") return "The timed default is available after the arbitration deadline.";
  if (a.name === "expireUnsubmitted") return "Unsubmitted scope can expire after its submission deadline.";
  if (a.name === "approveCancellationProposal") return "Only the funder and recipients can consent to a current proposal; an existing consent cannot be repeated.";
  if (a.name === "executeEarlyCancellation") return "The current proposal needs consent from the funder and every recipient.";
  return "This action is unavailable for your wallet or the current milestone state.";
}
export function nextWorkflowStep(s: WorkflowSnapshot) {
  const v = s.vault;
  if (!v.locked) return { page:"agreement", label:"Review agreement", text:"Every assigned party must accept, then lock the agreement before funding." };
  if (v.accounting[3] > 0n) return { page:"payments",label:"Claim refund",text:`${formatUSDC(v.accounting[3])} USDC is owed to the original Funder. Claim the refund to transfer it back.` };
  if (s.proposalId > 0n && !v.cancelled && !s.proposal[2] && s.proposal[0] === s.stateVersion && BigInt(Math.floor(v.timestamp/1000)) < s.proposal[1]) return { page:"governance",label:"Review cancellation",text:"A cancellation proposal is active. Collect consent from the Funder and every Recipient before execution." };
  if (v.milestones.some(m => m.status === 6)) return { page:"payments",label:"Execute payout",text:"A milestone is claimable. Any wallet can trigger payment to the agreed Recipient wallets." };
  if (v.milestones.some(m => m.status === 5)) return { page:"governance",label:"Review dispute",text:"A milestone is disputed. Switch to the assigned Primary Arbiter to resolve it; Backup eligibility is timed." };
  if (v.milestones.some(m => m.status === 2)) return { page:"milestones",label:"Review evidence",text:"Evidence has been submitted. The Verifier checks the original file and approves or rejects this revision." };
  if (v.milestones.some(m => m.status === 4)) return { page:"milestones",label:"View approval window",text:"Evidence is approved. Normal payout becomes claimable after the 48-hour challenge window." };
  if (v.milestones.some(m => m.status === 3)) return { page:"milestones",label:"Review rejected evidence",text:"Evidence was rejected. The assigned submitter can revise or challenge it within the allowed window." };
  if (v.milestones.some(m => m.status === 1)) return { page:"milestones",label:"Submit evidence",text:"A milestone is reserved. Switch to its assigned Recipient / submitter to submit evidence." };
  const planned = v.milestones.find(m => m.status === 0);
  if (planned && !v.cancelled) {
    const total = planned.recipientAmounts.reduce((a,b)=>a+b,0n);
    return { page:"funding",label:v.accounting[1] >= total ? "Reserve milestone" : "Fund the project",text:v.accounting[1] >= total ? "Funds are available in the vault. Reserve the next planned milestone before submitting evidence." : `The Funder can approve and deposit USDC. The next planned milestone needs ${formatUSDC(total)} USDC in the vault.` };
  }
  return { page:"audit",label:"Inspect receipts",text:"Review the completed payouts, cancellations and refunds in Audit Explorer." };
}
