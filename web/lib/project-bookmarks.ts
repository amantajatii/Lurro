import { getAddress, isAddress } from "viem";

export const projectBookmarksKey = "lurro:testnet:linked-vaults:v1";
export const projectBookmarksEvent = "lurro:projects-changed";
export function parseProjectBookmarks(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((item): item is string => typeof item === "string" && isAddress(item)).map(item => getAddress(item)))].slice(0, 12);
  } catch { return []; }
}
export function projectBookmarksSnapshot() {
  try { return localStorage.getItem(projectBookmarksKey) || "[]"; } catch { return "[]"; }
}
export function readProjectBookmarks() { return parseProjectBookmarks(projectBookmarksSnapshot()); }
export function saveProjectBookmarks(addresses: string[]) {
  localStorage.setItem(projectBookmarksKey, JSON.stringify(parseProjectBookmarks(JSON.stringify(addresses))));
  window.dispatchEvent(new Event(projectBookmarksEvent));
}
export function subscribeProjectBookmarks(callback: () => void) {
  const onStorage = (event: StorageEvent) => { if (event.key === projectBookmarksKey || event.key === projectNamesKey || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(projectBookmarksEvent, callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(projectBookmarksEvent, callback); };
}

export const projectNamesKey = "lurro:testnet:project-names:v1";
export type ProjectNames = Record<string, { name: string; documentHash: string }>;
export function parseProjectNames(raw: string | null): ProjectNames {
  const names: ProjectNames = {};
  try {
    const value: unknown = JSON.parse(raw || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return names;
    for (const [address, item] of Object.entries(value).slice(-24)) {
      if (!isAddress(address) || !item || typeof item !== "object") continue;
      const entry = item as { name?: unknown; documentHash?: unknown };
      if (typeof entry.name !== "string" || !entry.name.trim() || typeof entry.documentHash !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(entry.documentHash)) continue;
      names[address.toLowerCase()] = { name:entry.name.trim().slice(0,100),documentHash:entry.documentHash.toLowerCase() };
    }
  } catch { /* Malformed browser metadata has no authority. */ }
  return names;
}
export function projectNamesSnapshot() {
  try { return localStorage.getItem(projectNamesKey) || "{}"; } catch { return "{}"; }
}
export function saveVerifiedProjectName(address: string, name: string, documentHash: string) {
  const names = parseProjectNames(projectNamesSnapshot());
  const next = parseProjectNames(JSON.stringify({ [address]:{ name,documentHash } }))[address.toLowerCase()];
  if (!next) return;
  if (names[address.toLowerCase()]?.name === next.name && names[address.toLowerCase()]?.documentHash === next.documentHash) return;
  delete names[address.toLowerCase()]; names[address.toLowerCase()] = next;
  localStorage.setItem(projectNamesKey,JSON.stringify(parseProjectNames(JSON.stringify(names))));
  window.dispatchEvent(new Event(projectBookmarksEvent));
}
