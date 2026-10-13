"use client";

import { useRef, useState } from "react";

export function Navigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={toggle} type="button" className="menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>
      <span /><span className={open ? "menu-open" : ""} />
    </button>
    <nav id="primary-navigation" aria-label="Primary" className={`navigation ${open ? "navigation-open" : ""}`} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }}>
      <a href="#product" onClick={() => setOpen(false)}>Product</a>
      <a href="#how-it-works" onClick={() => setOpen(false)}>How it works</a>
      <a href="#use-cases" onClick={() => setOpen(false)}>Use cases</a>
      <a href="#faq" onClick={() => setOpen(false)}>FAQs</a>
      <a className="nav-mobile-proof" href="#proof" onClick={() => setOpen(false)}>Explore the proof ↗</a>
    </nav>
  </>;
}
