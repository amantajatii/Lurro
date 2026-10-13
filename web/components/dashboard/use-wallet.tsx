"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { chain, addressFrom } from "../../lib/vault-reader";

export type Provider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown>; on?: (event: string, callback: (...args: unknown[]) => void) => void; removeListener?: (event: string, callback: (...args: unknown[]) => void) => void };
type WalletOption = { info: { uuid: string; name: string }; provider: Provider };
function useInjectedWallet() {
  const [options, setOptions] = useState<WalletOption[]>([]);
  const [selected, setSelected] = useState<WalletOption>();
  const [account, setAccount] = useState<string>();
  const [network, setNetwork] = useState<number>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const announce = (event: Event) => {
      const detail = (event as CustomEvent<WalletOption>).detail;
      if (!detail?.info?.uuid || !detail.provider?.request) return;
      setOptions(current => current.some(x => x.info.uuid === detail.info.uuid) ? current : [...current, detail]);
    };
    window.addEventListener("eip6963:announceProvider", announce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return () => window.removeEventListener("eip6963:announceProvider", announce);
  }, []);
  useEffect(() => {
    if (!selected) return;
    const accounts = (...args: unknown[]) => {
      const list = args[0];
      try { setAccount(Array.isArray(list) && list[0] ? addressFrom(String(list[0])) : undefined); } catch { setAccount(undefined); }
    };
    const chains = (...args: unknown[]) => setNetwork(Number(args[0]));
    const disconnect = () => { setAccount(undefined); setNetwork(undefined); };
    selected.provider.on?.("accountsChanged", accounts);
    selected.provider.on?.("chainChanged", chains);
    selected.provider.on?.("disconnect", disconnect);
    return () => { selected.provider.removeListener?.("accountsChanged", accounts); selected.provider.removeListener?.("chainChanged", chains); selected.provider.removeListener?.("disconnect", disconnect); };
  }, [selected]);
  function discover() {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    const legacy = (window as Window & { ethereum?: Provider }).ethereum;
    if (legacy && !options.length) setOptions([{ info: { uuid: "browser", name: "Browser wallet" }, provider: legacy }]);
  }
  async function connect(id: string) {
    const wallet = options.find(x => x.info.uuid === id);
    if (!wallet) { setError("Install an EVM browser wallet, then reload this page."); return; }
    setBusy(true); setError("");
    try {
      const accounts = await wallet.provider.request({ method: "eth_requestAccounts" });
      const chainId = await wallet.provider.request({ method: "eth_chainId" });
      if (!Array.isArray(accounts) || !accounts[0]) throw new Error("No account was shared.");
      setSelected(wallet); setAccount(addressFrom(String(accounts[0]))); setNetwork(Number(chainId));
    } catch { setError("Wallet connection was not completed. You can try again."); }
    finally { setBusy(false); }
  }
  async function switchNetwork() {
    if (!selected) return;
    setBusy(true); setError("");
    try {
      try { await selected.provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${chain.id.toString(16)}` }] }); }
      catch (e) {
        if ((e as { code?: number }).code !== 4902) throw e;
        await selected.provider.request({ method: "wallet_addEthereumChain", params: [{ chainId: `0x${chain.id.toString(16)}`, chainName: chain.name, nativeCurrency: chain.nativeCurrency, rpcUrls: ["https://rpc.testnet.arc.io"], blockExplorerUrls: ["https://explorer.testnet.arc.io"] }] });
        await selected.provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${chain.id.toString(16)}` }] });
      }
      setNetwork(Number(await selected.provider.request({ method: "eth_chainId" })));
    } catch { setError("Network switch was not completed. Switch to Arc Testnet in your wallet and retry."); }
    finally { setBusy(false); }
  }
  function disconnect() { setSelected(undefined); setAccount(undefined); setNetwork(undefined); setError(""); }
  return { options, account, network, busy, error, provider: selected?.provider, discover, connect, switchNetwork, disconnect };
}

const WalletContext = createContext<ReturnType<typeof useInjectedWallet> | null>(null);
export function WalletProvider({ children }: { children: ReactNode }) {
  const wallet = useInjectedWallet();
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}
export function useWallet() {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error("WalletProvider is missing.");
  return wallet;
}
