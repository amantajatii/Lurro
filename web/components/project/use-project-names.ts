"use client";
import { useMemo, useSyncExternalStore } from "react";
import { parseProjectNames, projectNamesSnapshot, subscribeProjectBookmarks } from "../../lib/project-bookmarks";
export function useProjectNames() {
  const raw = useSyncExternalStore(subscribeProjectBookmarks,projectNamesSnapshot,() => "{}");
  return useMemo(() => parseProjectNames(raw),[raw]);
}
