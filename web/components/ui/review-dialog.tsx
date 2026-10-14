"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./button";
export function ReviewDialog({ children, title, busy, onClose }: { children: ReactNode; title: string; busy: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null); const id = useId();
  useEffect(() => {
    const element = dialog.current; const previous = document.activeElement;
    element?.showModal();
    return () => { element?.close(); if (previous instanceof HTMLElement && previous.isConnected && !(previous instanceof HTMLButtonElement && previous.disabled)) previous.focus(); else { const main = document.querySelector("main"); main?.setAttribute("tabindex", "-1"); main?.focus(); } };
  }, []);
  return <dialog ref={dialog} className="app-review-dialog" aria-labelledby={id} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="app-dialog-heading"><h2 id={id}>{title}</h2><Button variant="icon" aria-label="Close review" disabled={busy} onClick={onClose}>×</Button></div>{children}
  </dialog>;
}
