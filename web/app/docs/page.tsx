import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navigation } from "../../components/navigation";
import { network, writesEnabled } from "../../lib/network";
import styles from "./docs.module.css";

export const metadata: Metadata = {
  title: "Documentation — Lurro",
  description: "Learn how to create a Lurro project, agree on payment rights, fund milestones, verify work, and inspect settlement receipts.",
  openGraph: { title: "Documentation — Lurro", description: "A practical guide from project agreement to payment.", type: "website" },
};

const sections = [
  ["overview", "Overview"], ["quick-start", "Quick start"], ["roles", "People & roles"],
  ["agreement", "Agreement"], ["funding", "Funding"], ["milestones", "Milestones & evidence"],
  ["payments", "Payments & refunds"], ["governance", "Challenges & cancellation"],
  ["audit", "Audit & receipts"], ["limits", "Limits & reference"],
] as const;
const github = "https://github.com/amantajatii/Lurro/blob/main";

export default function DocsPage() {
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header"><div className="header-inner">
      <Link href="/" className="brand" aria-label="Lurro home"><Image src="/lurro-logo.webp" width={114} height={40} alt="" unoptimized /></Link>
      <Navigation />
    </div></header>
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link href="/docs/" className={styles.label}>DOCUMENTATION</Link>
        <nav aria-label="Documentation sections">{sections.map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}</nav>
        <div className={styles.sidebarNote}><span className={styles.network}>{network.label}</span><p>Project funding.<br />With a source of proof.</p></div>
      </aside>
      <main id="main" className={styles.content}>
        <section id="overview" className={styles.intro}>
          <span className="eyebrow">THE LURRO GUIDE</span>
          <h1>From agreement<br />to accountable payment.</h1>
          <p className={styles.lead}>Define who gets paid, secure the funds, and follow every milestone to its receipt. Here’s how to use the Lurro workspace.</p>
          <div className={styles.actions}><Link href="/app/new/" className="button">Create a project <span aria-hidden="true">→</span></Link><a href="#quick-start" className="button button-secondary">Read the quick start</a></div>
          <div className={styles.notice}><strong>{network.label} · {network.unit}</strong><p>Lurro is an unaudited prototype. {writesEnabled ? "Transactions require your explicit wallet confirmation." : "Mainnet transactions are disabled in this build."} Testnet receipts demonstrate test flows; they do not establish Mainnet readiness.</p></div>
        </section>

        <section id="quick-start" className={styles.section}>
          <span className={styles.label}>01 / GET STARTED</span><h2>Your first project</h2>
          <ol className={styles.steps}>
            <li><strong>Create the agreement.</strong> Open <Link href="/app/new/">Create project</Link> as the funder. Define the role wallets, 1–5 recipients, and 1–3 milestones with allocations and deadlines. Review everything before deploying the vault.</li>
            <li><strong>Keep the agreement document.</strong> Download the generated document and share the exact file and vault address with the named parties. Save the project in your dashboard for easy access.</li>
            <li><strong>Accept and lock.</strong> Each required party opens <Link href="/app/agreement/">Agreement</Link> for that vault, checks the document, and accepts with their wallet. Lock after everyone has accepted.</li>
            <li><strong>Fund and reserve.</strong> The funder approves and deposits USDC in <Link href="/app/funding/">Funding</Link>. Reserve a milestone once its full allocation is available.</li>
            <li><strong>Submit, review, and settle.</strong> Use <Link href="/app/milestones/">Milestones</Link> to commit evidence and review it. Once payment is claimable, execute it in <Link href="/app/payments/">Payments</Link> and inspect the receipt in <Link href="/app/audit/">Audit Explorer</Link>.</li>
          </ol>
          <p>Select your vault in the workspace before opening a workflow page. You can inspect public project data without connecting a wallet; a wallet is required to send transactions.</p>
        </section>

        <section id="roles" className={styles.section}>
          <h2>People & roles</h2><p>The agreement assigns authority to specific wallets. Check each address with its owner before creating the project.</p>
          <dl className={styles.roles}>
            <div><dt>Funder</dt><dd>Creates the vault, deposits USDC, and proposes project cancellation. Refunds always return to this wallet.</dd></div>
            <div><dt>Recipients</dt><dd>Accept the agreement and receive their fixed milestone allocations. All recipients must approve project cancellation.</dd></div>
            <div><dt>Submitter</dt><dd>Commits the milestone’s evidence and may challenge a rejection.</dd></div>
            <div><dt>Verifier</dt><dd>Reviews the submitted evidence and approves or rejects its exact revision and hash.</dd></div>
            <div><dt>Primary & backup arbiters</dt><dd>Resolve escalated disputes under the agreed policy and time limits.</dd></div>
          </dl>
        </section>

        <section id="agreement" className={styles.section}>
          <h2>Agree on the same terms</h2><p>Recipient wallets and allocations are fixed when the vault is deployed. Every required party explicitly accepts the same terms hash before the agreement can be locked. Once all acceptances are present, anyone can lock it.</p>
          <p>Open the agreement document in the workspace. Lurro hashes its exact bytes locally and compares them with the vault’s document commitment. Generated Lurro documents also bind the displayed names and scope to the on-chain terms.</p>
          <div className={styles.note}><strong>Keep the original file.</strong> Editing or re-exporting a document changes its bytes and can change its hash. Share and retain the exact agreed file; Lurro does not store it for you.</div>
        </section>

        <section id="funding" className={styles.section}>
          <h2>Know where the money stands</h2><p>After lock, the funder approves the selected USDC amount and deposits it in a separate transaction. A milestone needs its full allocation reserved before work can be submitted. Earlier planned milestones must be reserved or validly cancelled first.</p>
          <dl className={styles.roles}>
            <div><dt>Committed</dt><dd>The payment obligation written into the agreement.</dd></div>
            <div><dt>Deposited</dt><dd>Funds actually received by the vault, including amounts later paid or refunded.</dd></div>
            <div><dt>Reserved</dt><dd>Deposited funds set aside for a particular milestone.</dd></div>
            <div><dt>Paid</dt><dd>Funds successfully transferred to the agreed recipients.</dd></div>
          </dl><p>Only deposited vault funds are protected by its payout rules. Leave enough USDC in your wallet for network fees; Arc gas uses the same underlying USDC balance.</p>
        </section>

        <section id="milestones" className={styles.section}>
          <h2>Submit evidence. Review the work.</h2><p>The named submitter selects an evidence file. Its exact bytes are hashed locally; the transaction records the hash, not the file. Share the actual evidence separately with the verifier and retain it for any dispute.</p>
          <p>The verifier checks the matching file and approves or rejects the current revision. Review lasts 72 hours. Approval opens a 48-hour challenge window; an unchallenged approval then becomes claimable.</p>
          <p>Rejected evidence may be resubmitted within the contracted deadlines, up to three total revisions. The same evidence hash cannot be reused. The workspace shows the applicable deadlines and available actions.</p>
        </section>

        <section id="payments" className={styles.section}>
          <h2>Settle earned rights</h2><p>Once a milestone is claimable, anyone can execute its payout. All positive allocations are sent to their original recipient wallets in one transaction. If a transfer fails, the entire payout reverts.</p>
          <p>Refunds are separate from reusable funding. Anyone can trigger an owed refund, but it always goes to the original funder. A transaction hash alone is not proof of payment: wait for a successful receipt and check the resulting project state.</p>
        </section>

        <section id="governance" className={styles.section}>
          <h2>Handle challenges & cancellation</h2><p>The funder or a recipient with a positive allocation can challenge an approval during its 48-hour window. The submitter can challenge a rejection before its close. If review times out, a fixed agreement participant can escalate it.</p>
          <p>Disputes follow the primary arbiter, backup activation after 72 hours, and the seven-day arbitration deadline. After that deadline, anyone can apply the agreed default: an approved dispute snapshot becomes claimable; an unapproved snapshot refunds.</p>
          <p>Project cancellation requires the funder and all recipients to approve the same current proposal. Proposals expire after seven days and can become stale when the economic state changes. Cancellation stops future scope while submitted and earned rights continue under their existing rules.</p>
        </section>

        <section id="audit" className={styles.section}>
          <h2>Follow the proof</h2><p><Link href="/app/audit/">Audit Explorer</Link> reads the selected vault’s contract events. Trace agreement acceptance, funding, evidence decisions, payouts, and refunds back to their transactions.</p>
          <p>Check the chain, vault address, recipient, amount, and successful receipt. A recorded approval proves that the authorized verifier made that decision; the blockchain does not independently assess work quality.</p>
          <a href={`${github}/contracts/TESTNET-PROOF.md`} target="_blank" rel="noopener noreferrer">Inspect the documented Testnet self-test ↗</a>
        </section>

        <section id="limits" className={styles.section}>
          <h2>Limits & technical reference</h2><p>The vault has immutable addresses, no upgrade or admin sweep, and no vault-managed key recovery. A blocked recipient can prevent the whole milestone payout. Public wallet addresses and amounts reveal relationships; private files must be retained and shared separately.</p>
          <p>The prototype has no fiat payment or identity-verification integration. Source verification and local tests do not constitute an independent security audit.</p>
          <div className={styles.references}>
            <a href={`${github}/contracts/README.md`} target="_blank" rel="noopener noreferrer">Contract specification <span aria-hidden="true">↗</span></a>
            <a href={`${github}/contracts/SECURITY-REVIEW.md`} target="_blank" rel="noopener noreferrer">Internal security review <span aria-hidden="true">↗</span></a>
            <a href={`${github}/web/README.md`} target="_blank" rel="noopener noreferrer">Frontend setup & implementation <span aria-hidden="true">↗</span></a>
          </div>
        </section>
        <footer className={styles.footer}><span>© 2026 Lurro · Documentation</span><a href="#main">Back to top ↑</a></footer>
      </main>
    </div>
  </>;
}
