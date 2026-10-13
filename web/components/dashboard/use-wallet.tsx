"use client";
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { WagmiProvider, useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme, useConnectModal, useAccountModal } from "@rainbow-me/rainbowkit";
import { chain } from "../../lib/vault-reader";
import { createLurroWalletConfig } from "../../lib/wallet-config";
import "@rainbow-me/rainbowkit/styles.css";
import { LogoLoader } from "../ui/logo-loader";
const subscribeHydration = () => () => {};
export type Provider = { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> };
const config = createLurroWalletConfig(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID);
function useRainbowWallet() {
  const account = useAccount();
  const disconnect = useDisconnect();
  const switcher = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const [connection, setConnection] = useState<{ key: string; provider: Provider }>();
  const [error, setError] = useState("");
  const key = `${account.connector?.uid}:${account.address}`;
  useEffect(() => {
    let active = true;
    if (account.isConnected && account.connector && typeof account.connector.getProvider === "function") account.connector.getProvider().then(provider => { if (active) setConnection({ key, provider: provider as Provider }); }).catch(() => { if (active) setError("Wallet provider is unavailable. Reconnect your wallet."); });
    return () => { active = false; };
  }, [account.isConnected, account.connector, key]);
  async function switchNetwork() {
    setError("");
    try { await switcher.switchChainAsync({ chainId: chain.id }); }
    catch { setError("Network switch was not completed. Switch to Arc Testnet and retry."); }
  }
  return { account: account.isConnected ? account.address : undefined, network: account.chainId, busy: account.isConnecting || switcher.isPending, error, provider: account.isConnected && connection?.key === key ? connection.provider : undefined, discover: () => openConnectModal?.(), openAccount: () => openAccountModal?.(), switchNetwork, disconnect: () => disconnect.disconnect() };
}
const WalletContext = createContext<ReturnType<typeof useRainbowWallet> | null>(null);
function WalletBridge({ children }: { children: ReactNode }) { const wallet = useRainbowWallet(); const mounted = useSyncExternalStore(subscribeHydration, () => true, () => false); return <WalletContext.Provider value={wallet}>{mounted ? children : <LogoLoader fullScreen />}</WalletContext.Provider>; }
export function WalletProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <WagmiProvider config={config} reconnectOnMount={false}><QueryClientProvider client={queryClient}><RainbowKitProvider modalSize="compact" initialChain={chain} theme={lightTheme({ accentColor: "#7052d8", accentColorForeground: "white", borderRadius: "medium", fontStack: "system", overlayBlur: "small" })}><WalletBridge>{children}</WalletBridge></RainbowKitProvider></QueryClientProvider></WagmiProvider>;
}
export function useWallet() { const wallet = useContext(WalletContext); if (!wallet) throw new Error("WalletProvider is missing."); return wallet; }
