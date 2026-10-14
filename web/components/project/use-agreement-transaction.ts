"use client";
import { useEffect, useRef, useState } from "react";
import { createWalletClient, custom, type Address, type Hex } from "viem";
import { useWallet } from "../dashboard/use-wallet";
import { arcClient } from "../../lib/arc-client";
import { chain } from "../../lib/vault-reader";
import { agreementAbi } from "../../lib/agreement-abi";
import { agreementEligibility, agreementTransactionMatches, acceptanceReceiptMatches, readAgreement, restoreAgreementTransaction, type AgreementTransaction, type AgreementSnapshot, type ReviewedDocument } from "../../lib/agreement";
export type AgreementAction = "accept" | "lock";
type Pending = AgreementTransaction;
function message(error: unknown) { return error instanceof Error ? ("shortMessage" in error ? String(error.shortMessage) : error.message).split("\n")[0] : "The action was not completed. Check your wallet and retry."; }
export function useAgreementTransaction(address: Address | undefined, refresh: () => void) {
  const wallet = useWallet();
  const [completed, setCompleted] = useState<Pending>();
  const [transaction, setTransaction] = useState<Pending>();
  const [phase, setPhase] = useState<"idle" | "checking" | "wallet" | "pending" | "confirmed">("idle");
  const [error, setError] = useState("");
  const [failedReceipt, setFailedReceipt] = useState(false);
  const sending = useRef(false);
  const storageKey = `lurro:agreement:pending:${address?.toLowerCase()}`;
  useEffect(() => {
    try {
      const saved = restoreAgreementTransaction(sessionStorage.getItem(storageKey), address);
      if (saved) {
        // Recover a submitted transaction from external storage; never send it again.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTransaction(saved);
      }
    } catch { /* Receipt recovery is optional. */ }
  }, [address, storageKey]);
  function remember(tx: Pending) {
    setTransaction(tx);
    try { sessionStorage.setItem(storageKey, JSON.stringify(tx)); }
    catch { setError("Receipt recovery is unavailable in this browser. Keep the transaction link if you reload."); }
  }
  async function checkReceipt(tx = transaction) {
    if (!tx || sending.current) return;
    sending.current = true; setPhase("pending"); setError("");
    try {
      const receipt = await arcClient.waitForTransactionReceipt({ hash: tx.hash, timeout: 120000, onReplaced: event => { tx = { ...tx!, hash: event.transactionReceipt.transactionHash }; remember(tx); } });
      remember({ ...tx, hash: receipt.transactionHash });
      if (receipt.status !== "success") { setFailedReceipt(true); throw new Error("The transaction reverted. Agreement state was not confirmed by this action."); }
      const mined = await arcClient.getTransaction({ hash: receipt.transactionHash });
      if (!agreementTransactionMatches({ to: receipt.to, from: receipt.from, input: mined.input, value: mined.value }, tx)) {
        setFailedReceipt(true); throw new Error("This transaction was replaced by a different action. The original agreement action is not confirmed.");
      }
      const current = await readAgreement(tx.address);
      if (current.vault.block < receipt.blockNumber) throw new Error("The RPC snapshot is behind the receipt. Check the receipt again shortly.");
      if (current.termsHash !== tx.termsHash || !acceptanceReceiptMatches(current, tx.account, tx.action)) throw new Error("The receipt succeeded, but the agreement state could not be verified. Check the receipt again.");
      setCompleted({ ...tx, hash: receipt.transactionHash }); setTransaction(undefined); setPhase("confirmed"); refresh();
      try { sessionStorage.removeItem(storageKey); } catch { /* Optional storage. */ }
    } catch (e) { setError(message(e)); setPhase("idle"); }
    finally { sending.current = false; }
  }
  async function send(action: AgreementAction, snapshot: AgreementSnapshot, document: ReviewedDocument | undefined, acknowledged: boolean) {
    if (sending.current || transaction || !address || !wallet.provider || !wallet.account) return;
    try {
      const saved = restoreAgreementTransaction(sessionStorage.getItem(storageKey), address);
      if (saved) { setTransaction(saved); setError("A submitted action is already being tracked. Check its receipt before retrying."); return; }
    } catch { /* Live guards still apply if browser storage is unavailable. */ }
    sending.current = true; setPhase("checking"); setError("");
    let submitted: Pending | undefined;
    try {
      if (!acknowledged) throw new Error("Review and acknowledge the agreement before sending an action.");
      const accounts = await wallet.provider.request({ method: "eth_accounts" });
      const network = Number(await wallet.provider.request({ method: "eth_chainId" }));
      if (network !== chain.id || await arcClient.getChainId() !== chain.id) throw new Error("Switch your wallet to Arc Testnet.");
      if (!Array.isArray(accounts) || String(accounts[0]).toLowerCase() !== wallet.account.toLowerCase()) throw new Error("Your account changed. Review this agreement with the current wallet.");
      const current = await readAgreement(address);
      if (current.termsHash !== snapshot.termsHash || current.vault.address !== snapshot.vault.address) throw new Error("The agreement snapshot changed. Refresh and review again.");
      const eligible = agreementEligibility(current, wallet.account, document);
      if (!(action === "accept" ? eligible.canAccept : eligible.canLock)) throw new Error("This action is no longer eligible. Refresh the agreement state.");
      const account = wallet.account as Address;
      const signer = createWalletClient({ account, chain, transport: custom(wallet.provider) });
      let hash: Hex;
      if (action === "accept") {
        const simulation = await arcClient.simulateContract({ address, abi: agreementAbi, functionName: "acceptAgreement", args: [current.termsHash], account });
        setPhase("wallet"); hash = await signer.writeContract(simulation.request);
      } else {
        const simulation = await arcClient.simulateContract({ address, abi: agreementAbi, functionName: "lockAgreement", account });
        setPhase("wallet"); hash = await signer.writeContract(simulation.request);
      }
      submitted = { chainId: chain.id, hash, address, account, termsHash: current.termsHash, action }; remember(submitted);
    } catch (e) { setError(message(e)); setPhase("idle"); }
    finally { sending.current = false; }
    if (submitted) await checkReceipt(submitted);
  }
  function clearTracking() {
    if (!failedReceipt && phase !== "confirmed") return;
    setTransaction(undefined); setError(""); setFailedReceipt(false); setPhase("idle"); refresh();
    try { sessionStorage.removeItem(storageKey); } catch { /* Optional storage. */ }
  }
  return { transaction, completed, phase, error, failedReceipt, busy: ["checking", "wallet", "pending"].includes(phase), send, checkReceipt, clearTracking };
}
