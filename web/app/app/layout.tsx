import { WalletProvider } from "../../components/dashboard/use-wallet";
import "./dashboard.css";
import "./components.css";
import "./workflow.css";
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) { return <WalletProvider>{children}</WalletProvider>; }
