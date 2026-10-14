# Lurro — Landing Page Copy Revision v1.1

**Document type:** Copywriting & implementation brief  
**Product:** Lurro — Project Funding Infrastructure  
**Language of website:** English  
**Language of implementation notes:** Bahasa Indonesia  
**Brand direction:** Soft Violet · Calm · Precise · Trustworthy  
**Product status represented:** Arc Testnet prototype (bukan Arc Mainnet production)  
**Basis:** Landing page copy yang diberikan pemilik produk, serta Lurro P0 Contract Policy v1.2  
**Status:** Draft siap implementasi; seluruh klaim transaksi perlu dicek terhadap explorer/repository sebelum rilis.

---

## 0. Executive direction

### Tujuan revisi

Pertahankan identitas copy yang sekarang, tetapi buat tiga pesan lebih jelas:

1. **The problem:** Dana yang sudah dialokasikan belum tentu menjadi pembayaran yang diterima pihak yang berhak.
2. **The mechanism:** Agreement menentukan recipient dan nominal; vault menegakkan tujuan pembayaran tersebut melalui approval/dispute policy yang telah disetujui.
3. **The proof:** Bukti harus merujuk pada aksi kontrak dan transaksi Testnet yang benar-benar terjadi, dengan batasan pengujian yang transparan.

**Central positioning:**

> Lurro turns agreed payment rights into enforceable, verifiable payouts.

**Primary tagline (tetap):**

> Every fund, right where it belongs.

**Prinsip editorial:** Tidak menjanjikan pencegahan seluruh penyelewengan dana, tidak menyamakan budget dengan deposited USDC, tidak mengatakan smart contract mengetahui kualitas pekerjaan, dan tidak menyatakan Mainnet live atau independent audit sebelum ada bukti.

### Perubahan prioritas

| Prioritas | Lokasi | Aksi |
|---|---|---|
| P0 | Hero | Jelaskan agreement-bound recipients dan payout secara eksplisit |
| P0 | Status/banner/CTA | Sebut **Testnet**, bukan Mainnet atau production |
| P0 | Proof | Jelaskan automated self-test, jalur arbitration yang benar, dan unaudited status |
| P0 | Terms/status | Bedakan committed, deposited, reserved, **earned/claimable**, paid |
| P1 | Problem | Tambahkan konflik nyata pembayaran multi-party, bukan sekadar keterbacaan angka |
| P1 | Diferensiasi | Jelaskan kelebihan spesifik daripada *generic escrow* tanpa merendahkan kompetitor |
| P1 | FAQ | Jawab partial funding, recipient immutability, wallet loss, dispute timeout, dan public visibility |
| P2 | Keseluruhan | Kurangi headline yang saling mengulang |

---

# PART A — FINAL LANDING PAGE COPY (ENGLISH)

> **Implementation note:** Bagian ini adalah copy yang direkomendasikan untuk website. Teks dalam `[square brackets]` adalah label/placeholder implementasi, bukan copy yang harus ditampilkan. Tidak ada angka ilustratif yang boleh tampil seperti data transaksi live.

## 1. Header & navigation

**Wordmark:** `lurro.`

**Navigation**

- Product
- How it works
- Use cases
- Resources
- Open app

**Primary header CTA:** `Open Testnet App`  
**Secondary header CTA (optional):** `Create Testnet Project`

> Header cukup punya satu primary CTA yang menonjol. `Create Testnet Project` dapat berada pada halaman app atau sebagai item sekunder, agar navbar tidak terasa terlalu ramai.

### Network status banner

**Kicker:** `BUILT ON ARC · TESTED ON TESTNET`  
**Link:** `Inspect the proof ↗`

Jangan pakai `Proven on Testnet` apabila dapat ditafsirkan telah diuji menyeluruh atau diaudit. Yang telah diuji adalah skenario spesifik pada sebuah prototipe.

---

## 2. Hero

**Eyebrow (optional):** `PROJECT FUNDING INFRASTRUCTURE · POWERED BY USDC`

# Every fund, right where it belongs.

**Supporting headline:**

> The agreement defines who gets paid. Lurro makes sure the funds follow it.

**Description:**

> Secure project funds in a shared USDC vault, protect agreed allocations, and release payments only under authorized rules. Every successful payout can be verified onchain.

**Primary CTA:** `Open Testnet App`  
**Secondary CTA:** `Inspect Testnet Proof`

**Trust microcopy:**

> Arc Testnet prototype · Test USDC · Not independently audited

**Capability labels:**

- Protected payment rights
- Milestone-based funding
- Verifiable settlement

**Kenapa mengganti hero lama:** “A clearer path from project agreement to payment” terdengar menarik tetapi mudah dipakai produk escrow apa pun. Copy baru menjelaskan hubungan langsung antara agreement dan enforcement.

---

## 3. Hero product preview: Agreement overview

**Product-preview label:** `PROJECT WORKSPACE / AGREEMENT`  
**Heading:** `Rules stay with the funds.`  
**Subheading:** `One shared agreement. Clear payment rights for every recipient.`

**Preview heading:** `Agreement overview`  
**Preview supporting line:** `USDC · Arc Testnet`

| Recipient | Allocation | Destination |
|---|---|---|
| Recipient A | Fixed by agreement | Bound wallet |
| Recipient B | Fixed by agreement | Bound wallet |

**Footer label:**

> Named recipients. Defined milestones. Payments routed by the agreement.

**Preview disclosure (wajib terlihat):**

> Illustrative interface. No live balances or transactions shown in this preview.

**Catatan:** Jangan memakai simbol centang atau “Verified” di atas contoh jika record yang ditampilkan adalah ilustrasi, bukan state on-chain.

---

## 4. Problem: promise vs payment

**Eyebrow:** `LESS GUESSWORK. MORE ACCOUNTABILITY.`

## The money was approved. But did it reach the right people?

**Description:**

> In multi-party projects, funding can pass through several hands before reaching the people doing the work. An approved budget doesn't prove that money was deposited, reserved, or actually paid. Lurro makes those states distinct—and protects payout destinations agreed upfront.

**Small secondary line:**

> A promised budget isn't a paid invoice. A funded milestone isn't a settled payment.

**Four-stage concepts:**

| Stage | Label | Description |
|---|---|---|
| 01 | Committed | The amount agreed in the project terms |
| 02 | Deposited | USDC actually received by the vault |
| 03 | Reserved | Funds locked for a fully funded milestone |
| 04 | Paid | A successful transfer to the agreed recipients |

**Earned/Claimable note:**

> Between reservation and payment, a milestone must become earned under the agreed verification or dispute process. The product workspace shows that state explicitly.

**Chart disclaimer:**

> Conceptual comparison. Illustration bars are not live project balances.

**Kenapa tidak harus jadi diagram lima tahap:** Four-stage diagram boleh tetap dipakai untuk marketing, selama keterangan `earned/claimable` tidak disembunyikan dan dashboard memodelkan status tersebut sebagai state tersendiri.

---

## 5. How it works

**Eyebrow:** `ONE AGREEMENT. CLEAR RESPONSIBILITIES.`

## From signed terms to verified payouts.

**Description:**

> Each step has a defined actor, a clear rule, and a record that can be inspected.

### 01 — Agree on payment rights

> Define the recipients, milestone allocations, submission deadlines, and dispute rules. Every required party accepts the same agreement before funding begins.

### 02 — Secure the milestone

> Deposit USDC into the vault. A milestone can be reserved only when its full allocation is available. Partial funding is shown as partial funding—not as a payment guarantee.

### 03 — Verify or resolve

> The assigned verifier reviews specific submitted evidence. An approval can be challenged within the agreed window; unanswered reviews and disputes follow the predefined escalation process.

### 04 — Pay the agreed recipients

> Once payment rights are earned, anyone can trigger settlement. The vault sends funds only to the agreed recipient wallets, creating an independently inspectable transaction receipt.

**Disclosure:**

> Lurro enforces rules for deposited vault funds. Human reviewers assess real-world work; the blockchain does not verify work quality on its own.

---

## 6. Differentiator: more than a transfer record

**Eyebrow:** `PAYMENT RIGHTS, BUILT IN.`

## The middleman shouldn't be able to rewrite the payout.

**Description:**

> A coordinator may manage the project, but shouldn't be able to quietly replace the people entitled to payment. Lurro binds recipients and allocations to the locked agreement, then enforces those destinations when milestones are settled.

**Three supporting labels:**

- `Recipients fixed by agreement`
- `Milestones funded in full before reservation`
- `Payouts enforced by the vault`

**Footnote:**

> Lurro is not the first product to support escrow, multiple recipients, or disputes. Its focus is combining immutable payment rights, explicit funding states, and inspectable settlement in one project workflow.

### Feature 01 — Protected allocations

**Kicker:** `01 / PROTECTED ALLOCATIONS`

### Recipients locked. Allocations protected.

> After the agreement is locked, recipient addresses and per-milestone allocations cannot be changed through the vault. An administrator cannot redirect an earned payout to another wallet.

**Illustrative card labels:**

- `AGREEMENT RULES`
- `Fixed after lock`
- `Recipient A · Bound wallet`
- `Recipient B · Bound wallet`
- `No unilateral recipient changes`

### Feature 02 — Independent proof

**Kicker:** `02 / INDEPENDENT PROOF`

### Don't just hear “paid.” Follow the proof.

> Trace a settled payment from its agreement and authorized decision to the onchain transaction. Inspect the transfer without relying solely on a project administrator's report.

**Illustrative card labels:**

- `Agreement → Decision → Transfer`
- `Recipient · Agreement-bound wallet`
- `Evidence · Referenced by hash`
- `Settlement · Onchain transaction`
- `Receipt · Independently inspectable`

**Disclosure:**

> Feature diagrams are illustrative. Live transaction evidence appears in the Testnet proof section.

---

## 7. Testnet proof

**Eyebrow:** `REAL TESTNET TRANSACTIONS. INSPECTABLE EVIDENCE.`

## A promise is useful. Proof is better.

**Description:**

> Our automated Arc Testnet self-test exercised agreement acceptance, vault funding, an arbitration-authorized payout, and project cancellation with a refund. The source and transaction records are available to inspect.

**Proof summary tiles (no unsupported numerical claims):**

| Tile | Label | Supporting copy |
|---|---|---|
| 01 | Agreement accepted | Required test wallets accepted the project terms |
| 02 | Payout settled | An arbitration-authorized payment was executed onchain |
| 03 | Funds refunded | Cancellation and refund were exercised in the test flow |

**Primary CTA:** `Inspect the Testnet Vault`  
**Secondary CTA:** `Read the Self-Test Report`

**Disclosure:**

> Automated test wallets · Test USDC · No independent commercial participants or real-world work verification · Not independently audited

### The Testnet paper trail

**Source-verified contract**  
`Inspect the published contract source and rules →`

**Successful payout**  
`Follow the Testnet transfer to the agreed recipients →`

**Cancellation & refund**  
`Inspect the refund to the original funder →`

**Self-test report**  
`Read the test steps, transaction references, and limitations →`

**Editorial guardrails:**

- Jangan mengganti `arbitration-authorized payout` menjadi `verifier-approved payout` kecuali ada transaction proof untuk jalur verifier.
- Jangan menggunakan `Audited`, `Secure by design`, `Battle-tested`, atau `Fully verified` untuk self-test internal.
- `Source-verified` hanya dipakai jika source benar-benar terverifikasi di explorer. Source verification bukan security audit.
- Jika kemudian ada Mainnet deployment, buat proof panel **terpisah**, bukan mengganti tautan Testnet dengan Mainnet tanpa penjelasan.
- Untuk metrik USDC, tampilkan hanya angka yang dibaca dari explorer atau laporan yang sudah direkonsiliasi.

---

## 8. Use cases

**Eyebrow:** `BUILT FOR PROJECTS WITH MORE THAN ONE RECIPIENT.`

## One project. More than one pair of hands.

**Description:**

> Built for international digital projects where funders, contractors, and reviewers need shared payment rules—and can legally use USDC.

### Sponsored digital projects

> Protect milestone allocations for independent teams delivering real digital work.

### Cross-organization teams

> Give funders, contractors, and reviewers a shared view of commitments, funding, decisions, and settlement.

### Multi-recipient grants

> Define each recipient's entitlement in advance and preserve a verifiable record of authorized payouts.

**Scope note:**

> Current workflows are designed for one funder, two to five recipients, and one to three milestones per vault.

---

## 9. FAQ

**Eyebrow:** `CLEAR RULES. NO HIDDEN ASSUMPTIONS.`

## Good questions. Straight answers.

**Description:**

> Understand the protections—and their limits—before depositing funds into a vault.

**Documentation CTA:** `Explore the Protocol Docs`

### What does Lurro actually protect?

Lurro enforces the agreed payout rules for USDC deposited into a project vault. It binds recipient addresses and milestone allocations, prevents unauthorized redirection and duplicate settlement, and records completed payouts. It cannot protect funds that were never deposited, verify whether the underlying agreement is fair, or control money after recipients receive it.

### Who verifies that the work is complete?

A verifier named in the agreement reviews specific evidence submitted for each milestone. The smart contract records the authorized decision; it does not independently evaluate work quality. Challenges, reviewer inactivity, and arbitration follow rules accepted by the parties before funding.

### Can someone change the recipient after funding?

No. Recipient wallet addresses and milestone allocations are immutable once the agreement is locked. The P0 vault does not offer an administrator-controlled recipient replacement. Participants should use a compatible recoverable smart wallet if they need signer recovery without changing the registered wallet address.

### What if a recipient loses access to their wallet?

Lurro cannot recover a lost private key or redirect payment to a new address under the current agreement. A properly configured smart wallet may support recovery of its signers while preserving the same wallet address. With an ordinary wallet and no recovery path, funds payable to that address may become inaccessible.

### What happens if a project is only partially funded?

Lurro shows the difference between the contract commitment and USDC actually deposited. A milestone can be reserved only when its full allocation is available. An unfunded milestone is not described as secured, earned, or paid.

### What happens if a project is cancelled?

An early project-wide cancellation requires approval from the original funder and all recipients under the current proposal. Eligible unsubmitted milestones may be cancelled, while submitted work, disputed decisions, and earned payment rights continue under the original agreement. Refundable funds are owed only to the original funder and can be claimed according to the vault's rules.

### What happens when the verifier or arbiters don't respond?

If a submitted milestone receives no verifier response within the agreed review period, an authorized project participant can escalate it. The primary arbiter can decide during the dispute window, and the backup arbiter becomes eligible after its waiting period. If no valid decision is made before the arbitration deadline, the vault applies the pre-agreed fallback: previously verifier-approved evidence resolves toward payout; otherwise it resolves toward refund. This fallback is deterministic, but it is not a guarantee of a fair real-world outcome.

### Is every transaction and agreement publicly visible?

Public blockchain transactions and wallet addresses are generally inspectable. Lurro can store evidence or document hashes onchain, but those hashes do not make the underlying documents automatically public or prove that the documents are genuine. Sensitive contract details should not be published without an explicit disclosure and privacy review.

### Is Lurro live on Mainnet?

The current version presented here is an Arc Testnet prototype. Its automated self-test demonstrated selected funding, payout, and refund flows using test wallets and test USDC. It has not been independently audited, and this page does not claim a live Arc Mainnet deployment.

### Can I use Lurro for domestic Rupiah payments?

This prototype settles USDC on Arc and is not a Rupiah payment service. In Indonesia, domestic payments must comply with applicable Rupiah payment requirements; USDC should not be presented as a lawful substitute for domestic commercial payments. A future compliant Rupiah workflow would require a separate product and appropriate licensed payment integrations.

---

## 10. Final CTA

**Eyebrow:** `EVERY AGREEMENT DESERVES A CLEAR ENDPOINT.`

## Make every authorized payout accountable.

**Description:**

> Define who is entitled to payment. Secure the funds for each milestone. Verify the result when the payout settles.

**Primary CTA:** `Create a Testnet Project`  
**Secondary CTA:** `Inspect the Proof`

**Disclosure:**

> Only deposited vault funds are protected by Lurro's payout rules. This is an unaudited Testnet prototype.

---

## 11. Footer

**Wordmark:** `lurro.`  
**Brand line:** `Every fund, right where it belongs.`

**Links:** `GitHub` · `Protocol Docs` · `Review & Limitations` · `Testnet Explorer`

**Footer status:**

> © 2026 Lurro · Arc Testnet prototype · Not independently audited

**Back-to-top link:** `Back to top ↑`

---

# PART B — CHANGE MAP (UNTUK IMPLEMENTASI)

| Component/Section | Teks saat ini | Tindakan / Teks baru |
|---|---|---|
| Network banner | `Built on Arc · Proven on Testnet` | `Built on Arc · Tested on Testnet` |
| Hero supporting copy | `A clearer path from project agreement to payment.` | `The agreement defines who gets paid. Lurro makes sure the funds follow it.` |
| Hero body | `Secure the funds, protect the recipients, and prove the payout.` | Teks hero 2 kalimat dari Part A §2 |
| Hero CTA | `Open your workspace` | `Open Testnet App` |
| Problem heading | `A promised budget isn’t a paid invoice.` | Jadikan supporting punchline; headline utama menjelaskan uang sampai atau tidak |
| How it works heading | `Good agreements deserve a better payment path.` | `From signed terms to verified payouts.` |
| How it works step 03 | `Approve the work` | `Verify or resolve` |
| Differentiator heading | `Keep everyone on the same page.` | `The middleman shouldn't be able to rewrite the payout.` |
| Protected allocations | `The right funds. The agreed recipients.` | `Recipients locked. Allocations protected.` |
| Audit proof feature | `Don’t just hear “paid.” Follow the proof.` | **Keep** |
| Proof heading | `A promise is useful. Proof is better.` | **Keep** |
| Proof link | `Verified contract` | `Source-verified contract` bila benar-benar source-verified |
| Proof summary | `self-test completed ... payout` | Sebut jalur `arbitration-authorized payout`, bukan mengasumsikan normal verifier approval |
| Use cases heading | `One project. More than one pair of hands.` | **Keep** |
| FAQ | Enam pertanyaan | Tambah partial funding, wallet loss, timeout/fallback, privacy; lengkapi semua jawaban |
| Final CTA | `Create a project` | `Create a Testnet Project` |
| Footer | `Arc Testnet prototype. Not independently audited.` | **Keep** |

## CTA routing yang disarankan

| CTA | Target |
|---|---|
| Open Testnet App | `/app/` |
| Create a Testnet Project | `/app/new` **hanya jika route ini benar-benar ada**; kalau belum ada, arahkan ke app |
| Inspect Testnet Proof | `#proof` |
| See how it works | `#how-it-works` |
| Product | `#product` |
| Use cases | `#use-cases` |
| Resources | Area dokumentasi/tautan repository yang memang tersedia |
| Protocol Docs | `https://github.com/amantajatii/Lurro/blob/main/contracts/README.md` |
| Self-Test Report | `https://github.com/amantajatii/Lurro/blob/main/contracts/TESTNET-PROOF.md` |
| Review & Limitations | `https://github.com/amantajatii/Lurro/blob/main/contracts/SECURITY-REVIEW.md` |
| Source-verified contract | `https://explorer.testnet.arc.io/address/0xa3b6db6a52ff3cf32438c0989af041d77d3dacae?tab=contract` |
| Successful payout | `https://explorer.testnet.arc.io/tx/0xc1b3b26acf41b2e347234f4c8115982e12d5d86edb27f6d7e9fde6731856a628` |
| Cancellation & refund | `https://explorer.testnet.arc.io/tx/0x74ae5db2eec9b7c0ebe2e1cd6d4ea40c6fc2a9a6e574617d63d203f87f52e585` |

> Semua tautan eksplisit di tabel berasal dari materi halaman yang diberikan. Pastikan destination dan isi transaksi sesuai label sebelum deploy; dokumen ini tidak melakukan verifikasi chain secara independen.

---

# PART C — CONTENT & DESIGN IMPLEMENTATION RULES

## Layout dan visual

- **Jangan redesign total.** Pertahankan ritme editorial, banyak whitespace, dua feature showcase, dan proof panel sebagai komponen utama.
- **Brand palette:** Deep Plum `#2A1F3D`, Soft Violet `#6655DC`, Lavender Mist `#E9E4FF`, Lilac White `#F7F5FC`. **Tidak ada hijau** sebagai warna brand.
- Tipografi: Manrope untuk display, Inter untuk body serta angka finansial.
- Label `Illustrative preview` dan `Arc Testnet` harus berbeda secara visual. Jangan menyamakan angka ilustratif dengan data RPC.
- Proof panel harus lebih konkret daripada empat paragraf abstrak; gunakan ringkasan action + link explorer.
- Gunakan satu primary CTA per viewport utama untuk menghindari kompetisi visual antara `Open app` dan `Create project`.
- Jika status network berubah ke Mainnet setelah deployment nyata, ubah copy berdasarkan bukti dan kontrak yang baru, bukan melalui pergantian istilah otomatis.

## Tone of voice

**Gunakan:**

- `Protected allocations`
- `Authorized payouts`
- `Agreement-bound recipients`
- `Testnet self-test`
- `Independently inspectable receipts`
- `Human-verified evidence`

**Hindari:**

- `Eliminate corruption`
- `Guaranteed funds` tanpa kualifikasi *deposited vault funds*
- `Fraud-proof`
- `Audited`, jika hanya self-review
- `AI verifies completion`, jika verifier sebenarnya manusia
- `Fully decentralized`, jika validasi bergantung pada verifier dan arbiters yang ditetapkan
- `Mainnet ready/live`, sebelum bukti deployment tersedia

## Microcopy states (untuk app yang dikunjungi dari landing)

| State | Recommended label | Helper text |
|---|---|---|
| Agreement created, not locked | `Awaiting agreement` | `Required parties must accept the same terms before funding.` |
| Committed, not deposited | `Not yet funded` | `The agreement is signed, but no USDC has been secured in the vault.` |
| Partially deposited | `Partially funded` | `Deposited funds do not yet cover all remaining milestone obligations.` |
| Milestone reservation unavailable | `Insufficient available funds` | `This milestone must be fully funded before it can be reserved.` |
| Reserved | `Reserved` | `Funds are locked for this milestone but are not yet earned.` |
| Submitted | `Awaiting review` | `The assigned verifier must review the latest submitted evidence.` |
| Rejected | `Changes requested` | `Review the rejection reason and applicable resubmission deadline.` |
| Approved, challenge active | `Approval pending finality` | `Eligible participants may challenge before the deadline.` |
| Approved, challenge elapsed | `Earned` | `The challenge window has ended. Payment rights are final under the agreement.` |
| Claimable | `Ready for payout` | `Anyone may trigger settlement to the agreed recipients.` |
| Disputed | `Under dispute` | `The agreed arbitration rules and deadline now apply.` |
| Paid | `Paid` | `Settlement succeeded onchain. Inspect the transaction receipt.` |
| Refund owed | `Refund available` | `The original funder may claim the authorized refund.` |

> Jangan menggunakan `Earned` pada tahap `Reserved` atau `Approved` yang challenge window-nya belum berakhir. Jika challenge window habis, hak sudah earned secara logis walau `finalizeApproval()` belum dipanggil.

---

# PART D — RELEASE ACCEPTANCE CHECKLIST

- [ ] Hero menjelaskan siapa menerima uang dan mengapa kontrak mencegah redirect sepihak.
- [ ] Problem section menyebut risiko pembayaran multi-party dan membedakan budget/commitment dari uang dalam vault.
- [ ] Tahap `Reserved`, `Earned/Claimable`, dan `Paid` tidak disamakan secara semantik.
- [ ] Explain flow mencakup reviewer, challenge, timeout, dispute/arbitration, dan final payout secara ringkas.
- [ ] Proof section menunjukkan bahwa test adalah automated self-test, bukan independent human trial.
- [ ] Proof section tidak mengklaim verifier approval normal jika transaksi contoh sebenarnya arbitration-authorized.
- [ ] Semua link explorer memuat contract/transaction yang benar; label sumber kontrak `Source-verified` hanya jika terkonfirmasi.
- [ ] Tidak ada klaim Mainnet deployment sebelum benar-benar ada deployment dan transaksi nyata.
- [ ] Semua preview/dummy diagrams diberi disclosure ilustratif.
- [ ] FAQ menjelaskan partial funding, cancellation, immutable recipient, wallet loss, dispute fallback, public visibility, dan Rupiah payment limitations.
- [ ] CTA menggunakan label Testnet dan menuju route yang benar-benar aktif.
- [ ] Tidak ada warna hijau pada brand palette maupun aset utama.
- [ ] FAQ accordion dan mobile layout accessible: keyboard, focus, aria labels, contrast.
- [ ] Copy konsisten dengan smart contract ABI dan P0 policy yang benar-benar deployed. Jika ada perbedaan, **ubah copy agar sesuai kontrak yang berjalan**, bukan sebaliknya.

---

## Final editorial recommendation

Jangan mengganti identitas Lurro. Copy utamanya sudah tepat:

> **Every fund, right where it belongs.**

Perbaikan terpenting adalah menggeser proposisi nilai dari *“we make project funding clearer”* menjadi:

> **The agreement defines who gets paid. Lurro makes sure the funds follow it.**

Klaim tersebut tetap harus dibaca dalam batas: **dana yang benar-benar didepositkan ke vault, hak yang telah disepakati, validitas aturan kontrak, dan keputusan verifier/arbiter yang berwenang.**
