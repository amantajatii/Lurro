"use client";
import { network, writesEnabled } from "../../lib/network";
import { ProjectSkeleton } from "../ui/project-skeleton";
import { WalletNotice } from "../ui/wallet-notice";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineExclamationTriangle, HiOutlineDocumentText, HiOutlineShieldCheck, HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineArrowUpRight, HiOutlineArrowPath, HiOutlineArrowUpTray, HiOutlineCheck, HiOutlineClock, HiOutlineWallet, HiOutlineLockClosed, HiOutlineChevronDown, HiOutlineClipboardDocument } from "react-icons/hi2";
import { AppShell } from "../workspace/app-shell";
import { AppCard } from "../ui/card";
import { AppPageHeading } from "../ui/page-heading";
import { Button, ButtonLink } from "../ui/button";
import { FormField } from "../ui/form-field";
import { useWallet } from "../dashboard/use-wallet";
import { saveVerifiedProjectName } from "../../lib/project-bookmarks";
import { useProjectRead } from "./use-project-read";
import { useAgreementTransaction } from "./use-agreement-transaction";
import { agreementEligibility, readAgreement, reviewDocument, type AgreementSnapshot, type ReviewedDocument } from "../../lib/agreement";
import { addressFrom, chain, explorer, formatUSDC, proofVault, rolesFor, shortAddress } from "../../lib/vault-reader";
import { agreementRoute, projectRoute } from "../../lib/project-routes";
import { chainDate } from "../../lib/project-overview";
type ProjectRead = ReturnType<typeof useProjectRead<AgreementSnapshot>>;
export function AgreementPage() {
  const project = useProjectRead(readAgreement);
  return <AgreementContent key={project.address || project.raw || "empty"} project={project} />;
}
function AgreementContent({ project }: { project: ProjectRead }) {
  const wallet = useWallet(), router = useRouter();
  const { address, data: snapshot, loading, parameterError, error: readError, refresh } = project;
  const vault = snapshot?.vault;
  const tx = useAgreementTransaction(address, refresh);
  const [entry, setEntry] = useState(""), [entryError, setEntryError] = useState("");
  const [file, setFile] = useState<{ review: ReviewedDocument; bytes: Uint8Array }>();
  const [fileError, setFileError] = useState(""), [checkingFile, setCheckingFile] = useState(false);
  const [acknowledgement, setAcknowledgement] = useState("");
  const [copied, setCopied] = useState("");
  const uploadVersion = useRef(0);
  const document = file?.review.hash === vault?.terms.signedDocumentHash ? file?.review : undefined;
  useEffect(() => {
    if (address && document?.name) {
      try { saveVerifiedProjectName(address,document.name,document.hash); } catch { /* Names are optional local metadata. */ }
    }
  },[address,document?.name,document?.hash]);
  const eligible = snapshot ? agreementEligibility(snapshot, wallet.account, document) : undefined;
  const acknowledgementKey = `${address}:${snapshot?.termsHash}:${wallet.account?.toLowerCase()}:${eligible?.canLock ? "lock" : "accept"}`;
  const acknowledged = acknowledgement === acknowledgementKey;
  const action = eligible?.canLock ? "lock" : "accept";
  const walletReady = !!wallet.account && wallet.network === chain.id;
  const canSend = writesEnabled && walletReady && acknowledged && !loading && !readError && !checkingFile && !tx.busy && !tx.transaction && (action === "lock" ? eligible?.canLock : eligible?.canAccept);
  const parties = vault ? [{ label: "Funder", address: vault.terms.funder }, { label: "Verifier", address: vault.terms.verifier }, { label: "Primary arbiter", address: vault.terms.primaryArbiter }, { label: "Backup arbiter", address: vault.terms.backupArbiter }, ...vault.terms.recipients.map((a, i) => ({ label: `Recipient ${i + 1}`, address: a }))] : [];
  function open(event: FormEvent) { event.preventDefault(); setEntryError(""); try { router.push(agreementRoute(addressFrom(entry.trim()))); } catch { setEntryError("Enter a valid vault address."); } }
  async function selectFile(selected?: File) {
    const version = ++uploadVersion.current;
    setFile(undefined); setFileError(""); setAcknowledgement(""); setCheckingFile(false);
    if (!selected || !vault) return;
    if (selected.size > 2 * 1024 * 1024) { setFileError("Choose an agreement file up to 2 MB."); return; }
    setCheckingFile(true);
    try {
      const bytes = new Uint8Array(await selected.arrayBuffer());
      const review = reviewDocument(bytes, selected.name, vault);
      if (version === uploadVersion.current) setFile({ bytes, review });
    } catch (e) { if (version === uploadVersion.current) setFileError(e instanceof Error ? e.message : "This file could not be checked."); }
    finally { if (version === uploadVersion.current) setCheckingFile(false); }
  }
  function downloadFile() {
    if (!file) return;
    const url = URL.createObjectURL(new Blob([new Uint8Array(file.bytes)], { type: "application/octet-stream" }));
    const link = window.document.createElement("a"); link.href = url; link.download = file.review.filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function openCheckedFile() {
    if (!file) return;
    const pdf = new TextDecoder().decode(file.bytes.slice(0, 5)) === "%PDF-";
    const url = URL.createObjectURL(new Blob([new Uint8Array(file.bytes)], { type: pdf ? "application/pdf" : "text/plain;charset=utf-8" }));
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function copy(value: string, label: string) { try { await navigator.clipboard.writeText(value); setCopied(`${label} copied.`); } catch { setCopied("Copy was unavailable. Select and copy the text instead."); } }
  return <AppShell title="Agreement" mainId="agreement-main" activePage="agreement" className="agreement-shell" mainClassName="agreement-main" projectAddress={address} walletDisabled={tx.busy}>
    <AppPageHeading title="A shared agreement." description="Review the rights and rules. Each party accepts with their own wallet." leading={address && <ButtonLink variant="text" href={projectRoute(address)}><HiOutlineArrowLeft />Project overview</ButtonLink>} actions={vault && <div className="dash-heading-actions"><span className="dash-badge">{vault.locked ? "Locked" : eligible?.canLock ? "Ready to lock" : "Awaiting acceptance"}</span><Button variant="icon" disabled={tx.busy} aria-label="Refresh agreement" onClick={refresh}><HiOutlineArrowPath /></Button></div>} />
    {wallet.error && <p className="dash-message dash-message-error" role="alert">{wallet.error}</p>}{copied && <p className="agreement-inline-notice" role="status">{copied}</p>}
    {!vault && loading && <ProjectSkeleton />}{!vault && !loading && <AppCard className="agreement-open" aria-live="polite"><span className="agreement-document-icon"><HiOutlineDocumentText /></span><h2>Open a project agreement</h2><p>{parameterError || readError || `Enter an ${network.label} vault address to review its agreement.`}</p>{!loading && <><form className="agreement-open-form" onSubmit={open}><FormField label="Vault contract address" placeholder="0x…" value={entry} onChange={setEntry} /><Button type="submit" variant="primary">Open agreement <HiOutlineArrowRight /></Button></form>{entryError && <p className="dash-field-error" role="alert">{entryError}</p>}{readError && <Button onClick={refresh}>Retry read</Button>}{proofVault && <ButtonLink variant="text" href={agreementRoute(proofVault)}>Inspect the Testnet self-test <HiOutlineArrowUpRight /></ButtonLink>}</>}</AppCard>}
    {snapshot && vault && <>
      <div className="agreement-address"><code>{vault.address}</code><Button variant="icon" aria-label="Copy vault address" onClick={() => void copy(vault.address, "Vault address")}><HiOutlineClipboardDocument /></Button><a href={`${explorer}/address/${vault.address}?tab=contract`} target="_blank" rel="noopener noreferrer">Explorer <HiOutlineArrowUpRight /></a><span>{loading ? "Updating… · Actions paused" : `Block ${vault.block.toString()}`}</span></div>
      {(!snapshot.runtimeMatches || !snapshot.termsMatch) && <p className="dash-message dash-message-error" role="alert">The bytecode or terms hash does not match Lurro P0 v1.2. Acceptance and lock are disabled.</p>}
      {wallet.account && !eligible?.participant && <WalletNotice agreement />}
      {tx.completed && <div className="app-transaction-success" role="status"><span>✓ {tx.completed.action === "accept" ? `Acceptance confirmed for ${shortAddress(tx.completed.account)}.` : "Agreement locked."}</span><a href={`${explorer}/tx/${tx.completed.hash}`} target="_blank" rel="noopener noreferrer">View transaction</a></div>}
      {vault.locked && <div className="app-wallet-notice"><div><strong>The agreement is locked. Funding is the next step.</strong><p>{wallet.account?.toLowerCase() === vault.terms.funder.toLowerCase() ? `Fund up to ${formatUSDC(vault.value)} USDC. Approval and deposit each require a wallet confirmation.` : `The Funder (${shortAddress(vault.terms.funder)}) can now deposit USDC. Locking does not move funds.`}</p></div><ButtonLink variant="primary" href={`/app/funding/?project=${vault.address}`}>Go to funding</ButtonLink></div>}
      <div className="agreement-layout"><div className="agreement-primary">
        <AppCard className="agreement-document-card"><div className="dash-section-heading"><div><h2>Agreement document</h2><span>Check the exact file named by this vault</span></div><HiOutlineDocumentText /></div>
          <label className={`agreement-upload ${document ? "agreement-upload-checked" : ""}`}><input type="file" accept=".json,.txt,.md,.pdf" disabled={loading || tx.busy || !!tx.transaction || checkingFile} onChange={e => void selectFile(e.target.files?.[0])} /><span className="agreement-upload-icon">{document ? <HiOutlineCheck /> : <HiOutlineArrowUpTray />}</span><strong>{checkingFile ? "Checking the file…" : document ? document.filename : "Choose the original agreement"}</strong><span>{document ? "Exact document hash matched" : "JSON, PDF, Markdown or text · up to 2 MB"}</span><small>Checked locally in your browser. The file is never uploaded.</small></label>
          {fileError && <p className="dash-field-error" role="alert">{fileError}</p>}
          <div className="agreement-hash"><span>Committed document hash</span><code>{vault.terms.signedDocumentHash}</code><Button variant="text" onClick={() => void copy(vault.terms.signedDocumentHash, "Document hash")}><HiOutlineClipboardDocument />Copy hash</Button></div>
          {document && <div className="agreement-document-preview"><span className="dash-eyebrow">DOCUMENT MATCHED</span><h3>{document.name || document.filename}</h3>{document.description && <p>{document.description}</p>}<div className="agreement-file-actions"><Button variant="text" onClick={openCheckedFile}>Read the checked original <HiOutlineArrowUpRight /></Button><Button variant="text" onClick={downloadFile}>Download original <HiOutlineArrowRight /></Button></div></div>}
          <p className="agreement-help">A matching hash identifies the file; it is not a signature or proof that the work is complete. Read the original file and the on-chain terms before accepting.</p>
        </AppCard>
        <AppCard><div className="dash-section-heading"><div><h2>Payment rights</h2><span>Fixed recipient wallets and exact USDC allocations</span></div><span className="agreement-contract-value">{formatUSDC(vault.value)} USDC</span></div><div className="agreement-table-scroll"><table className="agreement-allocation-table"><caption className="dash-sr-only">Agreed recipient allocations in USDC</caption><thead><tr><th>Recipient</th>{vault.milestones.map(m => <th key={m.index}>Milestone {m.index + 1}</th>)}<th>Total</th></tr></thead><tbody>{vault.terms.recipients.map((a, i) => <tr key={a}><td><strong>Recipient {i + 1}</strong><a href={`${explorer}/address/${a}`} target="_blank" rel="noopener noreferrer" title={a}>{shortAddress(a)}<HiOutlineArrowUpRight /></a></td>{vault.milestones.map(m => <td key={m.index}>{formatUSDC(m.recipientAmounts[i])}</td>)}<td>{formatUSDC(vault.milestones.reduce((sum, m) => sum + m.recipientAmounts[i], 0n))}</td></tr>)}</tbody></table></div><p className="agreement-help">This is the agreed commitment, separate from deposited funds. Creating or accepting an agreement does not deposit USDC.</p></AppCard>
        <AppCard><div className="dash-section-heading"><div><h2>Milestone terms</h2><span>Scope commitments and evidence deadlines</span></div><HiOutlineClock /></div>{vault.milestones.map(m => <details className="agreement-milestone" key={m.index}><summary><span>{String(m.index + 1).padStart(2, "0")}</span><strong>{document?.scopes?.[m.index]?.title || `Milestone ${m.index + 1}`}</strong><HiOutlineChevronDown /></summary><div>{document?.scopes?.[m.index] && <p className="agreement-scope-text">{document.scopes[m.index].scope}</p>}<dl><div><dt>Submission deadline</dt><dd>{chainDate(m.submissionDeadline)}</dd></div><div><dt>Final evidence deadline</dt><dd>{chainDate(m.finalEvidenceDeadline)}</dd></div><div><dt>Evidence submitter</dt><dd>{m.submitter}</dd></div><div><dt>Scope hash</dt><dd>{m.scopeHash}</dd></div></dl></div></details>)}</AppCard>
        <AppCard><div className="dash-section-heading"><div><h2>Fixed rules</h2><span>Lurro P0 v1.2 · immutable wallet addresses</span></div><HiOutlineShieldCheck /></div><div className="agreement-rule-grid">{[["Evidence review", `${vault.terms.reviewPeriodSeconds / 3600} hours`], ["Approval challenge", `${vault.terms.approvalChallengeSeconds / 3600} hours`], ["Rejection challenge", `${vault.terms.rejectionChallengeSeconds / 3600} hours`], ["Backup arbiter delay", `${vault.terms.backupDelaySeconds / 3600} hours`], ["Arbitration window", `${vault.terms.arbitrationPeriodSeconds / 86400} days`], ["Cancellation proposal", `${vault.terms.cancellationProposalSeconds / 86400} days`], ["Evidence submissions", `${vault.terms.maxEvidenceRevisions} total`], ["Final evidence", "Submission + 7 days"]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><div className="agreement-policy-notes"><p><strong>Timeout fallback.</strong> An approved snapshot pays; an unapproved snapshot refunds.</p><p><strong>Cancellation.</strong> Unanimous cancellation applies to unsubmitted scope. Other milestones follow their existing settlement paths.</p><p><strong>Wallet recovery.</strong> Addresses cannot be replaced by the vault. Lost wallet keys can strand payouts or refunds.</p></div><details className="agreement-terms-hash"><summary>Canonical terms hash <HiOutlineChevronDown /></summary><code>{snapshot.termsHash}</code><p>{snapshot.termsMatch ? `Independently recomputed from this vault address, ${network.label} chain ID, schema and the full v1.2 terms tuple.` : "Terms hash check failed."}</p></details></AppCard>
      </div><aside className="agreement-secondary">
        <AppCard tone="violet" className="agreement-sign-card"><span className="agreement-sign-icon">{vault.locked ? <HiOutlineLockClosed /> : <HiOutlineShieldCheck />}</span><span className="dash-eyebrow">EVERY PARTY. THE SAME TERMS.</span><h2>{vault.locked ? "The agreement is locked." : eligible?.canLock ? "Every party has accepted." : "Your wallet. Your acceptance."}</h2><p>{wallet.account ? `Connected as ${rolesFor(vault, wallet.account).join(" / ")}.` : "Connect the wallet named in this agreement to record your acceptance."}</p>
          <div className="agreement-checklist"><span>{snapshot.runtimeMatches ? <HiOutlineCheck /> : <HiOutlineExclamationTriangle />}{snapshot.runtimeMatches ? "Compiled P0 bytecode matched" : "Bytecode check failed"}</span><span>{snapshot.termsMatch ? <HiOutlineCheck /> : <HiOutlineExclamationTriangle />}{snapshot.termsMatch ? "Canonical terms hash matched" : "Terms hash check failed"}</span><span>{document ? <HiOutlineCheck /> : <HiOutlineDocumentText />}{document ? "Original document matched" : "Original document not checked"}</span></div>
          {vault.locked ? <div className="agreement-sign-note">All required parties accepted before lock. Deposits and milestone funding are separate actions.</div> : eligible?.alreadyAccepted && !eligible.canLock ? <div className="agreement-sign-note">You’ve accepted. Waiting for {parties.length - Number(vault.acceptanceCount)} other parties.</div> : wallet.account && !eligible?.participant && !eligible?.canLock ? <div className="agreement-sign-note">This wallet is an observer. Only the named parties can accept; anyone may lock after all acceptances.</div> : !document && !eligible?.canLock ? <div className="agreement-sign-note">Ask the funder for the exact original document, then choose it above to enable review.</div> : null}
          {wallet.account && wallet.network !== chain.id && <Button disabled={wallet.busy || tx.busy} onClick={() => void wallet.switchNetwork()}>Switch to {network.label}</Button>}
          {!vault.locked && !tx.transaction && (eligible?.canAccept || eligible?.canLock) && <label className="agreement-ack"><input type="checkbox" checked={acknowledged} disabled={tx.busy || !writesEnabled} onChange={e => setAcknowledgement(e.target.checked ? acknowledgementKey : "")} /><span>{eligible.canLock ? "I understand this locks the agreed terms before funding. All required parties have accepted." : "I read the exact original document and checked these addresses, allocations, deadlines, and fallback rules. I accept these immutable terms."}{network.mainnet && " This is real-USDC Mainnet, the prototype is unaudited, and recipient addresses are permanent."}</span></label>}
          {!vault.locked && !tx.transaction && <Button variant="primary" className="agreement-submit" disabled={!canSend} onClick={() => snapshot && void tx.send(action, snapshot, document, acknowledged)}>{tx.phase === "checking" ? "Checking eligibility…" : tx.phase === "wallet" ? "Confirm in your wallet…" : action === "lock" ? <><HiOutlineLockClosed />Lock agreement</> : <><HiOutlineWallet />Accept agreement</>}</Button>}
          <p className="agreement-gas-note">{network.label} · wallet confirmation required · gas paid in {network.unit}.</p>
          {tx.error && <p className="dash-field-error" role="alert">{tx.error}</p>}
          {tx.transaction && <div className="agreement-receipt" aria-live="polite"><strong>{tx.phase === "confirmed" ? tx.transaction.action === "accept" ? `Acceptance confirmed for ${shortAddress(tx.transaction.account)}.` : "Agreement lock is confirmed." : tx.phase === "pending" ? "Waiting for a verified receipt…" : "Submitted transaction needs checking."}</strong><ButtonLink variant="text" href={`${explorer}/tx/${tx.transaction.hash}`} target="_blank" rel="noopener noreferrer">View transaction <HiOutlineArrowUpRight /></ButtonLink>{tx.failedReceipt ? <Button onClick={tx.clearTracking}>Dismiss failed action</Button> : <Button disabled={tx.busy} onClick={() => void tx.checkReceipt()}>Check receipt again</Button>}</div>}
        </AppCard>
        <AppCard className="agreement-parties"><div className="dash-section-heading"><h2>Required acceptances</h2><span className="dash-count">{vault.acceptanceCount.toString()} / {parties.length}</span></div><div className="agreement-acceptance-track" aria-hidden="true">{vault.accepted.map(a => <span className={a.accepted ? "accepted" : ""} key={a.address} />)}</div>{parties.map(p => { const accepted = vault.accepted.find(a => a.address === p.address.toLowerCase())?.accepted; return <div className="agreement-party" key={p.label}><span className={`agreement-party-state ${accepted ? "accepted" : ""}`}>{accepted ? <HiOutlineCheck /> : <HiOutlineClock />}</span><div><strong>{p.label}{wallet.account?.toLowerCase() === p.address.toLowerCase() && <small>You</small>}</strong><a href={`${explorer}/address/${p.address}`} target="_blank" rel="noopener noreferrer" title={p.address}>{shortAddress(p.address)} <HiOutlineArrowUpRight /></a><span>{accepted ? "Accepted" : "Awaiting acceptance"}</span></div></div>; })}<p className="agreement-help">Every funder, recipient, verifier and arbiter accepts once. No signature is recorded on behalf of another party.</p></AppCard>
        <p className="agreement-trust-note">Bytecode checks identify this build of the prototype. They do not replace an independent security audit.</p>
      </aside></div>
    </>}
  </AppShell>;
}
