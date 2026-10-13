import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectOverview } from "../../../components/project/project-overview";
import "./overview.css";
export const metadata: Metadata = { title: "Project overview — Lurro", description: "Inspect a project's agreement, funding and milestone status on Arc Testnet.", robots: { index: false, follow: false } };
export default function ProjectPage() { return <Suspense fallback={<div className="overview-initial" role="status">Opening project workspace…</div>}><ProjectOverview /></Suspense>; }
