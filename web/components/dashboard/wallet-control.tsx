"use client";
import { HiOutlineWallet, HiOutlineChevronDown } from "react-icons/hi2";
import { useWallet } from "./use-wallet";
import { shortAddress } from "../../lib/vault-reader";
import { Button } from "../ui/button";
export function WalletControl({ disabled = false }: { disabled?: boolean; open: boolean; onOpenChange: (open: boolean) => void }) {
  const wallet = useWallet();
  return <Button variant={wallet.account ? "default" : "primary"} disabled={disabled || wallet.busy} onClick={wallet.account ? wallet.openAccount : wallet.discover}><HiOutlineWallet />{wallet.busy ? "Connecting…" : wallet.account ? shortAddress(wallet.account) : "Connect wallet"}{wallet.account && <HiOutlineChevronDown />}</Button>;
}
