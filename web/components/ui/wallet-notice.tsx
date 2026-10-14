"use client";
import { Button } from "./button";
import { useWallet } from "../dashboard/use-wallet";
export function WalletNotice({ agreement = false }: { agreement?: boolean }) {
  const wallet = useWallet();
  return <div className="app-wallet-notice" role="status"><div><strong>This wallet isn’t a party to this agreement.</strong><p>{agreement ? "Switch to an assigned wallet to accept. You can still inspect the project, and anyone can lock after all parties accept." : "Switch to an assigned wallet for role-specific actions. Public reads and eligible permissionless actions remain available."}</p></div><Button onClick={wallet.openAccount}>Switch wallet</Button></div>;
}
