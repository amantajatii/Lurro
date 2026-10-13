"use client";
import { useEffect, useRef, useState } from "react";
import { createWalletClient, custom, encodeFunctionData, erc20Abi, type Address, type Abi } from "viem";
import { useWallet } from "../dashboard/use-wallet";
import { arcClient } from "../../lib/arc-client";
import { chain } from "../../lib/vault-reader";
import { workflowAbi } from "../../lib/workflow-abi";
import { readWorkflow, actionAllowed, actionArgs, type VaultAction } from "../../lib/workflow";
import { restoreAction, transactionMatches, type PendingAction } from "../../lib/transaction";
function message(e: unknown) { return e instanceof Error ? ("shortMessage" in e ? String(e.shortMessage) : e.message).split("\n")[0] : "The action could not be completed."; }
export function useVaultAction(address: Address | undefined, refresh: () => void) {
  const wallet = useWallet(); const guard = useRef(false);
  const [transaction,setTransaction] = useState<PendingAction>(); const [phase,setPhase] = useState("idle"); const [error,setError] = useState(""); const [terminal,setTerminal] = useState(false);
  const key = `lurro:workflow:pending:${address?.toLowerCase()}`;
  useEffect(() => { try { const tx = restoreAction(sessionStorage.getItem(key),address); if (tx) {
    // Recover public transaction metadata without resubmitting the action.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransaction(tx);
  } } catch { /* Storage is optional. */ } },[key,address]);
  function remember(tx: PendingAction) { setTransaction(tx); try { sessionStorage.setItem(key,JSON.stringify(tx)); } catch { /* The visible receipt remains available. */ } }
  async function check(tx = transaction) {
    if (!tx || guard.current) return; guard.current = true; setPhase("pending"); setError("");
    try {
      const receipt = await arcClient.waitForTransactionReceipt({ hash:tx.hash,timeout:120000,onReplaced:event => { tx = { ...tx!,hash:event.transactionReceipt.transactionHash }; remember(tx); } });
      const mined = await arcClient.getTransaction({ hash:receipt.transactionHash });
      remember({ ...tx,hash:receipt.transactionHash });
      if (receipt.status !== "success" || !transactionMatches(mined,tx)) { setTerminal(true); throw new Error("The transaction reverted or was replaced by a different action. This action is not confirmed."); }
      const current = await readWorkflow(tx.address);
      if (!current.runtimeMatches || !current.termsMatch || current.vault.block < receipt.blockNumber) throw new Error("The receipt succeeded, but the vault snapshot could not be verified yet. Check again.");
      setTerminal(true); setPhase("confirmed"); refresh(); try { sessionStorage.removeItem(key); } catch { /* Optional storage. */ }
    } catch(e) { setError(message(e)); setPhase("idle"); } finally { guard.current = false; }
  }
  async function send(action: VaultAction) {
    if (guard.current || transaction || !address || !wallet.account || !wallet.provider) return;
    try { const saved = restoreAction(sessionStorage.getItem(key),address); if (saved) { setTransaction(saved); return; } } catch { /* Live guards remain. */ }
    guard.current = true; setPhase("checking"); setError(""); let tx: PendingAction | undefined;
    try {
      const accounts = await wallet.provider.request({ method:"eth_accounts" });
      if (Number(await wallet.provider.request({ method:"eth_chainId" })) !== chain.id || await arcClient.getChainId() !== chain.id) throw new Error("Switch to Arc Testnet first.");
      if (!Array.isArray(accounts) || String(accounts[0]).toLowerCase() !== wallet.account.toLowerCase()) throw new Error("Your wallet account changed. Review the action again.");
      const current = await readWorkflow(address);
      if (!actionAllowed(current,wallet.account,action)) throw new Error("The action is no longer eligible. Refresh the project and review its current state.");
      for (const hash of [action.hash,action.reason]) if (hash !== undefined && (!/^0x[0-9a-fA-F]{64}$/.test(hash) || /^0x0{64}$/.test(hash))) throw new Error("Use a non-zero bytes32 commitment.");
      const approval = action.name === "approveUSDC";
      const target = approval ? current.vault.terms.usdcToken : address;
      const abi: Abi = approval ? erc20Abi : workflowAbi;
      const name = approval ? "approve" : action.name;
      const args = approval ? [address,action.amount!] : actionArgs(action);
      const input = encodeFunctionData({ abi,functionName:name,args });
      const account = wallet.account as Address;
      const simulation = await arcClient.simulateContract({ address:target,abi,functionName:name,args,account });
      setPhase("wallet");
      const hash = await createWalletClient({ account,chain,transport:custom(wallet.provider) }).writeContract(simulation.request);
      tx = { address,target,account,input,hash,label:action.label,chainId:chain.id }; remember(tx);
    } catch(e) { setError(message(e)); setPhase("idle"); } finally { guard.current = false; }
    if (tx) await check(tx);
  }
  function clear() { if (!terminal) return; setTransaction(undefined); setTerminal(false); setPhase("idle"); setError(""); try { sessionStorage.removeItem(key); } catch { /* Optional storage. */ } }
  return { transaction,phase,error,terminal,busy:["checking","wallet","pending"].includes(phase),send,check,clear };
}
