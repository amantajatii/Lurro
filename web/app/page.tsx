import type { ReactNode } from "react";
import Image from "next/image";
import { Navigation } from "../components/navigation";
import { ProductPreview } from "../components/product-preview";
import { SpecularLink } from "../components/specular-link";

const explorer = "https://explorer.testnet.arc.io";
const vault = `${explorer}/address/0xa3b6db6a52ff3cf32438c0989af041d77d3dacae?tab=contract`;
const payout = `${explorer}/tx/0xc1b3b26acf41b2e347234f4c8115982e12d5d86edb27f6d7e9fde6731856a628`;
const github = "https://github.com/amantajatii/Lurro";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Mark() {
  return <Image src="/lurro-mark.webp" width={40} height={40} alt="" unoptimized />;
}

function Icon({ kind, size = 24 }: { kind: "agreement" | "fund" | "check" | "route" | "proof" | "people" | "code" | "grid"; size?: number }) {
  const shapes: Record<typeof kind, ReactNode> = {
    agreement: <><path d="M7 3h7l4 4v14H7zM14 3v5h4M10 12h5M10 16h5" /></>,
    fund: <><rect x="3" y="6" width="18" height="14" rx="3" /><path d="M3 10h18M7 6V4h10v2M15 15h3" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
    route: <><path d="M5 5v12a2 2 0 0 0 2 2h12M5 10h12a2 2 0 0 0 2-2V5" /><circle cx="5" cy="4" r="2" /><circle cx="19" cy="4" r="2" /><circle cx="19" cy="19" r="2" /></>,
    proof: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="m8 9 2 2 4-4M8 15h8M8 18h5" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1" /></>,
    code: <><path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 4l-4 16" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[kind]}</svg>;
}

const steps = [
  { kind: "agreement", title: "Agree on the rights", description: "Define the recipients, milestones, and payment rules. Every required party accepts the same agreement.", short: "Agreement", caption: "Rights defined" },
  { kind: "fund", title: "Secure the funds", description: "Deposit USDC into the project vault. Reserve a milestone only when its full allocation is available.", short: "Funding", caption: "Funds reserved" },
  { kind: "check", title: "Approve the work", description: "The assigned verifier reviews submitted evidence. Challenges follow the policy everyone accepted.", short: "Verification", caption: "Evidence reviewed" },
  { kind: "route", title: "Pay the right people", description: "Earned funds go to the agreed wallets. A successful transaction becomes an independently verifiable receipt.", short: "Settlement", caption: "Payout recorded" },
] as const;

const faqs = [
  ["What does Lurro actually protect?", "Lurro enforces agreed payout rules for USDC deposited into its vault. It binds recipients and allocations, prevents duplicate payout, and records settlement. It cannot protect money that was never deposited or control funds after recipients receive them."],
  ["Who verifies that the work is complete?", "The verifier named in the agreement reviews the evidence. Blockchain records that authorized decision; it does not independently judge work quality. Disputes follow the pre-agreed primary/backup arbiter and inactivity fallback rules."],
  ["Can someone change the recipient after funding?", "In P0, recipient wallets and allocations are fixed. There is no admin switch or withdrawal shortcut for earned payments. Changes require settling or closing the original agreement and creating a new vault."],
  ["What happens if a project is cancelled?", "A project-wide early cancellation requires the funder and all recipients to approve the current proposal. Unsubmitted scope can be cancelled; in-flight and earned rights stay protected. Authorized refunds go only to the original funder."],
  ["Is Lurro live on Mainnet?", "The current prototype has been deployed and source-verified on Arc Testnet. Its automated self-test completed funding, arbitration-authorized payout, and cancellation/refund. It is unaudited; Mainnet operation and independent human verification are not claimed."],
  ["Can I use it for domestic Rupiah payments?", "The P0 prototype only supports the Arc USDC interface. It has no Rupiah, bank, or identity-verification integration. Any real commercial pilot needs jurisdiction-specific legal review and consenting counterparties."],
];

export default function Home() {
  return <>
    <a href="#main" className="skip-link">Skip to content</a>
    <header className="site-header"><div className="header-inner">
      <a href="#" className="brand" aria-label="Lurro home"><Image src="/lurro-logo.webp" width={114} height={40} alt="" unoptimized loading="eager" /></a>
      <Navigation />
      <SpecularLink href="#proof" className="button-small header-cta">Explore the proof <Arrow diagonal /></SpecularLink>
    </div></header>

    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-copy">
          <a href="#proof" className="announcement"><span className="announcement-platform">Built on <Image src="/arc-logo.webp" width={47} height={16} alt="Arc" unoptimized /></span><span>· Proven on Testnet.</span><span className="announcement-more">Explore the proof <Arrow diagonal /></span></a>
          <h1 id="hero-title">Every fund, right where it belongs.</h1>
          <p className="hero-description">A clearer path from project agreement to payment.<br className="desktop-break" /> Secure the funds, protect the recipients, and prove the payout.</p>
          <div className="hero-actions"><SpecularLink href="/app/">Explore Lurro</SpecularLink><a className="button button-secondary" href="#how-it-works">See how it works</a></div>
          <p className="hero-note">Project funding infrastructure. Powered by USDC.</p>
        </div>

      </section>

      <ProductPreview />

      <section className="clarity-section content-width" id="product">
        <div className="section-heading"><span className="eyebrow">LESS GUESSWORK. MORE CLARITY.</span><h2>A promised budget<br />isn’t a paid invoice.</h2><p>See the difference between what’s agreed, what’s funded,<br className="desktop-break" /> and what actually reached the recipient.</p></div>
        <div className="money-states">
          {[{ name: "Committed", detail: "The agreed obligation", width: "100%" }, { name: "Deposited", detail: "Actual funds in the vault", width: "76%" }, { name: "Reserved", detail: "Set aside for recipients", width: "55%" }, { name: "Paid", detail: "Successful settlement", width: "32%" }].map((state, index) => <div className="money-state" key={state.name}><div className="money-label"><span>0{index + 1}</span><strong>{state.name}</strong><span>{state.detail}</span></div><div className="money-track"><div style={{ width: state.width }} /></div></div>)}
          <p className="diagram-caption">Conceptual comparison · bar lengths do not represent project balances.</p>
        </div>
      </section>

      <section className="how-section frame" id="how-it-works">
        <div className="section-heading"><span className="eyebrow">A SIMPLE FLOW. CLEAR RESPONSIBILITIES.</span><h2>Good agreements deserve<br />a better payment path.</h2><p>From the first acceptance to the final receipt,<br className="desktop-break" /> each step has a purpose and a source of proof.</p></div>
        <div className="steps-grid">{steps.map((step, index) => <article className="step" key={step.short}><span className="step-index">0{index + 1}</span><div className="step-icon"><Icon kind={step.kind} /></div><h3>{step.title}</h3><p>{step.description}</p></article>)}</div>
        <p className="section-footnote">Protection applies to deposited vault funds. Verification is performed by the assigned people.</p>
      </section>

      <section className="features-section content-width">
        <div className="section-heading"><span className="eyebrow">PAYMENT RIGHTS, BUILT IN.</span><h2>Keep everyone<br />on the same page.</h2><p>Less reliance on one person holding the money.<br className="desktop-break" /> More confidence in the rules everyone agreed to.</p></div>
        <div className="feature-grid">
          <article className="feature-card allocation-card"><div className="feature-visual allocation-visual" aria-hidden="true"><div className="mini-heading"><Icon kind="agreement" size={17} /> AGREEMENT RULES <span>Fixed after lock</span></div><div className="allocation-row"><span className="avatar-symbol">A</span><div><strong>Recipient A</strong><span>Bound to the agreement</span></div><Icon kind="check" size={19} /></div><div className="allocation-row"><span className="avatar-symbol avatar-alt">B</span><div><strong>Recipient B</strong><span>Bound to the agreement</span></div><Icon kind="check" size={19} /></div><div className="locked-note"><Icon kind="route" size={15} />No unilateral recipient changes.</div></div><div className="feature-copy"><span className="feature-kicker">01 / PROTECTED ALLOCATIONS</span><h3>The right funds.<br />The agreed recipients.</h3><p>Recipients and allocations are fixed in the vault. A coordinator can’t quietly send an earned payment somewhere else.</p></div></article>
          <article className="feature-card proof-card"><div className="feature-visual receipt-visual" aria-hidden="true"><div className="receipt-sheet"><span className="receipt-badge"><Icon kind="proof" size={18} /></span><span className="receipt-title">A receipt you can inspect.</span><span className="receipt-subtitle">Agreement → Approval → Transfer</span><div className="receipt-rule" /><div className="receipt-detail"><span>Recipient</span><span>Agreement-bound wallet</span></div><div className="receipt-detail"><span>Evidence</span><span>Referenced by hash</span></div><div className="receipt-detail"><span>Source</span><span>On-chain transaction</span></div><span className="receipt-link">Independently verifiable <Arrow diagonal /></span></div></div><div className="feature-copy"><span className="feature-kicker">02 / INDEPENDENT PROOF</span><h3>Don’t just hear “paid.”<br />Follow the proof.</h3><p>Trace an authorized payout back to its agreement and approval. Inspect the transaction without relying on an operator’s report.</p></div></article>
        </div>
        <p className="diagram-caption">Feature diagrams are illustrative. Explore the actual Testnet receipts below.</p>
      </section>

      <section className="proof-section frame" id="proof">
        <div className="proof-copy"><span className="eyebrow">REAL TRANSACTIONS. OPEN EVIDENCE.</span><h2>A promise is useful.<br /><span>Proof is better.</span></h2><p>Our Arc Testnet self-test completed agreement acceptance, funding, payout, and cancellation/refund. The receipts are yours to inspect.</p><SpecularLink href={vault} target="_blank" rel="noopener noreferrer">Inspect the Testnet vault <Arrow diagonal /></SpecularLink><span className="proof-disclosure">Automated test wallets · test USDC · unaudited prototype</span></div>
        <div className="proof-links"><span className="proof-links-label">THE TESTNET PAPER TRAIL</span>{[
          { title: "Verified contract", detail: "Inspect the source and agreed rules", href: vault, kind: "code" },
          { title: "Successful payout", detail: "Follow the transfer to its recipients", href: payout, kind: "route" },
          { title: "Cancellation & refund", detail: "See funds return to the original funder", href: `${explorer}/tx/0x74ae5db2eec9b7c0ebe2e1cd6d4ea40c6fc2a9a6e574617d63d203f87f52e585`, kind: "fund" },
        ].map(item => <a href={item.href} key={item.title} target="_blank" rel="noopener noreferrer" className="proof-link"><span className="proof-link-icon"><Icon kind={item.kind as "code" | "route" | "fund"} /></span><div><strong>{item.title}</strong><span>{item.detail}</span></div><Arrow diagonal /></a>)}<a className="text-link" href={`${github}/blob/main/contracts/TESTNET-PROOF.md`} target="_blank" rel="noopener noreferrer">Read the self-test report <Arrow /></a></div>
      </section>

      <section className="use-cases content-width" id="use-cases"><div className="use-cases-intro"><span className="eyebrow">BUILT FOR WORK THAT CONNECTS PEOPLE.</span><h2>One project.<br />More than one pair of hands.</h2><p>For international digital teams that can legally use USDC and need a shared, verifiable payment agreement.</p></div><div className="use-case-list">{[
        { icon: "code", title: "Sponsored digital projects", detail: "Tie funding to agreed milestones and genuine deliverables." },
        { icon: "people", title: "Cross-organization teams", detail: "Align funders, contractors, and reviewers around one agreement." },
        { icon: "grid", title: "Multi-recipient grants", detail: "Protect each recipient’s allocation and keep the payout trail accessible." },
      ].map(item => <article className="use-case" key={item.title}><span><Icon kind={item.icon as "code" | "people" | "grid"} /></span><div><h3>{item.title}</h3><p>{item.detail}</p></div></article>)}</div></section>

      <section className="faq-section content-width" id="faq"><div className="faq-intro"><span className="eyebrow">LET’S MAKE IT CLEAR.</span><h2>Good questions.<br />Straight answers.</h2><p>Understand the rules—and their limits—<br className="desktop-break" /> before putting funds into a vault.</p><a className="text-link" href={`${github}/blob/main/contracts/README.md`} target="_blank" rel="noopener noreferrer">Explore the protocol docs <Arrow diagonal /></a></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span className="faq-plus" aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="closing-section frame"><div className="closing-path" aria-hidden="true"><Mark /></div><div className="closing-path closing-path-secondary" aria-hidden="true"><Mark /></div><div className="closing-path closing-path-tertiary" aria-hidden="true"><Mark /></div><span className="eyebrow">EVERY AGREEMENT DESERVES A CLEAR ENDPOINT.</span><h2>Make every authorized<br />payout accountable.</h2><SpecularLink className="specular-glass" href={vault} target="_blank" rel="noopener noreferrer">Explore the Testnet proof <Arrow diagonal /></SpecularLink><p>Only deposited funds are protected by the vault’s payout rules.</p></section>
    </main>

    <footer className="site-footer content-width"><div className="footer-top"><a href="#" className="brand" aria-label="Lurro home"><Image src="/lurro-logo.webp" width={114} height={40} alt="" unoptimized loading="eager" /></a><p>Every fund, right where it belongs.</p><div><a href={github} target="_blank" rel="noopener noreferrer">GitHub <Arrow diagonal /></a><a href={`${github}/blob/main/contracts/SECURITY-REVIEW.md`} target="_blank" rel="noopener noreferrer">Review & limitations <Arrow diagonal /></a></div></div><div className="footer-bottom"><span>© 2026 Lurro</span><span>Arc Testnet prototype. Not independently audited.</span><a href="#main">Back to top ↑</a></div></footer>
  </>;
}
