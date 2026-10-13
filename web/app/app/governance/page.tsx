import { Suspense } from "react";
import { GovernancePage } from "../../../components/workflow/governance-page";
import { LogoLoader } from "../../../components/ui/logo-loader";
export const metadata = { title: "Governance — Lurro", robots: { index:false, follow:false } };
export default function Page() { return <Suspense fallback={<LogoLoader fullScreen />}><GovernancePage /></Suspense>; }
