"use client";

import { useState } from "react";
import { HiOutlineUserGroup, HiOutlineWallet, HiOutlineDocumentCheck, HiOutlineArrowRight } from "react-icons/hi2";
import { AppCard } from "./ui/card";
import { ButtonLink } from "./ui/button";
import "../app/app/components.css";
import "./product-preview.css";

const views = [
  { title: "Payment rights", page: "Agreement", route: "/app/agreement/", icon: HiOutlineUserGroup, description: "One shared agreement. Clear rights for everyone.", columns: ["Recipient", "Payment rights", "Destination"], rows: [["Recipient A", "Fixed in agreement", "Agreed wallet"], ["Recipient B", "Fixed in agreement", "Agreed wallet"]], metrics: [["Recipients", "Named wallets"], ["Allocations", "Fixed at creation"], ["Acceptance", "All required parties"]], cardTitle: "Recipients & allocations" },
  { title: "Milestone funding", page: "Funding", route: "/app/funding/", icon: HiOutlineWallet, description: "Deposit USDC, reserve milestones, and track the funds held in your vault.", columns: ["Stage", "What it means", "Source"], rows: [["Committed", "Agreed obligation", "Agreement"], ["Reserved", "Full milestone allocation", "Vault accounting"], ["Paid", "Successful settlement", "Transaction receipt"]], metrics: [["Available", "— USDC"], ["Reserved", "— USDC"], ["Funding capacity", "— USDC"]], cardTitle: "Funding lifecycle" },
  { title: "Verifiable receipts", page: "Audit Explorer", route: "/app/audit/", icon: HiOutlineDocumentCheck, description: "Trace the agreement, evidence, and settlement through original vault events.", columns: ["Reference", "Purpose", "Proof"], rows: [["Agreement", "Recipients & rules", "Vault contract"], ["Evidence", "Submitted deliverable", "Referenced hash"], ["Settlement", "Authorized transfer", "On-chain receipt"]], metrics: [["Data source", "Vault events"], ["Coverage", "Selected range"], ["Receipts", "Explorer links"]], cardTitle: "Project paper trail" },
];
export function ProductPreview() {
  const [active, setActive] = useState(0);
  const view = views[active];
  return <div className="product-showcase">
    <svg className="section-curve" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H1440V2H1054C1010 2 1018 82 970 82H470C422 82 430 2 386 2H0Z" fill="white" /></svg>
    <div className="preview-switcher" aria-label="Product preview">
      {views.map((item, index) => <button key={item.title} type="button" aria-pressed={active === index} onClick={() => setActive(index)}><span className={`preview-tab-icon preview-tab-icon-${index}`} aria-hidden="true"><item.icon /></span>{item.title}</button>)}
    </div>
    <div className="preview-shell workspace-preview">
      <div className="product-preview-panel" aria-live="polite">
        <div className="product-preview-heading"><div><span className={`preview-tab-icon preview-tab-icon-${active}`} aria-hidden="true"><view.icon /></span><h2>{view.page}</h2></div><p>{view.description}</p></div>
        <div className="product-preview-metrics">{view.metrics.map(([label, value]) => <AppCard key={label} as="div"><span>{label}</span><strong>{value}</strong></AppCard>)}</div>
        <AppCard className="product-preview-table-card"><h3>{view.cardTitle}</h3><div className="product-preview-table-wrap"><table><thead><tr>{view.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{view.rows.map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={`${index}:${cell}`}>{index === 0 && <span className="product-preview-dot" aria-hidden="true" />}{cell}</td>)}</tr>)}</tbody></table></div></AppCard>
        <div className="product-preview-footer"><span>Illustrative preview · USDC on Arc</span><ButtonLink href={view.route} variant="text">Open {view.page}<HiOutlineArrowRight aria-hidden="true" /></ButtonLink></div>
      </div>
    </div>
    <p className="preview-disclaimer">Illustrative interface · no live project balances or transactions</p>
    <svg className="showcase-bottom-curve" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 70H1440V0H1080C1030 0 1040 60 990 60H450C400 60 410 0 360 0H0Z" fill="white" /></svg>
  </div>;
}
