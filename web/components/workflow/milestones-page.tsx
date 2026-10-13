"use client";
import { useState } from "react";
import { keccak256, toHex, type Hex } from "viem";
import { AppCard } from "../ui/card";
import { Button } from "../ui/button";
import { FormField } from "../ui/form-field";
import { HashFile } from "./hash-file";
import { WorkflowFrame, MilestoneHeading, Deadline, ActionButton, type WorkflowContext } from "./workflow-frame";
import { shortAddress } from "../../lib/vault-reader";
export function MilestonesPage() { return <WorkflowFrame section="milestones" title="Milestones" description="Submit evidence, review the exact revision, and keep the agreed scope traceable.">{ctx => <>{ctx.snapshot.vault.milestones.map((_,i) => <MilestoneCard key={`${i}:${ctx.snapshot.states[i].revision}`} ctx={ctx} index={i} />)}</>}</WorkflowFrame>; }
function MilestoneCard({ ctx,index:i }: { ctx: WorkflowContext; index: number }) {
  const s = ctx.snapshot; const m = s.states[i]; const term = s.vault.milestones[i];
  const [hash,setHash] = useState<Hex>(); const [reviewed,setReviewed] = useState<Hex>(); const [reason,setReason] = useState("");
  const submit = { name:(m.status === 3 ? "resubmitEvidence" : "submitEvidence") as "submitEvidence" | "resubmitEvidence",label:m.status === 3 ? "Resubmit evidence" : "Submit evidence",milestone:i,hash };
  const approve = { name:"approveEvidence" as const,label:"Approve this revision",milestone:i,hash:m.evidenceHash,revision:m.revision };
  const reject = { name:"rejectEvidence" as const,label:"Reject this revision",milestone:i,hash:m.evidenceHash,revision:m.revision,reason:reason.trim() ? keccak256(toHex(reason)) : undefined };
  return <AppCard><MilestoneHeading snapshot={s} index={i} /><div className="workflow-deadline"><span>Assigned submitter</span><strong>{shortAddress(term.submitter)}</strong></div><Deadline label="Initial submission closes" seconds={term.submissionDeadline} /><Deadline label="Final evidence deadline" seconds={term.finalEvidenceDeadline} /><div className="workflow-deadline"><span>Evidence revision</span><strong>{m.revision} / {s.vault.terms.maxEvidenceRevisions}</strong></div><p className="workflow-hash">Scope commitment: {term.scopeHash}</p>
    {(m.status === 1 || m.status === 3) && <><HashFile label={m.status === 3 ? "Choose revised evidence" : "Choose evidence file"} onHash={setHash} /><p>{m.status === 3 ? "Use a new file commitment. Previously used hashes cannot be resubmitted." : "The file commitment identifies the exact evidence being submitted."}</p><Button variant="primary" disabled={!hash || !ctx.eligible(submit)} onClick={() => ctx.select(submit)}>{submit.label}</Button></>}
    {m.revision > 0 && <><p className="workflow-hash">Evidence commitment: {m.evidenceHash}</p><Deadline label="Submitted" seconds={m.submittedAt} /></>}
    {m.status === 2 && <><Deadline label="Review closes" seconds={m.submittedAt + BigInt(s.vault.terms.reviewPeriodSeconds)} /><HashFile key={m.evidenceHash} label="Check the evidence file before reviewing" expected={m.evidenceHash} onHash={setReviewed} /><FormField label="Rejection reason" value={reason} onChange={setReason} multiline hint="The exact text is hashed locally. Share the original reason with the submitter." /><div className="workflow-actions"><Button variant="primary" disabled={reviewed !== m.evidenceHash || !ctx.eligible(approve)} onClick={() => ctx.select(approve)}>Approve evidence</Button><Button disabled={reviewed !== m.evidenceHash || !reject.reason || !ctx.eligible(reject)} onClick={() => ctx.select(reject)}>Reject evidence</Button></div></>}
    {m.status === 3 && <><p className="workflow-hash">Rejection reason commitment: {m.reasonHash}</p><Deadline label="Rejection closes" seconds={s.closeTimes[i]} /></>}
    {m.status === 4 && <Deadline label="Approval challenge closes" seconds={m.approvedAt + BigInt(s.vault.terms.approvalChallengeSeconds)} />}
    <div className="workflow-actions"><ActionButton ctx={ctx} action={{ name:"finalizeApproval",label:"Finalize approval",milestone:i }} /><ActionButton ctx={ctx} action={{ name:"finalizeRejection",label:"Finalize rejection",milestone:i }} /><ActionButton ctx={ctx} action={{ name:"expireUnsubmitted",label:"Expire unsubmitted scope",milestone:i }} /></div>
  </AppCard>;
}
