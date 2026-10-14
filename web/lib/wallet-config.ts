import { createConfig, createStorage, http, fallback } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, rainbowWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { arc, arcTestnet } from "viem/chains";
import { network } from "./network";
export function createLurroWalletConfig(projectId?: string) {
  const connectors = connectorsForWallets([{ groupName: "Connect to Lurro", wallets: projectId ? [rainbowWallet, injectedWallet, walletConnectWallet] : [injectedWallet] }], { appName: "Lurro", projectId: projectId || "" });
  // Keep live connectors for client navigation without rehydrating serialized connector objects.
  // SSR hydration needs the persistence middleware, so use no-op storage instead of storage:null.
  const storage = createStorage({ key:"lurro.wallet", storage:{ getItem:()=>null,setItem:()=>{},removeItem:()=>{} } });
  return createConfig({ chains:network.mainnet ? [network.chain,arcTestnet] : [arcTestnet,arc], connectors, ssr:true, storage, transports:{ [arcTestnet.id]:fallback([
    ...(network.mainnet ? ["https://rpc.testnet.arc.io", "https://arc-testnet.drpc.org"] : network.rpcUrls).map(url => http(url, { retryCount:1 })),
  ]), [arc.id]:fallback((network.mainnet ? network.rpcUrls : ["https://rpc.mainnet.arc.io", "https://rpc.blockdaemon.mainnet.arc.io"]).map(url => http(url, { retryCount:1 }))) } });
}
