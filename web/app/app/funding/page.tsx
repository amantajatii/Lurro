import { Suspense } from "react";
import { FundingPage } from "../../../components/workflow/funding-page";
import { LogoLoader } from "../../../components/ui/logo-loader";
export const metadata = { title: "Funding — Lurro", robots: { index:false, follow:false } };
export default function Page() { return <Suspense fallback={<LogoLoader fullScreen />}><FundingPage /></Suspense>; }
