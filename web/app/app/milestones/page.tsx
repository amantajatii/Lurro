import { Suspense } from "react";
import { MilestonesPage } from "../../../components/workflow/milestones-page";
import { LogoLoader } from "../../../components/ui/logo-loader";
export const metadata = { title: "Milestones — Lurro", robots: { index:false, follow:false } };
export default function Page() { return <Suspense fallback={<LogoLoader fullScreen />}><MilestonesPage /></Suspense>; }
