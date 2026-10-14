import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/inter";
import "./globals.css";
import { network } from "../lib/network";

export const metadata: Metadata = {
  icons: { icon: [{ url: "/favicon.webp", type: "image/webp" }] },
  title: "Lurro — Every fund, right where it belongs.",
  description: `Protect project payment rights, fund milestones with USDC, and independently verify authorized payouts on ${network.label}.`,
  openGraph: {
    title: "Lurro — Project funding, with proof.",
    description: "Secure the funds. Respect the agreement. Prove the payout.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
