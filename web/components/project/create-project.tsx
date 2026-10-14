"use client";

import { Button, ButtonLink } from "../ui/button";
import { AppCard } from "../ui/card";
import { AppPageHeading } from "../ui/page-heading";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createWalletClient, custom, encodeDeployData, keccak256, toHex, type Hex } from "viem";
import { HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineCheck, HiOutlinePlus, HiOutlineTrash, HiOutlineWallet, HiOutlineDocumentText, HiOutlineUsers, HiOutlineFlag, HiOutlineShieldCheck, HiOutlineArrowUpRight, HiOutlineArrowDownTray } from "react-icons/hi2";
import { AppShell } from "../workspace/app-shell";
import { FormField } from "../ui/form-field";
import { useWallet } from "../dashboard/use-wallet";
import { arcClient as client } from "../../lib/arc-client";
import { buildProject, completedProjectSteps, validatePeople, validateRecipients, type ProjectDraft, type ProjectReview, type RecipientDraft, type MilestoneDraft } from "../../lib/project-draft";
import { chain, explorer, formatUSDC, shortAddress } from "../../lib/vault-reader";
import { readProjectBookmarks, saveProjectBookmarks, saveVerifiedProjectName } from "../../lib/project-bookmarks";
import { projectRoute } from "../../lib/project-routes";
import { vaultAbi } from "../../lib/vault-abi";
import { deploymentAbi, vaultBytecode } from "../../lib/vault-deployment";
const steps = [{ title: "Project & people", note: "Set the foundation", icon: HiOutlineDocumentText }, { title: "Recipients", note: "Define payment rights", icon: HiOutlineUsers }, { title: "Milestones", note: "Give the work a clear scope", icon: HiOutlineFlag }, { title: "Review & create", note: "Check every detail", icon: HiOutlineShieldCheck }];
const blankRecipient = (id: string): RecipientDraft => ({ id, name: "", address: "" });
const blankMilestone = (id: string): MilestoneDraft => ({ id, title: "", scope: "", deadline: "", submitter: "", amounts: {} });
export function CreateProject() {
  const wallet = useWallet();
  const [nowSeconds, setNowSeconds] = useState(() => Date.now() / 1000);
  useEffect(() => {
    const timer = setInterval(() => setNowSeconds(Date.now() / 1000), 30000);
    return () => clearInterval(timer);
  }, []);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ProjectDraft>({ name: "", description: "", funder: "", verifier: "", primaryArbiter: "", backupArbiter: "", recipients: [blankRecipient("r1")], milestones: [blankMilestone("m1")] });
  const [review, setReview] = useState<ProjectReview>();
  const [acknowledged, setAcknowledged] = useState(false), [error, setError] = useState("");
  const [phase, setPhase] = useState<"idle" | "simulating" | "wallet" | "pending" | "confirmed">("idle");
  const [hash, setHash] = useState<Hex>(), [address, setAddress] = useState<string>();
  const [bookmarkWarning, setBookmarkWarning] = useState(false);
  const [pendingDocument, setPendingDocument] = useState("");
  const sending = useRef(false);
  const counter = useRef(2), salt = useRef<Hex | undefined>(undefined);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("lurro:pending-creation:v1") || "null");
      if (saved?.chainId === chain.id && /^0x[0-9a-fA-F]{64}$/.test(saved.hash) && typeof saved.document === "string") {
        // Restore an external transaction bookmark; never resend a deployment on refresh.
        /* eslint-disable react-hooks/set-state-in-effect */
        setHash(saved.hash); setPendingDocument(saved.document); setStep(3);
        /* eslint-enable react-hooks/set-state-in-effect */
      }
    } catch { /* Optional session recovery. */ }
  }, []);
  const busy = phase !== "idle" && phase !== "confirmed";
  const field = (key: "name" | "description" | "verifier" | "primaryArbiter" | "backupArbiter", value: string) => setDraft(d => ({ ...d, [key]: value }));
  function recipient(id: string, key: "name" | "address", value: string) { setDraft(d => ({ ...d, recipients: d.recipients.map(r => r.id === id ? { ...r, [key]: value } : r) })); }
  function milestone(id: string, key: "title" | "scope" | "deadline" | "submitter", value: string) { setDraft(d => ({ ...d, milestones: d.milestones.map(m => m.id === id ? { ...m, [key]: value } : m) })); }
  function go(next: number) { setError(""); setStep(next); document.getElementById("create-main")?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  const activeDraft = { ...draft, funder: wallet.account || "" };
  const completed = [...completedProjectSteps(activeDraft, nowSeconds), !!address];
  function continueStep() {
    try {
      if (step === 0) validatePeople(activeDraft);
      if (step === 1) validateRecipients(activeDraft);
      go(step + 1);
    } catch (e) { setError(e instanceof Error ? e.message : "Complete this step before continuing."); }
  }
  function prepare() {
    try {
      if (!wallet.account) throw new Error("Connect the funder's wallet before reviewing this project.");
      if (!salt.current) salt.current = toHex(crypto.getRandomValues(new Uint8Array(32)));
      setReview(buildProject({ ...draft, funder: wallet.account }, salt.current, Date.now() / 1000));
      setAcknowledged(false); go(3);
    } catch (e) { setError(e instanceof Error ? e.message : "Check the project details."); }
  }
  function download() {
    const documentText = review?.document || pendingDocument;
    if (!documentText) return;
    const url = URL.createObjectURL(new Blob([documentText], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "lurro-project-agreement.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function confirm(transaction: Hex, documentText = review?.document || pendingDocument) {
    setPhase("pending"); setError("");
    try {
      const receipt = await client.waitForTransactionReceipt({ hash: transaction, timeout: 120000, onReplaced: replacement => {
        setHash(replacement.transactionReceipt.transactionHash);
        try { sessionStorage.setItem("lurro:pending-creation:v1", JSON.stringify({ chainId: chain.id, hash: replacement.transactionReceipt.transactionHash, document: documentText })); } catch { setBookmarkWarning(true); }
      } });
      if (receipt.status !== "success" || !receipt.contractAddress) { setHash(undefined); try { sessionStorage.removeItem("lurro:pending-creation:v1"); } catch {} throw new Error("This transaction did not create a vault. Check the transaction before retrying."); }
      const terms = await client.readContract({ address: receipt.contractAddress, abi: vaultAbi, functionName: "getTerms" });
      if (!documentText || terms.signedDocumentHash !== keccak256(toHex(documentText))) throw new Error("The confirmed contract does not match this agreement document. Inspect the transaction before proceeding.");
      setHash(receipt.transactionHash); setAddress(receipt.contractAddress); setPhase("confirmed");
      try { sessionStorage.removeItem("lurro:pending-creation:v1"); } catch { /* Optional storage. */ }
      try {
        saveProjectBookmarks([receipt.contractAddress, ...readProjectBookmarks()]);
        const metadata: unknown = JSON.parse(documentText);
        if (metadata && typeof metadata === "object" && "name" in metadata && typeof metadata.name === "string") saveVerifiedProjectName(receipt.contractAddress,metadata.name,terms.signedDocumentHash);
      } catch { setBookmarkWarning(true); }
    } catch (e) { setError(e instanceof Error ? e.message.split("\n")[0] : "Receipt could not be read. Check the explorer and retry the receipt read."); setPhase("idle"); }
  }
  async function deploy() {
    if (!review || !acknowledged || !wallet.provider || !wallet.account || hash || sending.current) return;
    sending.current = true;
    setError(""); setPhase("simulating");
    try {
      const accounts = await wallet.provider.request({ method: "eth_accounts" });
      const network = Number(await wallet.provider.request({ method: "eth_chainId" }));
      if (network !== chain.id || await client.getChainId() !== chain.id) throw new Error("Switch your wallet to Arc Testnet before creating this vault.");
      if (!Array.isArray(accounts) || String(accounts[0]).toLowerCase() !== review.terms.funder.toLowerCase()) throw new Error("The funder changed. Go back and review the project again.");
      const block = await client.getBlock();
      if (review.terms.milestones.some(m => m.submissionDeadline <= block.timestamp)) throw new Error("A submission deadline passed. Go back and update your milestones.");
      const account = review.terms.funder;
      const data = encodeDeployData({ abi: deploymentAbi, bytecode: vaultBytecode, args: [review.terms] });
      const gas = await client.estimateGas({ account, data });
      setPhase("wallet");
      const signer = createWalletClient({ account, chain, transport: custom(wallet.provider) });
      const transaction = await signer.deployContract({ abi: deploymentAbi, bytecode: vaultBytecode, args: [review.terms], gas: gas + gas / 5n });
      setHash(transaction); setPendingDocument(review.document);
      try { sessionStorage.setItem("lurro:pending-creation:v1", JSON.stringify({ chainId: chain.id, hash: transaction, document: review.document })); } catch { setBookmarkWarning(true); }
      await confirm(transaction, review.document);
    } catch (e) { setError(e instanceof Error ? e.message.split("\n")[0] : "Deployment was not completed. Check your wallet and retry."); setPhase("idle"); }
    finally { sending.current = false; }
  }
  const SectionIcon = steps[step].icon;
  return <AppShell title="Create project" mainId="create-main" activePage="create" className="create-shell" mainClassName="create-main" walletDisabled={busy || !!hash} creationNavigation={<>
<Link className="create-back" href="/app/"><HiOutlineArrowLeft />Back to dashboard</Link><span className="dash-nav-label">NEW PROJECT</span><nav aria-label="Creation steps">{steps.map((s, i) => <button key={s.title} className={step === i ? "create-step-active" : ""} aria-current={step === i ? "step" : undefined} disabled={!!hash || busy || i === 3} onClick={() => go(i)}><span className="create-step-number">{completed[i] && step !== i ? <HiOutlineCheck aria-label="Complete" /> : i + 1}</span><span>{s.title}<small>{s.note}</small></span></button>)}</nav>
  </>}>
<Link href="/app/" className="create-mobile-back"><HiOutlineArrowLeft />Dashboard</Link><AppPageHeading title={<>{address ? "Your vault is created." : "Create a project"}</>} description={<>{address ? "Every assigned party must accept the agreement before it can lock." : "Bring the people, the work, and the payment rights together."}</>} leading={<><span className="dash-eyebrow">A CLEAR AGREEMENT. A SHARED START.</span></>} actions={<span className="create-progress">Step {step + 1} of 4</span>} /><div className="create-mobile-steps" aria-label="Current step">{steps.map((s, i) => <span key={s.title} className={step === i ? "active" : ""}>{i + 1}<small>{s.title}</small></span>)}</div>
    {wallet.error && <p className="dash-message dash-message-error" role="alert">{wallet.error}</p>}{wallet.account && wallet.network !== chain.id && !hash && <div className="dash-message">Your wallet is on another network.<Button variant="text" disabled={wallet.busy || busy} onClick={() => void wallet.switchNetwork()}>Switch to Arc Testnet <HiOutlineArrowRight /></Button></div>}
    <div className="create-layout"><AppCard  className="create-form-card"><div className="create-card-heading"><span className="create-section-icon"><SectionIcon /></span><div><h2>{steps[step].title}</h2><p>{["Start with the purpose and the people responsible.", "Give each recipient a fixed wallet and a clear identity.", "Define scope, deadlines, and the exact payment split.", "These terms will be fixed in your new project vault."][step]}</p></div></div>
    <form onSubmit={e => { e.preventDefault(); if (step === 2) prepare(); else if (step < 2) continueStep(); }}>
    <fieldset disabled={busy || !!hash} className="create-fields">
    {step === 0 && <><FormField label="Project name" placeholder="Give this project a name" value={draft.name} onChange={v => field("name", v)} maxLength={100} /><FormField label="Agreement description" placeholder="What are you agreeing to deliver together?" value={draft.description} onChange={v => field("description", v)} multiline maxLength={4000} hint="Included in the downloadable document. Stored on-chain as a hash." /><div className="create-divider" /><h3>People responsible</h3><label className="app-field"><span>Funder</span><div className="create-readonly"><HiOutlineWallet /><span>{wallet.account || "Connect the wallet that will create and fund this vault"}</span></div><small>The connected wallet creates the vault and receives refunds.</small></label><FormField label="Verifier wallet" placeholder="0x…" value={draft.verifier} onChange={v => field("verifier", v)} hint="Reviews work. Must be separate from the funder and recipients." /><div className="create-two-col"><FormField label="Primary arbiter wallet" placeholder="0x…" value={draft.primaryArbiter} onChange={v => field("primaryArbiter", v)} /><FormField label="Backup arbiter wallet" placeholder="0x…" value={draft.backupArbiter} onChange={v => field("backupArbiter", v)} /></div><p className="create-helper">All four role wallets must be different. Confirm addresses with each person before proceeding.</p></>}
    {step === 1 && <><div className="create-list-heading"><h3>Payment recipients</h3><span>{draft.recipients.length} / 5</span></div>{draft.recipients.map((r, i) => <div className="create-recipient" key={r.id}><div className="create-row-heading"><strong><span>{String(i + 1).padStart(2, "0")}</span>Recipient {i + 1}</strong><Button type="button" variant="icon" disabled={draft.recipients.length <= 1} aria-label={`Remove recipient ${i + 1}`} onClick={() => setDraft(d => ({ ...d, recipients: d.recipients.filter(x => x.id !== r.id), milestones: d.milestones.map(m => ({ ...m, submitter: m.submitter === r.id ? "" : m.submitter })) }))}><HiOutlineTrash /></Button></div><div className="create-recipient-fields"><FormField label="Recipient name" placeholder="Person or team" value={r.name} onChange={v => recipient(r.id, "name", v)} maxLength={100} /><FormField label="Wallet address" placeholder="0x…" value={r.address} onChange={v => recipient(r.id, "address", v)} /></div></div>)}<button type="button" className="create-add" disabled={draft.recipients.length >= 5} onClick={() => { const id = `r${++counter.current}`; setDraft(d => ({ ...d, recipients: [...d.recipients, blankRecipient(id)] })); }}><HiOutlinePlus />Add recipient</button><p className="create-helper">1–5 recipients. Each needs an allocation in at least one milestone. Recipient wallets must be separate from all other roles.</p></>}
    {step === 2 && <>{draft.milestones.map((m, i) => <section className="create-milestone" key={m.id}><div className="create-row-heading"><strong><span>{String(i + 1).padStart(2, "0")}</span>Milestone {i + 1}</strong><Button type="button" variant="icon" disabled={draft.milestones.length <= 1} aria-label={`Remove milestone ${i + 1}`} onClick={() => setDraft(d => ({ ...d, milestones: d.milestones.filter(x => x.id !== m.id) }))}><HiOutlineTrash /></Button></div><FormField label="Milestone title" placeholder="What happens at this stage?" value={m.title} onChange={v => milestone(m.id, "title", v)} maxLength={100} /><FormField label="Scope & acceptance criteria" placeholder="Describe the deliverables and what counts as complete" value={m.scope} onChange={v => milestone(m.id, "scope", v)} multiline maxLength={4000} hint="The exact trimmed UTF-8 scope is hashed into this milestone." /><div className="create-two-col"><FormField label="Submission deadline" type="datetime-local" value={m.deadline} onChange={v => milestone(m.id, "deadline", v)} hint="Your local time. Later milestones need later deadlines." /><label className="app-field"><span>Evidence submitter</span><select required value={m.submitter} onChange={e => milestone(m.id, "submitter", e.target.value)}><option value="">Choose a recipient</option>{draft.recipients.map((r, j) => <option key={r.id} value={r.id}>{r.name || `Recipient ${j + 1}`}</option>)}</select><small>Only this recipient can submit evidence.</small></label></div><div className="create-allocation"><span>Payment allocation <small>USDC · up to 6 decimals</small></span>{draft.recipients.map((r, j) => <label key={r.id}><span>{r.name || `Recipient ${j + 1}`}<small>{r.address ? shortAddress(r.address) : "Wallet not set"}</small></span><input inputMode="decimal" aria-label={`Milestone ${i + 1} allocation for ${r.name || `recipient ${j + 1}`}`} placeholder="0.00" value={m.amounts[r.id] || ""} onChange={e => { const value = e.target.value; setDraft(d => ({ ...d, milestones: d.milestones.map(x => x.id === m.id ? { ...x, amounts: { ...x.amounts, [r.id]: value } } : x) })); }} /></label>)}</div></section>)}<button type="button" className="create-add" disabled={draft.milestones.length >= 3} onClick={() => { const id = `m${++counter.current}`; setDraft(d => ({ ...d, milestones: [...d.milestones, blankMilestone(id)] })); }}><HiOutlinePlus />Add milestone</button><p className="create-helper">1–3 milestones. Final evidence closes exactly 7 days after each submission deadline.</p></>}
    </fieldset>
    {step === 3 && review && <div className="create-review"><div className="create-review-title"><span>PROJECT AGREEMENT</span><h3>{review.name}</h3><p className="create-review-scope">{review.description}</p><strong>{formatUSDC(review.total)} <small>USDC committed</small></strong><p>A commitment is an agreed obligation. No USDC is deposited when you create this vault.</p></div><dl className="create-role-review">{[["Funder", review.terms.funder], ["Verifier", review.terms.verifier], ["Primary arbiter", review.terms.primaryArbiter], ["Backup arbiter", review.terms.backupArbiter]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{review.terms.milestones.map((m, i) => <div className="create-review-milestone" key={i}><h3>{i + 1}. {review.titles[i]}</h3><p className="create-review-scope">{review.scopes[i]}</p><p>Submission: {new Date(Number(m.submissionDeadline) * 1000).toUTCString()}<br />Final evidence: {new Date(Number(m.finalEvidenceDeadline) * 1000).toUTCString()}</p><p>Submitter: <code>{m.submitter}</code></p>{review.recipients.map((r, j) => <div className="create-review-split" key={r.id}><span>{r.name || shortAddress(r.address)}<code>{r.address}</code></span><strong>{formatUSDC(m.recipientAmounts[j])} USDC</strong></div>)}</div>)}<div className="create-document"><HiOutlineDocumentText /><div><strong>Keep your agreement document.</strong><p>Download the exact JSON committed by this hash: addresses, scope text, allocations, and rules. A hash is not a signature or party acceptance.</p><code>{review.terms.signedDocumentHash}</code><Button type="button" variant="text" onClick={download}><HiOutlineArrowDownTray />Download agreement JSON</Button></div></div>{!hash && <label className="create-ack"><input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} disabled={busy} /><span>I checked the addresses, allocations, deadlines, and fixed rules. I understand this creates an immutable Testnet vault.</span></label>}</div>}
    {error && <p className="dash-message dash-message-error create-error" role="alert">{error}</p>}
    {hash && !review && <div className="create-document"><HiOutlineDocumentText /><div><strong>Recovered transaction</strong><p>Check the receipt for your previously submitted creation. This page will not send another deployment.</p><Button type="button" variant="text" onClick={download}><HiOutlineArrowDownTray />Download agreement JSON</Button></div></div>}
    {hash && <div className="create-receipt" aria-live="polite"><strong>{address ? "Confirmed on Arc Testnet" : phase === "pending" ? "Waiting for the transaction receipt…" : "Transaction submitted · confirmation needs checking"}</strong><ButtonLink variant="text" href={`${explorer}/tx/${hash}`} target="_blank" rel="noopener noreferrer">View transaction <HiOutlineArrowUpRight /></ButtonLink>{address ? <><code>{address}</code><p>Awaiting agreement acceptance. No deposit or party approval was made by this transaction.</p>{bookmarkWarning && <p>Bookmark storage is unavailable. Save this address and link it manually.</p>}<ButtonLink href={projectRoute(address)} variant="primary">Open project <HiOutlineArrowRight /></ButtonLink></> : <Button variant="default" type="button" disabled={busy} onClick={() => void confirm(hash)}>Check receipt again</Button>}</div>}
    {!hash && <div className="create-form-footer"><Button type="button" variant="default" disabled={step === 0 || busy} onClick={() => go(step - 1)}><HiOutlineArrowLeft />Back</Button>{step < 3 ? <Button type="submit" variant="primary">{step === 2 ? "Review project" : "Continue"}<HiOutlineArrowRight /></Button> : <Button type="button" variant="primary" disabled={!acknowledged || busy || !wallet.account || wallet.network !== chain.id || wallet.account.toLowerCase() !== review?.terms.funder.toLowerCase()} onClick={() => void deploy()}><HiOutlineWallet />{phase === "simulating" ? "Checking deployment…" : phase === "wallet" ? "Confirm in your wallet…" : "Create vault on Testnet"}</Button>}</div>}
    </form></AppCard><AppCard as="aside"  tone="violet" className="create-guide"><span className="create-guide-mark"><Image src="/lurro-mark.webp" width={35} height={35} alt="" unoptimized /></span><span className="dash-eyebrow">BUILT AROUND THE AGREEMENT</span><h2>Clear rights.<br />From the start.</h2><p>Define who receives the funds and what needs to happen before they move.</p><div className="create-rule-list"><h3>Fixed P0 rules</h3>{[["Evidence review", "72 hours"], ["Approval / rejection challenge", "48 hours"], ["Backup arbiter delay", "72 hours"], ["Arbitration window", "7 days"], ["Cancellation proposal", "7 days"], ["Evidence revisions", "Up to 3"]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><p className="create-guide-note">Timeout fallback pays an approved snapshot and refunds an unapproved one. Cancellation requires unanimous agreement for unsubmitted scope. Wallet addresses cannot be replaced.</p><div className="create-testnet-note"><HiOutlineShieldCheck /><span>Arc Testnet · test USDC<br />Not independently audited.</span></div></AppCard></div>
  </AppShell>;
}
