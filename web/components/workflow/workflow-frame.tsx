"use client";
import { network } from "../../lib/network";
import { useState, useId, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineArrowPath, HiOutlineArrowUpRight } from "react-icons/hi2";
import { AppShell } from "../workspace/app-shell";
import { AppCard } from "../ui/card";
import { AppPageHeading } from "../ui/page-heading";
import { Button, ButtonLink } from "../ui/button";
import { FormField } from "../ui/form-field";
import { ProjectSkeleton } from "../ui/project-skeleton";
import { WalletNotice } from "../ui/wallet-notice";
import { actionHint, nextWorkflowStep } from "../../lib/workflow-ux";
import { useProjectRead } from "../project/use-project-read";
import { useWallet } from "../dashboard/use-wallet";
import { useVaultAction } from "./use-vault-action";
import { ActionPanel } from "./action-panel";
import { readWorkflow, actionAllowed, type WorkflowSnapshot, type VaultAction } from "../../lib/workflow";
import { addressFrom, proofVault, shortAddress, explorer, rolesFor, statuses, formatUSDC } from "../../lib/vault-reader";
export type Section = "funding" | "milestones" | "payments" | "governance" | "audit";
export type WorkflowContext = { snapshot: WorkflowSnapshot; select: (a: VaultAction) => void; disabled: boolean; account?: string; eligible: (a: VaultAction) => boolean; refresh: () => void };
export function WorkflowFrame({ section, title, description, children }: { section: Section; title: string; description: string; children: (ctx: WorkflowContext) => ReactNode }) {
  const project = useProjectRead(readWorkflow);
  return <WorkflowContent key={`${section}:${project.address || project.raw}`} project={project} section={section} title={title} description={description}>{children}</WorkflowContent>;
}
function WorkflowContent({ section,title,description,children,project }: Parameters<typeof WorkflowFrame>[0] & { project: ReturnType<typeof useProjectRead<WorkflowSnapshot>> }) {
  const wallet = useWallet(); const router = useRouter(); const [entry,setEntry] = useState(""); const [error,setError] = useState(""); const [action,setAction] = useState<VaultAction>();
  const [reviewOpen,setReviewOpen] = useState(false);
  const transaction = useVaultAction(project.address,project.refresh,() => { setAction(undefined); setReviewOpen(false); }); const s = project.data;
  function open(e: FormEvent) { e.preventDefault(); try { const address = addressFrom(entry.trim()); router.push(`/app/${section}/?project=${address}`); } catch(e) { setError(e instanceof Error ? e.message : "Invalid address."); } }
  const next = s ? nextWorkflowStep(s) : undefined;
  const disabled = project.loading || !!project.error || transaction.busy || !!transaction.transaction;
  function select(a: VaultAction) {
    if (disabled) return; setAction(a); setReviewOpen(true);

  }
  return <AppShell activePage={section} title={title} mainId={`main-${section}`} projectAddress={project.address} walletDisabled={transaction.busy} mainClassName="workflow-main"><AppPageHeading title={title} description={description} actions={<Button disabled={project.loading || transaction.busy || !project.address} onClick={project.refresh}><HiOutlineArrowPath />Refresh</Button>} />
    {wallet.error && <p className="dash-field-error" role="alert">{wallet.error}</p>}
    {!s ? <AppCard>{project.loading ? <ProjectSkeleton /> : <div className="workflow-open"><h2>Open a project</h2><p>{project.parameterError || project.error || `Enter a Lurro ${network.label} vault address to continue.`}</p><form onSubmit={open}><FormField label="Vault address" value={entry} onChange={setEntry} placeholder="0x…" /><Button type="submit" variant="primary">Open project</Button></form>{error && <p role="alert" className="dash-field-error">{error}</p>}{project.error && <Button onClick={project.refresh}>Retry read</Button>}{proofVault && <ButtonLink variant="text" href={`/app/${section}/?project=${proofVault}`}>Inspect the public self-test <HiOutlineArrowUpRight /></ButtonLink>}</div>}</AppCard> : <><div className="workflow-context"><a href={`${explorer}/address/${s.vault.address}`} target="_blank" rel="noopener noreferrer">{shortAddress(s.vault.address)} <HiOutlineArrowUpRight /></a><span>{rolesFor(s.vault,wallet.account).join(" / ")}</span><span>{project.loading ? "Updating… · Actions paused" : `Block ${s.vault.block.toString()}`}</span><span className="dash-badge">{s.vault.cancelled ? "Cancelled" : s.vault.locked ? "Agreement locked" : "Agreement pending"}</span></div>
      {(!s.runtimeMatches || !s.termsMatch) && <p role="alert" className="workflow-warning">Contract identity could not be verified. All transaction actions are disabled.</p>}{!s.vault.locked && <p className="workflow-warning">The agreement must be accepted and locked first. <ButtonLink variant="text" href={`/app/agreement/?project=${s.vault.address}`}>Review agreement</ButtonLink></p>}
      {next && <div className="app-next-step"><div><strong>Next step</strong><p>{next.text}</p></div>{next.page !== section && <ButtonLink variant="text" href={`/app/${next.page}/?project=${s.vault.address}`}>{next.label} →</ButtonLink>}</div>}
      {wallet.account && rolesFor(s.vault,wallet.account).includes("Observer") && <WalletNotice />}
      {transaction.transaction && <div className="app-wallet-notice" role="status"><span>{transaction.busy ? "Transaction in progress…" : "A submitted transaction still needs checking."} New actions are paused.</span><Button onClick={() => setReviewOpen(true)}>View transaction status</Button></div>}
      {transaction.completed && <div className="app-transaction-success" role="status"><span>✓ {transaction.completed.label} confirmed.</span><a href={`${explorer}/tx/${transaction.completed.hash}`} target="_blank" rel="noopener noreferrer">View transaction</a></div>}
      <div className="workflow-columns workflow-columns-wide"><div className="workflow-content">{children({ snapshot:s,select,disabled,account:wallet.account,eligible:a => !disabled && actionAllowed(s,wallet.account,a),refresh:project.refresh })}</div>{section !== "audit" && <ActionPanel snapshot={s} action={action} visible={reviewOpen} clearSelection={() => { setReviewOpen(false); if (!transaction.transaction || transaction.terminal) setAction(undefined); }} transaction={transaction} refreshing={project.loading} />}</div></>}
  </AppShell>;
}
export function Metrics({ items }: { items: { label: string; value: bigint; note?: string }[] }) { return <div className="workflow-metrics">{items.map(item => <AppCard key={item.label}><span>{item.label}</span><strong>{formatUSDC(item.value)} <small>USDC</small></strong>{item.note && <p>{item.note}</p>}</AppCard>)}</div>; }
export function MilestoneHeading({ snapshot,index }: { snapshot: WorkflowSnapshot; index: number }) { const m = snapshot.vault.milestones[index]; return <div className="workflow-card-heading"><div><span className="dash-eyebrow">MILESTONE {index+1}</span><h2>{formatUSDC(m.recipientAmounts.reduce((a,b) => a+b,0n))} <small>USDC</small></h2></div><span className="dash-badge">{statuses[m.status]}</span></div>; }
export function ActionButton({ ctx, action }: { ctx: WorkflowContext; action: VaultAction }) { const hintId = useId(); const eligible = ctx.eligible(action); const hint = ctx.disabled ? "Updating or confirming a transaction…" : actionHint(ctx.snapshot,ctx.account,action);
  return <span className="workflow-action-control"><Button disabled={!eligible} aria-describedby={!eligible ? hintId : undefined} title={!eligible ? hint : undefined} onClick={() => ctx.select(action)}>{action.label}</Button>{!eligible && <small id={hintId}>{hint}</small>}</span>; }
export function Deadline({ label,seconds }: { label: string; seconds: bigint }) { return <div className="workflow-deadline"><span>{label}</span><strong>{seconds > 0n ? new Date(Number(seconds)*1000).toLocaleString("en-GB",{ timeZone:"UTC",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit" })+" UTC" : "—"}</strong></div>; }
