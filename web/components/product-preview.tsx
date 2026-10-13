"use client";

import { useState } from "react";
import Image from "next/image";
import { HiOutlineUserGroup, HiOutlineWallet, HiOutlineDocumentCheck, HiOutlineDocumentText, HiOutlineChartBar, HiOutlineFolder, HiOutlineSquares2X2, HiOutlineShieldCheck } from "react-icons/hi2";

const views = [
  { title: "Payment rights", icon: HiOutlineUserGroup, heading: "Agreement overview", description: "One shared agreement. Clear rights for everyone.", columns: ["Recipient", "Allocation", "Destination"], rows: [["Recipient A", "Fixed in agreement", "Agreed wallet"], ["Recipient B", "Fixed in agreement", "Agreed wallet"]] },
  { title: "Milestone funding", icon: HiOutlineWallet, heading: "Funding lifecycle", description: "Keep obligations, deposits, and earned payments distinct.", columns: ["Stage", "What it means", "Source"], rows: [["Committed", "Agreed obligation", "Agreement"], ["Reserved", "Full milestone allocation", "Vault accounting"], ["Paid", "Successful settlement", "Transaction receipt"]] },
  { title: "Verifiable receipts", icon: HiOutlineDocumentCheck, heading: "Payment paper trail", description: "Follow the agreement all the way to its receipt.", columns: ["Reference", "Purpose", "Proof"], rows: [["Agreement", "Recipients & rules", "Vault contract"], ["Evidence", "Submitted deliverable", "Referenced hash"], ["Settlement", "Authorized transfer", "On-chain receipt"]] },
];

export function ProductPreview() {
  const [active, setActive] = useState(0);
  const view = views[active];
  return <div className="product-showcase">
    <svg className="section-curve" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H1440V2H1054C1010 2 1018 82 970 82H470C422 82 430 2 386 2H0Z" fill="white" /></svg>
    <div className="preview-switcher" aria-label="Product preview">
      {views.map((item, index) => <button key={item.title} type="button" aria-pressed={active === index} onClick={() => setActive(index)}><span className={`preview-tab-icon preview-tab-icon-${index}`} aria-hidden="true"><item.icon /></span>{item.title}</button>)}
    </div>
    <div className="preview-shell">
      <div className="preview-app">
        <aside className="preview-rail" aria-hidden="true"><Image src="/lurro-mark.webp" width={24} height={24} alt="" unoptimized /><span><HiOutlineChartBar /></span><span><HiOutlineFolder /></span><span className="rail-active"><HiOutlineSquares2X2 /></span></aside>
        <div className="preview-sidebar"><strong>Project workspace</strong><span className="preview-sidebar-label">AGREEMENT</span>{views.map((item, index) => <button key={item.title} type="button" aria-pressed={active === index} onClick={() => setActive(index)} className={active === index ? "preview-nav-active" : ""}><span aria-hidden="true"><item.icon /></span>{item.title}</button>)}<div className="preview-sidebar-note">Rules stay with<br />the funds.</div></div>
        <div className="preview-main" aria-live="polite"><div className="preview-title"><h2>{view.heading}</h2><span>Illustrative preview</span></div><p>{view.description}</p><div className="preview-context"><span aria-hidden="true"><HiOutlineDocumentText /></span> Project agreement <span>USDC · Arc</span></div><div className="preview-table-wrap"><table><thead><tr>{view.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{view.rows.map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={cell}>{index === 0 && <span className="preview-row-dot" aria-hidden="true" />}{cell}</td>)}</tr>)}</tbody></table></div><div className="preview-summary"><span aria-hidden="true"><HiOutlineShieldCheck /></span><div><strong>Built around the agreement.</strong><p>Named recipients. Defined milestones. Traceable settlement.</p></div></div></div>
      </div>
    </div>
    <p className="preview-disclaimer">Illustrative interface · no live project balances or transactions</p>
    <svg className="showcase-bottom-curve" viewBox="0 0 1440 70" preserveAspectRatio="none" aria-hidden="true"><path d="M0 70H1440V0H1080C1030 0 1040 60 990 60H450C400 60 410 0 360 0H0Z" fill="white" /></svg>
  </div>;
}
