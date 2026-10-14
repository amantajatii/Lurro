"use client";
import { network } from "../lib/network";

import { useEffect, useRef, useState, type ElementType, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import { HiOutlineArrowRight, HiOutlineArrowUpRight, HiOutlineChevronDown, HiOutlineDocumentText, HiOutlineWallet, HiOutlineReceiptPercent, HiOutlineFlag, HiOutlineShieldCheck, HiOutlineMagnifyingGlass, HiOutlineCodeBracket, HiOutlineQuestionMarkCircle } from "react-icons/hi2";
import { SpecularLink } from "./specular-link";

const products = [
  { title: "Agreements", description: "Review terms and agree on payment rights.", href: "/app/agreement/", icon: HiOutlineDocumentText, tone: "violet" },
  { title: "Funding", description: "Deposit USDC and reserve milestone funds.", href: "/app/funding/", icon: HiOutlineWallet, tone: "blue" },
  { title: "Payments", description: "Follow entitlements, payouts, and refunds.", href: "/app/payments/", icon: HiOutlineReceiptPercent, tone: "peach" },
];
const workflow = [
  { title: "Milestones", href: "/app/milestones/", icon: HiOutlineFlag },
  { title: "Governance", href: "/app/governance/", icon: HiOutlineShieldCheck },
  { title: "Audit Explorer", href: "/app/audit/", icon: HiOutlineMagnifyingGlass },
];
const resources = [
  { title: "Testnet proof", description: "Inspect the deployed vault and real receipts.", href: network.mainnet ? "https://explorer.testnet.arc.io/address/0xa3b6db6a52ff3cf32438c0989af041d77d3dacae" : "/app/audit/?project=0xa3b6db6a52ff3cf32438c0989af041d77d3dacae", icon: HiOutlineMagnifyingGlass },
  { title: "Protocol source", description: "Read the contract and internal security review.", href: "https://github.com/amantajatii/Lurro", icon: HiOutlineCodeBracket },
  { title: "FAQs", description: "Understand the rules and current limitations.", href: "/#faq", icon: HiOutlineQuestionMarkCircle },
];
function FeatureLink({ title, description, href, icon: Icon, tone = "violet", onNavigate }: { title: string; description: string; href: string; icon: ElementType; tone?: string; onNavigate: () => void }) {
  const external = href.startsWith("https:");
  return <Link href={href} className="landing-feature-link" onClick={onNavigate} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
    <span className={`landing-feature-icon landing-feature-${tone}`}><Icon aria-hidden="true" /></span>
    <strong>{title}<HiOutlineArrowUpRight aria-hidden="true" /></strong><span>{description}</span>
  </Link>;
}
export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [panel, setPanel] = useState<"product" | "resources" | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const productTrigger = useRef<HTMLButtonElement>(null), resourcesTrigger = useRef<HTMLButtonElement>(null);
  const hoverClose = useRef<ReturnType<typeof setTimeout> | null>(null);
  function cancelHoverClose() { if (hoverClose.current !== null) { clearTimeout(hoverClose.current); hoverClose.current = null; } }
  function desktopHover() { return window.matchMedia("(min-width: 761px) and (hover: hover) and (pointer: fine)").matches; }
  function enterPanel(name: "product" | "resources", event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !desktopHover()) return;
    cancelHoverClose(); setPanel(name);
  }
  function leavePanel(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || !desktopHover()) return;
    if (event.currentTarget.querySelector(".landing-mega-menu")?.contains(document.activeElement)) return;
    // Allow the pointer to cross the small space between trigger and dropdown.
    cancelHoverClose(); hoverClose.current = setTimeout(() => { setPanel(null); hoverClose.current = null; }, 160);
  }
  function clickPanel(name: "product" | "resources", event: ReactMouseEvent<HTMLButtonElement>) {
    cancelHoverClose();
    setPanel(current => event.detail > 0 && desktopHover() ? name : current === name ? null : name);
  }
  function close() { cancelHoverClose(); setMobileOpen(false); setPanel(null); }
  useEffect(() => () => { if (hoverClose.current !== null) clearTimeout(hoverClose.current); }, []);
  useEffect(() => {
    if (!mobileOpen && !panel) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) { setMobileOpen(false); setPanel(null); } };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [mobileOpen, panel]);
  return <div className="landing-nav-region" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }} onKeyDown={event => {
    if (event.key === "Escape") {
      event.stopPropagation(); cancelHoverClose();
      if (panel) { (panel === "product" ? productTrigger : resourcesTrigger).current?.focus(); setPanel(null); }
      else { setMobileOpen(false); toggle.current?.focus(); }
    }
  }}>
    <button ref={toggle} type="button" className="menu-toggle" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="primary-navigation" onClick={() => { setMobileOpen(!mobileOpen); setPanel(null); }}><span /><span className={mobileOpen ? "menu-open" : ""} /></button>
    <nav id="primary-navigation" aria-label="Primary" className={`navigation landing-navigation ${mobileOpen ? "navigation-open" : ""}`}>
      <div className="landing-nav-group" onPointerEnter={event => enterPanel("product", event)} onPointerLeave={leavePanel}>
        <button ref={productTrigger} type="button" aria-expanded={panel === "product"} aria-controls="landing-product-menu" onClick={event => clickPanel("product", event)}>Product<HiOutlineChevronDown aria-hidden="true" /></button>
        {panel === "product" && <div id="landing-product-menu" className="landing-mega-menu">
          <div className="landing-menu-heading"><span>THE LURRO WORKSPACE</span><Link href="/app/" onClick={close}>Open dashboard<HiOutlineArrowRight aria-hidden="true" /></Link></div>
          <div className="landing-feature-grid">{products.map(item => <FeatureLink key={item.title} {...item} onNavigate={close} />)}</div>
          <div className="landing-workflow-links">{workflow.map(item => <Link key={item.title} href={item.href} onClick={close}><item.icon aria-hidden="true" />{item.title}<HiOutlineArrowRight aria-hidden="true" /></Link>)}</div>
          <div className="landing-menu-footer"><span>{network.label} · {network.unit}</span><Link href="/app/new/" onClick={close}>Create your first project<HiOutlineArrowRight aria-hidden="true" /></Link></div>
        </div>}
      </div>
      <div className="landing-nav-group" onPointerEnter={event => enterPanel("resources", event)} onPointerLeave={leavePanel}>
        <button ref={resourcesTrigger} type="button" aria-expanded={panel === "resources"} aria-controls="landing-resources-menu" onClick={event => clickPanel("resources", event)}>Resources<HiOutlineChevronDown aria-hidden="true" /></button>
        {panel === "resources" && <div id="landing-resources-menu" className="landing-mega-menu landing-resources-menu"><div className="landing-menu-heading"><span>EXPLORE LURRO</span></div><div className="landing-feature-grid">{resources.map(item => <FeatureLink key={item.title} {...item} onNavigate={close} />)}</div></div>}
      </div>
      <Link href="/docs/" onClick={close}>Docs</Link>
      <Link href="/#how-it-works" onClick={close}>How it works</Link>
      <Link href="/#use-cases" onClick={close}>Use cases</Link>
      <div className="landing-mobile-actions"><Link href="/app/" className="button button-secondary" onClick={close}>Open app</Link><Link href="/app/new/" className="button" onClick={close}>Create project</Link></div>
    </nav>
    <div className="landing-header-actions"><Link className="button button-secondary button-small landing-open-app" href="/app/" onClick={close}>Open app</Link><SpecularLink href="/app/new/" className="button-small header-cta landing-create-project">Create project</SpecularLink></div>
  </div>;
}
