import { createPublicClient, fallback, http } from "viem";
import { arcTestnet } from "viem/chains";
// Circle's primary endpoint; dRPC's documented public endpoint when unavailable.
// https://docs.arc.io/arc/references/rpc-endpoints
// https://drpc.org/docs/arc-api
export const arcClient = createPublicClient({ chain: arcTestnet, transport: fallback([
  http("https://rpc.testnet.arc.io", { timeout: 12000, retryCount: 1, retryDelay: 500, batch: { batchSize: 5, wait: 32 } }),
  http("https://arc-testnet.drpc.org", { timeout: 12000, retryCount: 1, retryDelay: 500, batch: { batchSize: 5, wait: 32 } }),
], { rank: false, retryCount: 0 }) });

// Historical log queries use individual requests; public providers apply stricter batch limits.
export const arcAuditClient = createPublicClient({ chain: arcTestnet, transport: fallback([
  http("https://rpc.testnet.arc.io", { timeout: 12000, retryCount: 1, retryDelay: 500 }),
  // Blockdaemon publishes this Arc Testnet host; HTTPS history/CORS verified locally.
  // https://www.blockdaemon.com/blog/blockdaemon-expands-arc-testnet-support-with-websockets
  http("https://rpc.blockdaemon.testnet.arc.network", { timeout: 12000, retryCount: 1, retryDelay: 500 }),
  http("https://arc-testnet.drpc.org", { timeout: 12000, retryCount: 1, retryDelay: 500 }),
], { rank: false, retryCount: 0 }) });
