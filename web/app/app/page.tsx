import { network } from "../../lib/network";
import type { Metadata } from "next";
import { Dashboard } from "../../components/dashboard/dashboard";
export const metadata: Metadata = { title: "Dashboard — Lurro", description: `Inspect Lurro project vaults and payment rights on ${network.label}.`, robots: { index: false, follow: false } };
export default function AppPage() { return <Dashboard />; }
