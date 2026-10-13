import Image from "next/image";
export function LogoLoader({ label = "Opening your workspace…", fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return <div className={`logo-loader ${fullScreen ? "logo-loader-screen" : ""}`} role="status" aria-live="polite" aria-busy="true"><div className="logo-loader-orbit" aria-hidden="true"><Image src="/lurro-mark.webp" width={42} height={42} alt="" unoptimized /><span /></div><p>{label}</p></div>;
}
