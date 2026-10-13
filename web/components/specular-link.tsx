"use client";

import { useEffect, useRef, type AnchorHTMLAttributes, type PointerEvent } from "react";

type Props = Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "className" | "target" | "rel">;

/** Lightweight interpretation of React Bits' specular rim: local pointer events, no canvas. */
export function SpecularLink({ children, className = "", ...props }: Props) {
  const frame = useRef(0);
  const bounds = useRef<DOMRect | null>(null);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function enter(event: PointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== "mouse" || !window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches) return;
    bounds.current = event.currentTarget.getBoundingClientRect();
    move(event);
  }

  function move(event: PointerEvent<HTMLAnchorElement>) {
    const rect = bounds.current;
    if (!rect) return;
    const element = event.currentTarget;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      element.style.setProperty("--shine-x", `${x}px`);
      element.style.setProperty("--shine-y", `${y}px`);
      element.style.setProperty("--shine-angle", `${Math.atan2(y - rect.height / 2, x - rect.width / 2) * 180 / Math.PI + 90}deg`);
      frame.current = 0;
    });
  }

  function leave() {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    bounds.current = null;
  }

  return <a {...props} className={`button specular-link ${className}`} onPointerEnter={enter} onPointerMove={move} onPointerLeave={leave} onPointerCancel={leave}><span className="specular-label">{children}</span></a>;
}
