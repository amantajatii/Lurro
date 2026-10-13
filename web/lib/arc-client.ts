import { createPublicClient, fallback, http } from "viem";
import { arcTestnet } from "viem/chains";
// Circle's primary endpoint; dRPC's documented public endpoint when unavailable.
// https://docs.arc.io/arc/references/rpc-endpoints
// https://drpc.org/docs/arc-api
export const arcClient = createPublicClient({ chain: arcTestnet, transport: fallback([
  http("https://rpc.testnet.arc.io", { timeout: 12000, retryCount: 0 }),
  http("https://arc-testnet.drpc.org", { timeout: 12000, retryCount: 0 }),
], { rank: false, retryCount: 0 }) });
