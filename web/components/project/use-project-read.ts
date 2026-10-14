"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addressFrom } from "../../lib/vault-reader";
export function useProjectRead<T>(reader: (address: ReturnType<typeof addressFrom>) => Promise<T>) {
  const raw = useSearchParams().get("project") || "";
  let address: ReturnType<typeof addressFrom> | undefined;
  let parameterError = "";
  try { if (raw) address = addressFrom(raw); } catch { parameterError = "The project URL contains an invalid vault address."; }
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ key: string; address: string; data?: T; error?: string }>();
  const key = `${raw}:${version}`;
  useEffect(() => {
    if (!address) return;
    let current = true;
    reader(address).then(data => { if (current) setResult({ key, address, data }); }, error => {
      if (current) setResult({ key, address, error: error instanceof Error ? ("shortMessage" in error ? String(error.shortMessage) : error.message).split("\n")[0] : "The project could not be read. Please retry." });
    });
    return () => { current = false; };
  }, [reader, address, key]);
  return { address, raw, parameterError, data: result && result.address === address ? result.data : undefined, error: result?.key === key ? result.error : undefined, loading: !!address && result?.key !== key, refresh: () => setVersion(v => v + 1) };
}
