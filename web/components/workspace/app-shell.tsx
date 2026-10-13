"use client";
import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { HiOutlineSquares2X2, HiOutlineFolder, HiOutlineDocumentText, HiOutlineWallet, HiOutlineFlag, HiOutlineReceiptPercent, HiOutlineShieldCheck, HiOutlineMagnifyingGlass, HiOutlineArrowLeftOnRectangle, HiOutlineArrowUpRight, HiOutlineBars3, HiOutlineXMark } from "react-icons/hi2";
import { projectRoute } from "../../lib/project-routes";
import { ProjectSwitcher } from "./project-switcher";
import { WalletControl } from "../dashboard/wallet-control";
import { Button } from "../ui/button";
const workflow = [{ key: "agreement", title: "Agreement", icon: HiOutlineDocumentText }, { key: "funding", title: "Funding", icon: HiOutlineWallet }, { key: "milestones", title: "Milestones", icon: HiOutlineFlag }, { key: "payments", title: "Payments", icon: HiOutlineReceiptPercent }, { key: "governance", title: "Governance", icon: HiOutlineShieldCheck }, { key: "audit", title: "Audit Explorer", icon: HiOutlineMagnifyingGlass }];
type Props = { children: ReactNode; title: string; mainId: string; activePage: "dashboard" | "overview" | "create" | "agreement" | "funding" | "milestones" | "payments" | "governance" | "audit"; className?: string; mainClassName?: string; projectAddress?: string; projectCount?: number; onProjectsClick?: () => void; creationNavigation?: ReactNode; walletDisabled?: boolean; walletPicker?: { open: boolean; onOpenChange: (open: boolean) => void } };
export function AppShell({ children, title, mainId, activePage, className = "", mainClassName = "", projectAddress, projectCount, onProjectsClick, creationNavigation, walletDisabled = false, walletPicker }: Props) {
  const [menu, setMenu] = useState(false);
  const [internalPicker, setInternalPicker] = useState(false);
  const open = walletPicker?.open ?? internalPicker;
  const setOpen = walletPicker?.onOpenChange ?? setInternalPicker;
  function closeMenus() { setMenu(false); setOpen(false); }
  return <div className={`dashboard-shell ${className}`.trim()} onKeyDown={e => { if (e.key === "Escape") closeMenus(); }}>
    <a href={`#${mainId}`} className="skip-link">Skip to {activePage === "create" ? "project form" : activePage === "overview" ? "project overview" : activePage === "agreement" ? "agreement" : activePage}</a>
    {menu && <button className="dash-mobile-overlay" aria-label="Close menu" onClick={closeMenus} />}
    <AppSidebar activePage={activePage} projectAddress={projectAddress} projectCount={projectCount} onProjectsClick={onProjectsClick} creationNavigation={creationNavigation} walletDisabled={walletDisabled} menu={menu} closeMenus={closeMenus} />
    <div className="dash-body"><AppHeader title={title} menu={menu} openMenu={() => setMenu(true)} walletDisabled={walletDisabled} open={open} setOpen={setOpen} />
      <main id={mainId} className={`dash-main ${mainClassName}`.trim()} tabIndex={-1}>{children}<AppFooter /></main>
    </div>
  </div>;
}
function AppSidebar({ activePage, projectAddress, projectCount, onProjectsClick, creationNavigation, walletDisabled, menu, closeMenus }: Pick<Props, "activePage" | "projectAddress" | "projectCount" | "onProjectsClick" | "creationNavigation" | "walletDisabled"> & { menu: boolean; closeMenus: () => void }) {
  const creation = activePage === "create";
  return <aside className={`dash-sidebar ${creation ? "create-sidebar" : ""} ${menu ? "dash-sidebar-open" : ""}`.trim()} onClick={event => { if (creation && (event.target as Element).closest("nav button:not(:disabled), a")) closeMenus(); }}>
    <div className="dash-brand-row"><Link href="/" aria-label="Lurro home" onClick={closeMenus}><Image src="/lurro-logo.webp" width={114} height={40} alt="" unoptimized /></Link><Button variant="icon" className="dash-sidebar-close" aria-label="Close menu" onClick={closeMenus}><HiOutlineXMark /></Button></div>
    {creation ? creationNavigation : <><ProjectSwitcher section={activePage} address={projectAddress} disabled={walletDisabled} onNavigate={closeMenus} />
      <nav aria-label="App navigation"><span className="dash-nav-label">WORKSPACE</span><Link href="/app/" aria-current={activePage === "dashboard" ? "page" : undefined} className={activePage === "dashboard" ? "dash-nav-active" : ""} onClick={closeMenus}><HiOutlineSquares2X2 />Dashboard</Link>{onProjectsClick ? <button onClick={() => { onProjectsClick(); closeMenus(); }}><HiOutlineFolder />Projects<span className="dash-nav-count">{projectCount}</span></button> : <Link href="/app/#projects" onClick={closeMenus}><HiOutlineFolder />Projects</Link>}
      <span className="dash-nav-label dash-project-label">{(!!projectAddress) ? "THIS PROJECT" : <>PROJECT PAGES</>}</span><Link href={projectAddress ? projectRoute(projectAddress) : "/app/project/"} aria-current={activePage === "overview" ? "page" : undefined} className={activePage === "overview" ? "dash-nav-active" : ""} onClick={closeMenus}><HiOutlineFolder />Overview</Link>{workflow.map(item => <Link key={item.key} href={`/app/${item.key}/${projectAddress ? `?project=${encodeURIComponent(projectAddress)}` : ""}`} className={activePage === item.key ? "dash-nav-active" : ""} aria-current={activePage === item.key ? "page" : undefined} onClick={closeMenus}><item.icon />{item.title}</Link>)}</nav></>}
    <div className="dash-sidebar-bottom"><div className="dash-prototype"><HiOutlineShieldCheck /><strong>{creation ? "The agreement comes first." : "Testnet workspace"}</strong><p>{creation ? "Addresses and payment rights become immutable when the vault is created." : "Test USDC only. Contract prototype is not independently audited."}</p>{!creation && <a href="https://github.com/amantajatii/Lurro/blob/main/contracts/SECURITY-REVIEW.md" target="_blank" rel="noopener noreferrer">Review & limitations <HiOutlineArrowUpRight /></a>}</div>{!creation && <Link href="/" onClick={closeMenus}><HiOutlineArrowLeftOnRectangle />Back to website</Link>}</div>
  </aside>;
}
function AppHeader({ title, menu, openMenu, walletDisabled, open, setOpen }: { title: string; menu: boolean; openMenu: () => void; walletDisabled: boolean; open: boolean; setOpen: (open: boolean) => void }) {
  return <header className="dash-topbar"><div><Button variant="icon" className="dash-mobile-menu" aria-label="Open menu" aria-expanded={menu} onClick={openMenu}><HiOutlineBars3 /></Button><Link href="/app/">Workspace</Link><span className="dash-breadcrumb">/</span><strong>{title}</strong></div><div className="dash-topbar-actions"><span className="dash-network"><Image src="/arc-logo.webp" width={36} height={13} alt="Arc" unoptimized />Testnet</span><WalletControl disabled={walletDisabled} open={open} onOpenChange={setOpen} /></div></header>;
}
function AppFooter() { return <footer className="dash-footer"><span>Every fund, right where it belongs.</span><a href="https://github.com/amantajatii/Lurro" target="_blank" rel="noopener noreferrer">Protocol source <HiOutlineArrowUpRight /></a></footer>; }
