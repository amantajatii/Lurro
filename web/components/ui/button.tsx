import Link from "next/link";
import type { ComponentProps } from "react";
type Variant = "default" | "primary" | "icon" | "text";
function buttonClass(variant: Variant, className: string) {
  const base = variant === "icon" ? "dash-icon-button" : variant === "text" ? "dash-text-button" : `dash-button${variant === "primary" ? " dash-button-primary" : ""}`;
  return `${base} ${className}`.trim();
}
export function Button({ variant = "default", className = "", type = "button", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button {...props} type={type} className={buttonClass(variant, className)} />;
}
export function ButtonLink({ variant = "default", className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link {...props} className={buttonClass(variant, className)} />;
}
