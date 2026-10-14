import { arc, arcTestnet } from "viem/chains";

export function networkSettings(value: string | undefined, rpcUrl?: string) {
  if (value && value !== "testnet" && value !== "mainnet") throw new Error("NEXT_PUBLIC_LURRO_NETWORK must be testnet or mainnet.");
  const mainnet = value === "mainnet";
  if (rpcUrl) {
    const url = new URL(rpcUrl);
    if (url.username || url.password || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) throw new Error("Custom RPC must use HTTPS or a loopback HTTP endpoint, without URL credentials.");
  }
  const defaultRpcUrls = mainnet
    ? ["https://rpc.mainnet.arc.io", "https://rpc.blockdaemon.mainnet.arc.io"]
    : ["https://rpc.testnet.arc.io", "https://arc-testnet.drpc.org", "https://rpc.blockdaemon.testnet.arc.network"];
  return {
    mainnet,
    chain: mainnet ? { ...arc, name: "Arc Mainnet" } : arcTestnet,
    label: mainnet ? "Arc Mainnet" : "Arc Testnet",
    shortLabel: mainnet ? "Mainnet" : "Testnet",
    unit: mainnet ? "real USDC" : "test USDC",
    explorer: mainnet ? "https://explorer.arc.io" : "https://explorer.testnet.arc.io",
    rpcUrls: rpcUrl ? [rpcUrl, ...defaultRpcUrls] : defaultRpcUrls,
    // Historical Testnet evidence must never be offered as a Mainnet project.
    proofVault: mainnet ? "" : "0xa3b6db6a52ff3cf32438c0989af041d77d3dacae",
    namespace: mainnet ? "lurro:5042" : "lurro:testnet",
  };
}
// Network is fixed for each build. Rebuild to change it: no in-flight action can migrate chains.
export const network = networkSettings(process.env.NEXT_PUBLIC_LURRO_NETWORK ?? (process.env.NODE_ENV === "production" ? "mainnet" : "testnet"), process.env.NEXT_PUBLIC_LURRO_RPC_URL);
export const mainnetWritesEnabled = process.env.NEXT_PUBLIC_LURRO_MAINNET_WRITES_ENABLED === "true";
export const writesEnabled = !network.mainnet || mainnetWritesEnabled;
export function assertWriteAccess(acknowledged = false) {
  if (network.mainnet && !mainnetWritesEnabled) throw new Error("Mainnet transactions are disabled pending release review.");
  if (network.mainnet && !acknowledged) throw new Error("Confirm real-USDC exposure, immutable recipients and the unaudited prototype before this action.");
}
export function pendingStorageKey(kind: "creation" | "agreement" | "workflow", address?: string) {
  const prefix = network.mainnet ? "lurro:5042" : "lurro";
  return kind === "creation" ? `${prefix}:pending-creation:v1` : `${prefix}:${kind}:pending:${address?.toLowerCase()}`;
}
