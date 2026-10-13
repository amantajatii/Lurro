"use client";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiOutlineCheck, HiOutlineChevronDown, HiOutlineFolder, HiOutlinePlus, HiOutlineLink } from "react-icons/hi2";
import { addressFrom, shortAddress } from "../../lib/vault-reader";
import { switchProjectRoute } from "../../lib/project-routes";
import { parseProjectBookmarks, projectBookmarksSnapshot, subscribeProjectBookmarks } from "../../lib/project-bookmarks";
import { Button } from "../ui/button";
import { FormField } from "../ui/form-field";

export function ProjectSwitcher({ section, address, disabled = false, onNavigate }: { section: string; address?: string; disabled?: boolean; onNavigate: () => void }) {
  const router = useRouter();
  const raw = useSyncExternalStore(subscribeProjectBookmarks, projectBookmarksSnapshot, () => "[]");
  const saved = parseProjectBookmarks(raw);
  let current: string | undefined;
  try { if (address) current = addressFrom(address); } catch { /* Invalid query is handled by the project page. */ }
  const projects = current && !saved.includes(current) ? [current, ...saved] : saved;
  const [open, setOpen] = useState(false);
  const [enterAddress, setEnterAddress] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  function close() { setOpen(false); setEnterAddress(false); setError(""); }
  function navigate() { close(); onNavigate(); }
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) { setOpen(false); setEnterAddress(false); setError(""); } }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const vault = addressFrom(input.trim());
      router.push(switchProjectRoute(section, vault));
      setInput(""); navigate();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Enter a valid vault address."); }
  }
  return <div className="project-switcher" ref={root} onKeyDown={event => {
    if (event.key === "Escape" && open) { event.stopPropagation(); close(); trigger.current?.focus(); }
  }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }}>
    <button ref={trigger} type="button" className="dash-workspace project-switcher-trigger" disabled={disabled} aria-expanded={open && !disabled} aria-controls={id} onClick={() => { if (open) close(); else setOpen(true); }}>
      <span className="dash-workspace-mark"><Image src="/lurro-mark.webp" width={23} height={23} alt="" unoptimized /></span>
      <span className="project-switcher-label"><strong>{current ? `Vault ${shortAddress(current)}` : "Project workspace"}</strong><span>Arc Testnet</span></span>
      <HiOutlineChevronDown aria-hidden="true" />
    </button>
    {open && !disabled && <div id={id} className="project-switcher-popover" aria-label="Switch project">
      <span className="project-switcher-caption">{projects.length ? "YOUR PROJECTS" : "PROJECTS"}</span>
      {projects.length ? <ul className="project-switcher-list">{projects.map(vault => <li key={vault}>
        <Link href={switchProjectRoute(section, vault)} prefetch={false} onClick={navigate} className={vault === current ? "project-switcher-active" : ""} aria-current={vault === current ? "true" : undefined} title={vault}>
          <HiOutlineFolder aria-hidden="true" /><span><strong>Vault {shortAddress(vault)}</strong><small>{vault === current ? "Current project" : "Saved in this browser"}</small></span>{vault === current && <HiOutlineCheck aria-label="Selected" />}
        </Link>
      </li>)}</ul> : <p className="project-switcher-empty">No saved projects yet. Open a vault or create your first project.</p>}
      <div className="project-switcher-actions">
        <Link href="/app/new/" onClick={navigate}><HiOutlinePlus aria-hidden="true" />Create project</Link>
        <button type="button" aria-expanded={enterAddress} onClick={() => { setEnterAddress(value => !value); setError(""); requestAnimationFrame(() => root.current?.querySelector<HTMLInputElement>("input")?.focus()); }}><HiOutlineLink aria-hidden="true" />Open vault address</button>
      </div>
      {enterAddress && <form className="project-switcher-form" onSubmit={submit}>
        <FormField label="Arc Testnet vault address" value={input} onChange={value => { setInput(value); setError(""); }} placeholder="0x…" maxLength={42} hint="Vault data is read from Arc after opening." />
        {error && <p role="alert" className="dash-field-error">{error}</p>}
        <Button type="submit" variant="primary">Open project</Button>
      </form>}
    </div>}
  </div>;
}
