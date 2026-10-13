# Lurro web

Original Next.js/React implementation based on the Lurro PRD. The local Dub checkout was inspected for visual reference (grid composition, spacing, fine borders and information hierarchy); no Dub source code, artwork or dependency was copied.

```sh
npm ci --ignore-scripts
npm run dev -- --port 3030
```

Open http://localhost:3030. Validation: `npm run lint`, `npm run typecheck`, `npm run build`. The static export is generated in `out/` for a static host; no runtime backend/API is required.

Fonts: self-hosted variable Manrope and Inter from their Fontsource packages; retain their included OFL license notices when distributing fonts. Brand artwork and section curves are original. Product-preview icons use the Heroicons 2 set via named imports from `react-icons/hi2`; other diagrams use original inline SVGs.

Brand assets live in `public/lurro-logo.webp`, `public/lurro-mark.webp`, and `public/favicon.webp`. The transparent wordmark was exported from the original symbol and Manrope outlines; `lurro-logo-source.svg` is its editable vector source, and `OFL-Manrope.txt` retains the font notice. All rendered brand marks use WebP.

Four primary CTAs (including the header) use an original lightweight interpretation of [React Bits Specular Button](https://reactbits.dev/components/specular-button): CSS rim/surface highlights and element-local pointer events. No animation dependency, WebGL canvas, global pointer listener, or idle animation loop is included. Pointer updates are coalesced with requestAnimationFrame; touch and reduced-motion users retain standard links and focus indicators.

The landing page is marketing. All diagrams are explicitly illustrative, have no fictional financial totals or transaction status, and cannot trigger payments. Proof links point to the deployed, source-verified Arc Testnet vault and documented successful payout/refund. Testnet proof is an automated self-test, not an independent human verification or security audit.

Mainnet deployment is outside this frontend. Navigation anchors, mobile menu, three product-preview buttons and native FAQ accordions work without a private API or signup service. The hero uses a white grid, compact typography and responsive SVG curves above and below the product preview, following the supplied Dub screenshot as a visual reference.

## Dashboard `/app/`

The original app layout uses the local Dub sidebar/workspace patterns as visual reference. It includes a responsive sidebar, funding summaries, linked vault list, search/status/role filters, pending actions, and an expandable vault snapshot. The landing page's Explore Lurro CTA opens the app.

Browser-wallet connection uses EIP-6963 discovery (with a legacy injected-provider fallback). Account/network changes update roles; a wrong-network banner offers Arc Testnet switching. The dashboard never signs or sends a funding/payment transaction. Wallet connection and network approval are performed by the user.

Projects are linked by vault address because the current contract has no project registry. Up to 12 addresses can be saved in this browser; no financial totals or wallet credentials are stored. Public reads work without a wallet. Every refresh discards old balances and reads the generated v1.2 ABI at a pinned Arc Testnet block; any failed read withholds aggregate totals. Reported schema/network/token/P0 limits and the accounting identity are checked. An arbitrary vault reporting this schema is not thereby source-verified or independently audited.

Use **Read the Testnet vault** to fetch the documented integration self-test from Arc. Its title is a label for that public test vault; amounts and milestone states come from RPC, not the proof document or fixtures. This is test USDC, not a real-client project. Create Project opens `/app/new/`. Project Overview opens `/app/project/?project=0x…`. Agreement, Funding, Milestones, Payments, Governance, and Audit Explorer action pages remain unavailable until implemented.

Run `npm test` for exact amount formatting, role/action derivation, invalid addresses, and RPC failure handling. `LIVE_ARC_TEST=1 npm test` additionally reads the actual Testnet proof vault and checks its accounting and terminal milestone statuses. Test fixtures stay in `tests/` and are never used by the UI. Arc configuration follows [Connect to Arc](https://docs.arc.io/arc/references/connect-to-arc).

Dependency audit: production dependencies have no reported vulnerabilities. Development lint tooling currently includes `braces@3.0.3`, affected by GHSA-vfj7-8cjw-p6xm (nested-pattern stack exhaustion). No patched braces release was available when checked. Five audit entries trace to this one dependency through Next's ESLint configuration; it is not included in the exported site. Avoid untrusted lint glob patterns and revisit the tooling when a patch is released.

## Create Project `/app/new/`

Four steps define project metadata, distinct role wallets, 2–5 recipients, and 1–3 milestones before an immutable review. Allocations use exact six-decimal BigInt amounts; recipients are sorted numerically with their allocations preserved. Each recipient needs an entitlement; each milestone needs a recipient submitter, scope hash, future increasing submission deadline and a final evidence deadline exactly seven days later. P0 v1.2 policy windows are fixed.

The generated UTF-8 agreement JSON is downloadable; its exact bytes produce `signedDocumentHash`. Scope hashes use the trimmed UTF-8 scope text included in that document. This is a document commitment, not a signature or acceptance. Preserve and share the exact document with the assigned parties; acceptance/locking will be separate on-chain steps. Metadata is in that document, not a project directory or backend.

Creation rechecks the selected funder, wallet/RPC chain, deadlines and gas simulation before requesting wallet confirmation. No deposit or automatic acceptance is included. A transaction hash never counts as success: the page awaits a successful creation receipt and verifies the contract's document hash. Pending transaction hash/document are kept in this tab's session storage for receipt recovery without resending. Confirmed vault addresses join dashboard bookmarks. No keys are stored.

Constructor ABI/error definitions and bytecode are generated from the local Foundry artifact, not fetched from an external service. After changing the Solidity source, run `forge build` in `contracts/`, then `node web/scripts/generate-deployment.cjs` from the repo root. Tests check this bundle against that artifact. Actual wallet signing/broadcast is not performed during automated frontend checks.

## Project Overview `/app/project/?project=0x…`

The static route uses a client query parameter beneath Suspense. Dashboard project links and confirmed creation receipts open the selected vault overview. No query/address falls back to fake project data: missing, invalid, unsupported, loading, and RPC error states have separate UI. Query changes and refreshes hide previous snapshots immediately and ignore outstanding responses from prior requests.

Funding shows original commitment, cumulative deposits, available funds, reserved allocations, paid amounts, refunds owed and refunds returned. The funding bar is lifetime deposits versus original commitment; it does not count refunded money as still protected. Funds accounted as held are available + reserved + refund owed. Milestones expose effective state, UTC deadlines, submitter, scope commitment and exact per-recipient allocation. People show role wallets, their actual acceptances and cumulative committed/paid rights. Names and scope text require the agreement document and are not invented from the chain.

Next-step hints derive from wallet roles, the snapshot timestamp, current funding and milestone state. These are read-only hints; transaction eligibility will be checked again by the relevant action page. Copy link, copy commitments, open explorer, refresh and save-to-dashboard work without a signer. An arbitrary schema-reporting contract is not automatically source-verified or audited.

Public reads and creation preflight/receipt reads share the Circle primary RPC with a documented [dRPC public endpoint](https://drpc.org/docs/arc-api) as fallback. [Arc lists dRPC among its node providers](https://docs.arc.io/arc/references/rpc-endpoints). This resolves the observed browser `ERR_BLOCKED_BY_CLIENT` on the primary domain without changing browser protections. Chain ID remains 5042002. Public queries may reach either provider; no keys or agreement documents are sent through RPC.

Verified in Brave desktop and iPhone 16 emulation using the actual integration vault, including expanded milestone allocations. `LIVE_ARC_TEST=1 npm test` includes the live proof read and constructor simulation without broadcasting; other tests check held funds versus lifetime deposits, recipient paid totals, role-specific next steps, deadline formatting, and RPC fallback.

## Shared workspace components

Dashboard, Create Project and Project Overview use `components/workspace/app-shell.tsx` for the sidebar, header, mobile navigation, wallet picker and footer. `WalletProvider` stays in the app layout so the selected account survives client navigation. Creation passes its step navigation into the shared sidebar and disables wallet controls while a deployment is pending.

`components/ui/` contains `Button`/`ButtonLink`, `AppCard`, `AppPageHeading` and `FormField`. All three pages consume these components. Button defaults to `type="button"`; submissions are explicit. Links retain their anchor/navigation semantics. Card surfaces, radius and form-control styling are defined in `app/app/components.css`; page styles handle layout and feature-specific details. Landing-page `SpecularLink` remains its dedicated animation component.

Add future app pages using AppShell and these UI primitives rather than copying the app frame. Agreement state, vault reads and deployment behavior remain in feature components/lib modules. Shared-control tests verify explicit submission behavior, external-link attributes and heading action slots.
