"use client";
import { HiOutlineWallet, HiOutlineArrowLeftOnRectangle, HiOutlineArrowRight, HiOutlineXMark } from "react-icons/hi2";
import { useWallet } from "./use-wallet";
import { shortAddress } from "../../lib/vault-reader";
import { Button } from "../ui/button";
export function WalletControl({ disabled = false, open, onOpenChange }: { disabled?: boolean; open: boolean; onOpenChange: (open: boolean) => void }) {
  const wallet = useWallet();
  return <div className="dash-wallet-picker">{wallet.account ? <Button className="dash-wallet-connected" disabled={disabled || wallet.busy} title="Disconnect this workspace session" onClick={wallet.disconnect}><HiOutlineWallet />{shortAddress(wallet.account)}<HiOutlineArrowLeftOnRectangle /></Button> : <><Button variant="primary" aria-expanded={open} onClick={() => { wallet.discover(); onOpenChange(!open); }} disabled={disabled || wallet.busy}><HiOutlineWallet />{wallet.busy ? "Connecting…" : "Connect wallet"}</Button>{open && <div className="dash-wallet-options"><div><strong>Choose your wallet</strong><Button variant="icon" aria-label="Close wallet picker" onClick={() => onOpenChange(false)}><HiOutlineXMark /></Button></div>{wallet.options.length ? wallet.options.map(option => <button key={option.info.uuid} disabled={disabled || wallet.busy} onClick={() => { onOpenChange(false); void wallet.connect(option.info.uuid); }}>{option.info.name}<HiOutlineArrowRight /></button>) : <p>No browser wallet detected. Install an EVM wallet and reload.</p>}</div>}</>}</div>;
}
