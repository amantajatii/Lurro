import { decodeEventLog, type Address, type Hex } from "viem";
import { arcClient, arcAuditClient } from "./arc-client";
import { workflowAbi } from "./workflow-abi";
import { explorer, proofVault } from "./vault-reader";
const deployments = new Map<string,bigint>();
async function explorerJSON(path: string) {
  const response = await fetch(`${explorer}/api/v2/${path}`, { signal: AbortSignal.timeout(15000), credentials: "omit" });
  if (!response.ok) throw new Error("The Arc explorer could not provide event history. Please retry.");
  return response.json();
}
export async function deploymentBlock(address: Address, head: bigint) {
  const key = address.toLowerCase(); const cached = deployments.get(key); if (cached !== undefined) return cached;
  if (key === proofVault) {
    const receipt = await arcClient.getTransactionReceipt({ hash:"0x0e036d34c61233cb9460e107ecc4cd4637d02b28b3e820c979c813023d605af9" });
    if (receipt.contractAddress?.toLowerCase() !== key || receipt.status !== "success") throw new Error("The documented deployment receipt does not match this vault.");
    deployments.set(key,receipt.blockNumber); return receipt.blockNumber;
  }
  try {
    const details = await explorerJSON(`addresses/${address}`);
    if (/^0x[0-9a-fA-F]{64}$/.test(details.creation_transaction_hash)) {
      const receipt = await arcClient.getTransactionReceipt({ hash: details.creation_transaction_hash });
      if (receipt.contractAddress?.toLowerCase() === key && receipt.status === "success" && receipt.blockNumber <= head) { deployments.set(key,receipt.blockNumber);return receipt.blockNumber; }
    }
  } catch { /* Historical code lookup remains available if the indexer is behind. */ }
  let low = 0n; let high = head;
  while (low < high) { const mid = (low+high)/2n; const code = await arcClient.getCode({ address,blockNumber:mid }); if (code && code !== "0x") high = mid; else low = mid+1n; }
  deployments.set(key,low); return low;
}
export type AuditLog = { address: Address; blockNumber: bigint; logIndex: number; transactionHash: Hex; eventName: string; args: Record<string,unknown> };
function sortLogs(logs: AuditLog[]) { return logs.sort((a,b) => a.blockNumber === b.blockNumber ? a.logIndex-b.logIndex : a.blockNumber < b.blockNumber ? -1 : 1); }
export function decodeExplorerLog(raw: unknown, address: Address): AuditLog {
  const item = raw as { address?: { hash?: string }; block_number?: unknown; index?: unknown; transaction_hash?: unknown; topics?: unknown; data?: unknown };
  if (item?.address?.hash?.toLowerCase() !== address.toLowerCase() || !/^\d+$/.test(String(item.block_number)) || !Number.isSafeInteger(item.index) || Number(item.index)<0 || typeof item.transaction_hash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(item.transaction_hash) || !Array.isArray(item.topics) || typeof item.data !== "string" || !/^0x([0-9a-fA-F]{2})*$/.test(item.data)) throw new Error("Explorer event data could not be verified.");
  const topics = item.topics.filter(t => t !== null);
  if (!topics.length || !topics.every(t => typeof t === "string" && /^0x[0-9a-fA-F]{64}$/.test(t))) throw new Error("Explorer event topics could not be verified.");
  // Decode the original raw bytes with our ABI; never trust the explorer's display labels.
  const decoded = decodeEventLog({ abi: workflowAbi, data: item.data as Hex, topics: topics as [Hex,...Hex[]], strict: true });
  return { address,blockNumber:BigInt(String(item.block_number)),logIndex:Number(item.index),transactionHash:item.transaction_hash as Hex,eventName:decoded.eventName,args:decoded.args };
}
export async function readExplorerWindow(address: Address, from: bigint, to: bigint) {
  const logs: AuditLog[] = []; let query = ""; const seen = new Set<string>();
  for (let page = 0; page < 40; page++) {
    const data = await explorerJSON(`addresses/${address}/logs${query}`);
    if (!Array.isArray(data.items)) throw new Error("The explorer did not return a usable event page.");
    const decoded = data.items.map((item:unknown) => decodeExplorerLog(item,address));
    logs.push(...decoded.filter((item:AuditLog) => item.blockNumber >= from && item.blockNumber <= to));
    if (logs.length > 2000) throw new Error("This event range is too large. Choose a more recent start block or use the explorer.");
    if (!data.next_page_params || decoded.some((item:AuditLog) => item.blockNumber < from)) return sortLogs(logs);
    const params = new URLSearchParams();
    for (const [key,value] of Object.entries(data.next_page_params)) {
      if (!["block_number","index","items_count"].includes(key) || !/^\d+$/.test(String(value))) throw new Error("The explorer pagination could not be verified.");
      params.set(key,String(value));
    }
    query = `?${params}`; if (seen.has(query)) throw new Error("The explorer repeated an event page. Please retry."); seen.add(query);
  }
  throw new Error("The requested history exceeds this browser's event limit. Choose a more recent block range or use the explorer.");
}
export async function readAuditWindow(address: Address, from: bigint, head: bigint) {
  if (from < 0n || from > head) throw new Error("Start block must be between deployment and the snapshot block.");
  const to = from+9999n < head ? from+9999n : head;
  const logs: AuditLog[] = [];
  try {
    for (let block = from; block <= to; block+=2000n) {
      const raw = await arcAuditClient.getLogs({ address,fromBlock:block,toBlock:block+1999n < to ? block+1999n : to });
      logs.push(...raw.map(log => ({ address,blockNumber:log.blockNumber,logIndex:log.logIndex,transactionHash:log.transactionHash,...decodeEventLog({ abi: workflowAbi,data:log.data,topics:log.topics,strict:true }) })));
    }
    if (logs.length > 2000) throw new Error("Event limit reached.");
    return { from,to,logs:sortLogs(logs),head,source:"rpc" as const };
  } catch {
    return { from,to,logs:await readExplorerWindow(address,from,to),head,source:"explorer" as const };
  }
}
export type AuditWindow = Awaited<ReturnType<typeof readAuditWindow>>;
export function serializeAudit(value: unknown) { return JSON.stringify(value,(_,v) => typeof v === "bigint" ? v.toString() : v,2); }
export function paymentEvent(name: string) { return ["PaymentSettled","RefundSettled"].includes(name); }
