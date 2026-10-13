import type { HTMLAttributes } from "react";
export function AppCard({ as: Tag = "section", tone = "default", className = "", ...props }: HTMLAttributes<HTMLElement> & { as?: "section" | "article" | "aside" | "div"; tone?: "default" | "violet" }) {
  return <Tag {...props} className={`app-card app-card-${tone} ${className}`.trim()} />;
}
