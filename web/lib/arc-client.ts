import { createPublicClient, fallback, http } from "viem";
import { network } from "./network";

export const arcClient = createPublicClient({ chain: network.chain, transport: fallback(
  network.rpcUrls.map(url => http(url, { timeout:12000,retryCount:1,retryDelay:500,batch:{ batchSize:5,wait:32 } })),
  { rank:false,retryCount:0 },
) });
// Log queries remain unbatched to respect provider history limits.
export const arcAuditClient = createPublicClient({ chain: network.chain, transport: fallback(
  network.rpcUrls.map(url => http(url, { timeout:12000,retryCount:1,retryDelay:500 })),
  { rank:false,retryCount:0 },
) });
