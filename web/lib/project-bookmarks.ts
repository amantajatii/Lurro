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
  const onStorage = (event: StorageEvent) => { if (event.key === projectBookmarksKey || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  window.addEventListener(projectBookmarksEvent, callback);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener(projectBookmarksEvent, callback); };
}
