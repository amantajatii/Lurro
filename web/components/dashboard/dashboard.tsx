"use client";

import { Button, ButtonLink } from "../ui/button";
import { AppCard } from "../ui/card";
import { AppPageHeading } from "../ui/page-heading";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { HiOutlineFolder, HiOutlinePlus, HiOutlineArrowUpRight, HiOutlineWallet, HiOutlineDocumentText, HiOutlineReceiptPercent, HiOutlineShieldCheck, HiOutlineMagnifyingGlass, HiOutlineArrowPath, HiOutlineXMark, HiOutlineChevronDown, HiOutlineArrowRight, HiOutlineLink, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineClipboardDocument } from "react-icons/hi2";
import { addressFrom, chain, explorer, formatUSDC, pendingFor, proofVault, readVault, rolesFor, shortAddress, statuses, vaultStatus, type Vault } from "../../lib/vault-reader";
import { projectRoute } from "../../lib/project-routes";
import { FormField } from "../ui/form-field";
import { AppShell } from "../workspace/app-shell";
import { useWallet } from "./use-wallet";

type Item = { address: string; data?: Vault; error?: string; loading: boolean };
const storageKey = "lurro:testnet:linked-vaults:v1";
export function Dashboard() {
  const wallet = useWallet();
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All projects");
  const [selected, setSelected] = useState<string>();
  const [walletPicker, setWalletPicker] = useState(false);
  const [importAddress, setImportAddress] = useState("");
  const [importError, setImportError] = useState("");
  const [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const generation = useRef(0);
  const currentAddresses = useRef<string[]>([]);

  async function load(addresses: string[]) {
    const version = ++generation.current;
    currentAddresses.current = addresses;
    setItems(addresses.map(address => ({ address, loading: true })));
    await Promise.all(addresses.map(async raw => {
      let result: Item;
      try { result = { address: raw, data: await readVault(addressFrom(raw)), loading: false }; }
      catch (e) { result = { address: raw, loading: false, error: e instanceof Error && e.message.startsWith("This address") ? e.message : "Could not verify this vault. Check the address or retry the Arc RPC read." }; }
      if (generation.current === version) setItems(current => current.map(item => item.address === raw ? result : item));
    }));
  }
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) {
        const addresses = [...new Set(saved.filter((x): x is string => typeof x === "string").flatMap(x => { try { return [addressFrom(x)]; } catch { return []; } }))].slice(0, 12);
        // Hydrate the external browser bookmark list once, then replace it with live RPC reads.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (addresses.length) void load(addresses);
      }
    } catch { /* Storage is optional; no financial state is stored. */ }
    // This ref is a request generation counter, not a DOM ref; invalidate the latest request on unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { generation.current++; };
  }, []);
  async function add(raw: string) {
    setImportError("");
    try {
      const address = addressFrom(raw.trim());
      if (currentAddresses.current.includes(address)) { setImportError("This vault is already linked."); return; }
      if (currentAddresses.current.length >= 12) { setImportError("You can link up to 12 vaults in this workspace."); return; }
      const addresses = [...currentAddresses.current, address];
      try { localStorage.setItem(storageKey, JSON.stringify(addresses)); } catch { /* Reads still work if storage is blocked. */ }
      setImportAddress(""); dialog.current?.close();
      await load(addresses);
    } catch (e) { setImportError(e instanceof Error ? e.message : "Enter a valid vault address."); }
  }
  function remove(address: string) {
    const addresses = currentAddresses.current.filter(x => x !== address);
    currentAddresses.current = addresses;
    generation.current++;
    setItems(current => current.filter(x => x.address !== address));
    setSelected(undefined);
    try { localStorage.setItem(storageKey, JSON.stringify(addresses)); } catch { /* Optional storage. */ }
    if (items.some(x => x.loading)) void load(addresses);
  }
  const loading = items.some(x => x.loading);
  const vaults = items.flatMap(item => item.data ? [item.data] : []);
  const complete = items.length > 0 && items.every(item => item.data && !item.loading && !item.error);
  const totals = complete ? vaults.reduce((sum, vault) => sum.map((amount, i) => amount + vault.accounting[i]), [0n, 0n, 0n, 0n, 0n, 0n]) : null;
  const pending = vaults.flatMap(vault => pendingFor(vault, wallet.account).map(title => ({ title, address: vault.address })));
  const filtered = useMemo(() => items.filter(item => {
    if (!item.address.toLowerCase().includes(query.toLowerCase().trim())) return false;
    if (filter === "All projects") return true;
    if (!item.data) return false;
    const status = vaultStatus(item.data);
    if (filter === "Active") return status === "Active" || status === "Disputed" || status === "Awaiting agreement";
    if (filter === "Closed") return status === "Cancelled" || status === "Completed";
    return rolesFor(item.data, wallet.account).some(role => role !== "Observer");
  }), [items, query, filter, wallet.account]);
  const detail = vaults.find(v => v.address === selected);
  function inspect(address: string) {
    setSelected(current => current === address ? undefined : address);
    requestAnimationFrame(() => document.getElementById("vault-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  function openImport() { setImportError(""); dialog.current?.showModal(); }
  function openWalletPicker() { wallet.discover(); setWalletPicker(true); }
  async function copy(address: string) {
    try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { setCopied(false); }
  }
  const lastRead = vaults.length ? new Date(Math.min(...vaults.map(v => v.timestamp))).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null;

  return <AppShell title="Dashboard" mainId="dashboard-main" activePage="dashboard" projectAddress={detail?.address} projectCount={items.length} onProjectsClick={() => document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" })} walletPicker={{ open: walletPicker, onOpenChange: setWalletPicker }}>

        <AppPageHeading title={<>Dashboard</>} description={<>A clear view of your agreements, funds, and next steps.</>} leading={<><span className="dash-eyebrow">YOUR PROJECTS, IN ONE PLACE</span></>} actions={<div className="dash-heading-actions"><Button variant="default" onClick={openImport}><HiOutlineLink />Link project</Button><ButtonLink variant="primary" href="/app/new/"><HiOutlinePlus />Create project</ButtonLink></div>} />
        {wallet.error && <div className="dash-message dash-message-error" role="alert"><HiOutlineExclamationTriangle />{wallet.error}</div>}
        {wallet.account && wallet.network !== chain.id && <div className="dash-message" role="status"><HiOutlineExclamationTriangle /><div><strong>Your wallet is on another network.</strong><span>Vault reads below use Arc Testnet. Switch your wallet before interacting with a project.</span></div><Button variant="default" onClick={() => void wallet.switchNetwork()} disabled={wallet.busy}>Switch to Arc Testnet</Button></div>}
        {!wallet.account && <div className="dash-connect-banner"><span className="dash-banner-icon"><HiOutlineWallet /></span><div><strong>Your workspace starts with your wallet.</strong><p>Connect to identify your roles and pending actions. Public vaults can be inspected without a wallet.</p></div><Button variant="text" onClick={() => { openWalletPicker(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Connect wallet <HiOutlineArrowRight /></Button></div>}
        <section className="dash-overview" aria-labelledby="funds-title"><div className="dash-section-heading"><div><h2 id="funds-title">Funding overview</h2><span>Across linked vaults · test USDC</span></div><span className="dash-read-status">{loading ? "Reading Arc…" : complete ? `On-chain snapshot · ${lastRead}` : items.length ? "Incomplete reads · totals unavailable" : "Link a vault to read its funds"}</span></div><div className="dash-stat-grid">{[{ label: "Deposited", index: 0, note: "Actual funding received", icon: HiOutlineWallet }, { label: "Reserved", index: 2, note: "Allocated to milestones", icon: HiOutlineShieldCheck }, { label: "Paid", index: 4, note: "Settled to recipients", icon: HiOutlineReceiptPercent }, { label: "Refunded", index: 5, note: "Returned to the funder", icon: HiOutlineArrowPath }].map(stat => <AppCard as="article"  className="dash-stat" key={stat.label}><div><span>{stat.label}</span><stat.icon /></div><strong>{totals ? formatUSDC(totals[stat.index]) : "—"}<small>USDC</small></strong><p>{stat.note}</p></AppCard>)}</div></section>
        <div className="dash-content-grid">
          <AppCard  className="dash-projects" id="projects" aria-labelledby="projects-title"><div className="dash-section-heading"><div><h2 id="projects-title">Projects <span className="dash-count">{items.length}</span></h2><span>Vaults you have linked to this browser</span></div><Button variant="icon" className={` ${loading ? "dash-refreshing" : ""}`} aria-label="Refresh linked vaults" onClick={() => void load(currentAddresses.current)} disabled={loading || !items.length}><HiOutlineArrowPath /></Button></div><div className="dash-project-controls"><label className="dash-search"><HiOutlineMagnifyingGlass /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search vault address" aria-label="Search projects by vault address" /></label><label className="dash-filter"><span className="dash-sr-only">Filter projects</span><select value={filter} onChange={e => setFilter(e.target.value)}><option>All projects</option><option>Active</option><option>Closed</option><option disabled={!wallet.account}>My roles</option></select><HiOutlineChevronDown /></label></div>
            {!items.length ? <div className="dash-empty"><div className="dash-empty-art" aria-hidden="true"><span className="dash-empty-sheet"><HiOutlineDocumentText /></span><span className="dash-empty-folder"><HiOutlineFolder /></span></div><h3>A fresh start for your projects.</h3><p>Link an existing Lurro vault to see its funding,<br />milestones, and payment rights here.</p><Button variant="primary" onClick={openImport}><HiOutlinePlus />Link your first project</Button><span className="dash-empty-note">Your wallet alone does not provide a complete project directory.</span></div> : !filtered.length ? <div className="dash-no-results"><HiOutlineMagnifyingGlass /><h3>No matching vaults</h3><p>Try another address or filter.</p><Button variant="text" onClick={() => { setQuery(""); setFilter("All projects"); }}>Clear filters</Button></div> : <div className="dash-project-list">{filtered.map(item => <article className="dash-project-row" key={item.address}><span className="dash-project-avatar"><HiOutlineFolder /></span><div className="dash-project-info"><strong>{item.address.toLowerCase() === proofVault ? "Lurro integration self-test" : `Vault ${shortAddress(item.address)}`}</strong><span>{shortAddress(item.address)}{item.data ? ` · ${rolesFor(item.data, wallet.account).join(" / ")}` : " · Arc Testnet"}</span>{item.error && <p role="alert">{item.error}</p>}</div>{item.data && <div className="dash-project-money"><strong>{formatUSDC(item.data.value)} <small>USDC</small></strong><span>Agreed commitment</span></div>}<span className={`dash-badge ${item.error ? "dash-badge-error" : ""}`}>{item.loading ? "Reading…" : item.data ? vaultStatus(item.data) : "Read failed"}</span>{item.data ? <ButtonLink variant="icon" aria-label={`Open project ${shortAddress(item.address)}`} href={projectRoute(item.address)}><HiOutlineArrowUpRight /></ButtonLink> : <Button variant="text" disabled={loading} onClick={() => void load(currentAddresses.current)}>Retry</Button>}<button className="dash-remove" onClick={() => remove(item.address)} aria-label={`Unlink vault ${shortAddress(item.address)}`} title="Unlink from this browser; vault is unchanged"><HiOutlineXMark /></button></article>)}</div>}
            <div className="dash-projects-footer"><HiOutlineShieldCheck /><span>Amounts come from the vault. Linking a project never moves funds.</span></div>
          </AppCard>
          <aside className="dash-right-column"><AppCard  className="dash-pending"><div className="dash-section-heading"><h2>Pending actions</h2><span className="dash-count">{wallet.account && complete ? pending.length : "—"}</span></div>{!wallet.account ? <div className="dash-pending-empty"><HiOutlineClipboardDocument /><strong>Know what needs your attention.</strong><p>Connect your assigned wallet to find agreement approvals and milestone reviews.</p></div> : !items.length ? <div className="dash-pending-empty"><HiOutlineClipboardDocument /><strong>Link a project to get started.</strong><p>Your assigned roles determine which actions appear here.</p></div> : pending.length ? <div className="dash-action-list">{pending.map(action => <button key={action.address + action.title} onClick={() => inspect(action.address)}><span>{action.title}<small>{shortAddress(action.address)}</small></span><HiOutlineArrowRight /></button>)}</div> : <div className="dash-pending-empty"><HiOutlineCheckCircle /><strong>{complete ? "No pending actions found." : "Actions could not be fully checked."}</strong><p>{complete ? "For your wallet in these linked vaults, as of the latest read." : "Wait for every vault to load or retry failed reads."}</p></div>}</AppCard><AppCard  tone="violet" className="dash-proof-card"><span className="dash-proof-icon"><HiOutlineDocumentText /></span><span className="dash-eyebrow">FOLLOW THE PROOF</span><h3>Start with a real<br />Testnet paper trail.</h3><p>Inspect our automated integration self-test: funding, payout, and refund.</p><Button variant="text" onClick={() => void add(proofVault)} disabled={loading || items.some(item => item.address.toLowerCase() === proofVault)}>Read the Testnet vault <HiOutlineArrowUpRight /></Button><span className="dash-proof-note">Public test wallets · test USDC</span></AppCard></aside>
        </div>
        {detail && <AppCard id="vault-detail"  className="dash-vault-detail" aria-label="Selected vault details"><div className="dash-section-heading"><div><h2>Vault snapshot</h2><span>Block {detail.block.toString()} · schema reported as Lurro v1.2</span></div><Button variant="icon" aria-label="Close vault details" onClick={() => setSelected(undefined)}><HiOutlineXMark /></Button></div><div className="dash-detail-address"><code>{detail.address}</code><Button variant="icon" aria-label="Copy vault address" onClick={() => void copy(detail.address)}>{copied ? <HiOutlineCheckCircle /> : <HiOutlineClipboardDocument />}</Button><ButtonLink variant="text" href={`${explorer}/address/${detail.address}?tab=contract`} target="_blank" rel="noopener noreferrer">Explorer <HiOutlineArrowUpRight /></ButtonLink></div><div className="dash-detail-stats"><span>Available<strong>{formatUSDC(detail.accounting[1])} USDC</strong></span><span>Refund owed<strong>{formatUSDC(detail.accounting[3])} USDC</strong></span><span>Agreement<strong>{detail.locked ? "Locked" : `${detail.acceptanceCount} accepted`}</strong></span><span>Recipients<strong>{detail.terms.recipients.length} bound wallets</strong></span></div><div className="dash-milestones">{detail.milestones.map(m => <div key={m.index}><span>Milestone {m.index + 1}</span><strong>{formatUSDC(m.recipientAmounts.reduce((a, b) => a + b, 0n))} USDC</strong><span className="dash-badge">{statuses[m.status]}</span></div>)}</div><ButtonLink variant="text" href={projectRoute(detail.address)}>Open project overview <HiOutlineArrowRight /></ButtonLink><p className="dash-detail-note">This dashboard reads state only. Agreement, funding, and settlement pages are coming next. A matching reported schema is not an independent contract audit.</p></AppCard>}
        <dialog ref={dialog} className="dash-import-dialog" onClose={() => setImportError("")}><form onSubmit={(e: FormEvent) => { e.preventDefault(); void add(importAddress); }}><div className="dash-section-heading"><h2>Link a project</h2><Button type="button" variant="icon" aria-label="Close link project dialog" onClick={() => dialog.current?.close()}><HiOutlineXMark /></Button></div><p>Enter a Lurro vault address on Arc Testnet. We will read its agreement and accounting directly from the chain.</p><FormField label="Vault contract address" placeholder="0x…" value={importAddress} onChange={setImportAddress} />{importError && <p className="dash-field-error" role="alert">{importError}</p>}<span className="dash-dialog-note">Only addresses are saved in this browser. Balances are always read again from Arc.</span><Button type="submit" variant="primary" disabled={loading}>Link and read vault <HiOutlineArrowRight /></Button></form></dialog>
  </AppShell>;
}
