import { LogoLoader } from "../../../components/ui/logo-loader";
import { Suspense } from "react";
import type { Metadata } from "next";
import { AgreementPage } from "../../../components/project/agreement-page";
import "./agreement.css";
export const metadata: Metadata = { title: "Agreement — Lurro", robots: { index: false, follow: false } };
export default function Page() { return <Suspense fallback={<LogoLoader fullScreen />}><AgreementPage /></Suspense>; }
