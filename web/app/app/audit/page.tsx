import { Suspense } from "react";
import { AuditPage } from "../../../components/workflow/audit-page";
import { LogoLoader } from "../../../components/ui/logo-loader";
export const metadata = { title:"Audit Explorer — Lurro", robots:{ index:false,follow:false } };
export default function Page() { return <Suspense fallback={<LogoLoader fullScreen />}><AuditPage /></Suspense>; }
