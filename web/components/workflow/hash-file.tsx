"use client";
import { useRef, useState } from "react";
import { keccak256, toHex, type Hex } from "viem";
export function HashFile({ label, expected, onHash }: { label: string; expected?: Hex; onHash: (hash?: Hex) => void }) {
  const [hash,setHash] = useState<Hex>(); const [filename,setFilename] = useState(""); const [error,setError] = useState(""); const [busy,setBusy] = useState(false); const version = useRef(0);
  async function choose(file?: File) { const id = ++version.current; setHash(undefined); onHash(undefined); setError(""); setBusy(false); setFilename(""); if (!file) return;
    if (!file.size || file.size > 10*1024*1024) { setError("Choose a non-empty file up to 10 MB."); return; } setBusy(true);
    try { const bytes = new Uint8Array(await file.arrayBuffer()); const hash = keccak256(toHex(bytes)); if (id !== version.current) return; setHash(hash); setFilename(file.name); if (expected && hash !== expected) { setError("This file does not match the current evidence commitment."); } else onHash(hash); }
    catch { if (id === version.current) setError("The file could not be read."); } finally { if (id === version.current) setBusy(false); }
  }
  return <label className="workflow-file"><span>{label}</span><input type="file" onChange={e => void choose(e.target.files?.[0])} /><small>{busy ? "Calculating the exact file commitment…" : filename || "File stays in your browser. Only its hash is sent to the contract; share the original with the reviewer separately."}</small>{hash && <code>{hash}</code>}{expected && hash === expected && <small>Exact file matches the current evidence.</small>}{error && <small role="alert" className="dash-field-error">{error}</small>}</label>;
}
