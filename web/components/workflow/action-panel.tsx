"use client";
import { useState } from "react";
import { HiOutlineShieldCheck, HiOutlineArrowUpRight } from "react-icons/hi2";
import { Button } from "../ui/button";
import { AppCard } from "../ui/card";
import { LogoLoader } from "../ui/logo-loader";
import { useWallet } from "../dashboard/use-wallet";
import { chain, explorer, shortAddress, formatUSDC } from "../../lib/vault-reader";
import { actionAllowed, type WorkflowSnapshot, type VaultAction } from "../../lib/workflow";
import type { useVaultAction } from "./use-vault-action";
export function ActionPanel({ snapshot, action, clearSelection, transaction }: { snapshot: WorkflowSnapshot; action?: VaultAction; clearSelection: () => void; transaction: ReturnType<typeof useVaultAction> }) {
  const wallet = useWallet(); const [ack,setAck] = useState("");
  const binding = `${wallet.account}:${JSON.stringify(action,(_,value) => typeof value === "bigint" ? value.toString() : value)}`;
  const eligible = !!action && actionAllowed(snapshot,wallet.account,action);
  return <AppCard tone="violet" className="workflow-action-panel" id="workflow-action-review" tabIndex={-1} aria-label="Review and confirm an action"><span className="workflow-panel-icon"><HiOutlineShieldCheck /></span><h2>{transaction.transaction ? "Transaction receipt" : action ? "Review your action" : "Your next action"}</h2>
    {transaction.transaction ? <><strong>{transaction.transaction.label}</strong><p>{transaction.phase === "confirmed" ? "Confirmed on Arc Testnet. The project snapshot has refreshed." : "A submitted transaction is being tracked. Check its receipt before sending another action."}</p><a className="workflow-external" href={`${explorer}/tx/${transaction.transaction.hash}`} target="_blank" rel="noopener noreferrer">View transaction <HiOutlineArrowUpRight /></a>{transaction.busy ? <LogoLoader label={transaction.phase === "wallet" ? "Confirm in your wallet…" : "Waiting for the receipt…"} /> : transaction.terminal ? <Button onClick={() => { transaction.clear(); clearSelection(); }}>Continue</Button> : <Button onClick={() => void transaction.check()}>Check receipt</Button>}</> : action ? <><strong>{action.label}</strong><p>Vault {shortAddress(snapshot.vault.address)}{action.milestone !== undefined ? ` · Milestone ${action.milestone + 1}` : ""}</p>{action.amount && <p><b>{formatUSDC(action.amount)} USDC</b>{action.name === "approveUSDC" ? ` · spending allowance to this vault only` : " · deposit into the vault"}</p>}{action.hash && <code>{action.hash}</code>}{action.reason && <><small>Reason commitment</small><code>{action.reason}</code></>}{action.name === "claimRefund" && <p>Funds return to the original funder, {shortAddress(snapshot.vault.terms.funder)}.</p>}{action.name === "executePayout" && <p>One transaction pays every allocated recipient. The caller receives no additional payment.</p>}{action.name === "executeEarlyCancellation" && <p>Only unsubmitted scope is cancelled. Submitted work continues under its existing rules.</p>}
      <label className="workflow-ack"><input type="checkbox" checked={ack === binding} onChange={e => setAck(e.target.checked ? binding : "")} />I reviewed this action and its effect on the project.</label>
      {!wallet.account ? <Button variant="primary" onClick={wallet.discover}>Connect wallet</Button> : wallet.network !== chain.id ? <Button onClick={() => void wallet.switchNetwork()}>Switch to Arc Testnet</Button> : <Button variant="primary" disabled={!eligible || ack !== binding || !wallet.provider || transaction.busy} onClick={() => void transaction.send(action)}>{transaction.phase === "checking" ? "Checking action…" : transaction.phase === "wallet" ? "Confirm in wallet…" : "Confirm with wallet"}</Button>}
      {!eligible && wallet.account && <p className="workflow-note">Your account or the latest project state is not eligible for this action.</p>}<Button variant="text" disabled={transaction.busy} onClick={clearSelection}>Cancel review</Button></> : <p>Select an available action to review its terms before confirming with your wallet.</p>}
    {transaction.error && <p role="alert" className="dash-field-error">{transaction.error}</p>}<small>Test USDC · Arc Testnet · wallet confirmation required</small>
  </AppCard>;
}
