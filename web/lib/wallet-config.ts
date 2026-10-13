import { createConfig, createStorage, http, fallback } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, rainbowWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { arcTestnet } from "viem/chains";
export function createLurroWalletConfig(projectId?: string) {
  const connectors = connectorsForWallets([{ groupName: "Connect to Lurro", wallets: projectId ? [rainbowWallet, injectedWallet, walletConnectWallet] : [injectedWallet] }], { appName: "Lurro", projectId: projectId || "" });
  // Keep live connectors for client navigation without rehydrating serialized connector objects.
  // SSR hydration needs the persistence middleware, so use no-op storage instead of storage:null.
  const storage = createStorage({ key:"lurro.wallet", storage:{ getItem:()=>null,setItem:()=>{},removeItem:()=>{} } });
  return createConfig({ chains:[arcTestnet], connectors, ssr:true, storage, transports:{ [arcTestnet.id]:fallback([
    http("https://rpc.testnet.arc.io",{ retryCount:1 }),http("https://arc-testnet.drpc.org",{ retryCount:1 }),
  ]) } });
}
