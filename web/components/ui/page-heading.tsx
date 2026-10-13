import type { ReactNode } from "react";
export function AppPageHeading({ title, description, leading, actions }: { title: ReactNode; description: ReactNode; leading?: ReactNode; actions?: ReactNode }) {
  return <div className="dash-page-heading"><div>{leading}<h1>{title}</h1><p>{description}</p></div>{actions}</div>;
}
