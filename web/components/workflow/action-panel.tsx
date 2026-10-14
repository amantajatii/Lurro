"use client";
import { useState } from "react";
import { HiOutlineArrowUpRight } from "react-icons/hi2";
import { Button } from "../ui/button";
import { ReviewDialog } from "../ui/review-dialog";
import { useWallet } from "../dashboard/use-wallet";
import { chain, explorer, shortAddress, formatUSDC } from "../../lib/vault-reader";
import { actionAllowed, type WorkflowSnapshot, type VaultAction } from "../../lib/workflow";
import type { useVaultAction } from "./use-vault-action";
export function ActionPanel({ snapshot, action, clearSelection, transaction, refreshing, visible }: { snapshot: WorkflowSnapshot; action?: VaultAction; clearSelection: () => void; transaction: ReturnType<typeof useVaultAction>; refreshing: boolean; visible: boolean }) {
  const wallet = useWallet(); const [ack,setAck] = useState("");
  const binding = `${wallet.account}:${JSON.stringify(action,(_,value) => typeof value === "bigint" ? value.toString() : value)}`;
  const needsAcknowledgement = action?.name === "executeEarlyCancellation" || (action?.name === "resolveDispute" && !action.payout);
  const eligible = !!action && !refreshing && actionAllowed(snapshot,wallet.account,action);
  const label = action?.amount ? `${action.name === "approveUSDC" ? "Approve" : "Deposit"} ${formatUSDC(action.amount)} USDC` : action?.label;
  if (!visible || !action && !transaction.transaction) return null;
  return <ReviewDialog title={transaction.transaction ? "Transaction status" : "Review your action"} busy={transaction.phase === "checking" || transaction.phase === "wallet"} onClose={() => { if (transaction.terminal) transaction.clear(); clearSelection(); }}><div className="workflow-action-panel">
    {transaction.transaction ? <><strong>{transaction.transaction.label}</strong><p role="status">{transaction.busy ? "Waiting for the transaction receipt…" : transaction.terminal ? "This action was not completed. You can close this dialog and try again." : "Confirmation could not be verified yet. Check the receipt before sending another action."}</p><a className="workflow-external" href={`${explorer}/tx/${transaction.transaction.hash}`} target="_blank" rel="noopener noreferrer">View transaction <HiOutlineArrowUpRight /></a>{!transaction.busy && !transaction.terminal && <Button onClick={() => void transaction.check()}>Check receipt</Button>}</> : action ? <><strong>{label}</strong><p>Vault {shortAddress(snapshot.vault.address)}{action.milestone !== undefined ? ` · Milestone ${action.milestone + 1}` : ""}</p>{action.name === "approveUSDC" && <p>This sets a spending allowance for this vault. Your USDC stays in your wallet until you deposit.</p>}{action.name === "deposit" && <p>This transfers USDC from the funder wallet into this vault.</p>}{action.hash && <code>{action.hash}</code>}{action.reason && <><small>Reason commitment</small><code>{action.reason}</code></>}{action.name === "claimRefund" && <p>Funds return to the original funder, {shortAddress(snapshot.vault.terms.funder)}.</p>}{action.name === "executePayout" && <p>Every allocated recipient is paid in one transaction. The caller receives no additional payment.</p>}{action.name === "executeEarlyCancellation" && <p>Unsubmitted work is cancelled. Submitted work continues under its existing rules.</p>}
      {needsAcknowledgement && <label className="workflow-ack"><input type="checkbox" checked={ack === binding} onChange={e => setAck(e.target.checked ? binding : "")} />I understand the cancellation or refund outcome.</label>}
      {!wallet.account ? <Button variant="primary" onClick={() => { clearSelection(); wallet.discover(); }}>Connect wallet</Button> : wallet.network !== chain.id ? <Button onClick={() => void wallet.switchNetwork()}>Switch to Arc Testnet</Button> : <Button variant="primary" disabled={!eligible || needsAcknowledgement && ack !== binding || !wallet.provider || transaction.busy} onClick={() => void transaction.send(action)}>{transaction.phase === "checking" ? "Checking action…" : transaction.phase === "wallet" ? "Confirm in wallet…" : label}</Button>}
      {!eligible && wallet.account && <p>{refreshing ? "Updating project state…" : "Your wallet or the current project state cannot perform this action."}</p>}
    </> : null}{transaction.error && <p role="alert" className="dash-field-error">{transaction.error}</p>}<small>Arc Testnet · Confirm this transaction in your wallet.</small>
  </div></ReviewDialog>;
}
