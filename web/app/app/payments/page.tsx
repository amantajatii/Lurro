import { Suspense } from "react";
import { PaymentsPage } from "../../../components/workflow/payments-page";
import { LogoLoader } from "../../../components/ui/logo-loader";
export const metadata = { title: "Payments — Lurro", robots: { index:false, follow:false } };
export default function Page() { return <Suspense fallback={<LogoLoader fullScreen />}><PaymentsPage /></Suspense>; }
