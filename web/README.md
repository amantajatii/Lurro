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

The landing page is marketing. All diagrams are explicitly illustrative, have no fictional financial totals or transaction status, and cannot trigger payments. Proof links follow the build network: Mainnet deployment/source evidence, or Testnet historical payout/refund. Testnet proof is an automated self-test, not an independent human verification or security audit.

The frontend supports a Mainnet-configured workspace; the existing limited vault deployment and its verification are recorded in [MAINNET-DEPLOYMENT.md](../docs/release/MAINNET-DEPLOYMENT.md). Mainnet writes are disabled by default. Navigation anchors, mobile menu, three product-preview buttons and native FAQ accordions work without a private API or signup service. The hero uses a white grid, compact typography and responsive SVG curves above and below the product preview, following the supplied Dub screenshot as a visual reference.

## Dashboard `/app/`

The original app layout uses the local Dub sidebar/workspace patterns as visual reference. It includes a responsive sidebar, funding summaries, linked vault list, search/status/role filters, pending actions, and an expandable vault snapshot. The landing page's Explore Lurro CTA opens the app.

Wallet connection uses [RainbowKit](https://rainbowkit.com/docs/custom-wallet-list), Wagmi and TanStack Query. The picker supports installed EIP-6963 browser wallets, Rainbow mobile and WalletConnect. Account/network changes update roles; a wrong-network banner offers switching to the selected Arc network. The dashboard never signs or sends a funding/payment transaction. Wallet connection and network approval are performed by the user.

Projects are linked by vault address because the current contract has no project registry. Up to 12 addresses can be saved in this browser; no financial totals or wallet credentials are stored. Public reads work without a wallet. Every refresh discards old balances and reads the generated v1.2 ABI at a pinned block on the selected Arc network; any failed read withholds aggregate totals. Reported schema/network/token/P0 limits and the accounting identity are checked. An arbitrary vault reporting this schema is not thereby source-verified or independently audited.

On Mainnet, link a project by its Mainnet vault address or open the public deployment from the landing proof section. Amounts and milestone states come from the selected chain RPC, not proof documents or fixtures. The **Read the Testnet vault** shortcut appears only in a Testnet build; it reads the historical automated self-test using test USDC. Create Project opens `/app/new/`. Project Overview opens `/app/project/?project=0x…`. Agreement opens `/app/agreement/?project=0x…`. Funding, Milestones, Payments, Governance and Audit Explorer are available at their respective `/app/` routes, with the same `?project=0x…` parameter.

Run `npm test` for exact amount formatting, role/action derivation, invalid addresses, and RPC failure handling. `LIVE_ARC_TEST=1 npm test` additionally reads the actual Testnet proof vault and checks its accounting and terminal milestone statuses. Test fixtures stay in `tests/` and are never used by the UI. Arc configuration follows [Connect to Arc](https://docs.arc.io/arc/references/connect-to-arc).

Dependency audit (13 October 2026): the RainbowKit/Wagmi dependency tree has 22 moderate audit entries; no production high or critical entries remain after pinning `ws@8.22.0`. Do not describe this dependency tree as vulnerability-free. Some upstream SDKs are deprecated; reassess compatible releases before production. Development lint tooling currently includes `braces@3.0.3`, affected by GHSA-vfj7-8cjw-p6xm (nested-pattern stack exhaustion). No patched braces release was available when checked. Five audit entries trace to this one dependency through Next's ESLint configuration; it is not included in the exported site. Avoid untrusted lint glob patterns and revisit the tooling when a patch is released.

## Create Project `/app/new/`

Four steps define project metadata, distinct role wallets, 1–5 recipients, and 1–3 milestones before an immutable review. Allocations use exact six-decimal BigInt amounts; recipients are sorted numerically with their allocations preserved. Each recipient needs an entitlement; each milestone needs a recipient submitter, scope hash, future increasing submission deadline and a final evidence deadline exactly seven days later. P0 v1.2 policy windows are fixed.

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

All workspace pages use `components/workspace/app-shell.tsx` for the sidebar, header, mobile navigation, wallet picker and footer. `WalletProvider` stays in the app layout so the selected account survives client navigation. Creation passes its step navigation into the shared sidebar and disables wallet controls while a deployment is pending.

`components/ui/` contains `Button`/`ButtonLink`, `AppCard`, `AppPageHeading` and `FormField`. All workspace pages consume these components. Button defaults to `type="button"`; submissions are explicit. Links retain their anchor/navigation semantics. Card surfaces, radius and form-control styling are defined in `app/app/components.css`; page styles handle layout and feature-specific details. Landing-page `SpecularLink` remains its dedicated animation component.

Add future app pages using AppShell and these UI primitives rather than copying the app frame. Agreement state, vault reads and deployment behavior remain in feature components/lib modules. Shared-control tests verify explicit submission behavior, external-link attributes and heading action slots.

## Agreement `/app/agreement/?project=0x…`

Uses the shared AppShell/UI components and a reusable query/snapshot hook also used by Project Overview. Sidebar links and Overview open the selected agreement. The page reads actual terms, allocations, UTC deadlines, role wallets and each acceptance at a pinned block on the selected Arc network.

File selection checks `keccak256(exactFileBytes)` locally against `signedDocumentHash`. A generated Lurro JSON document additionally checks chain, every encoded term and each scope commitment against the vault before displaying names/scope text. External PDF/text/Markdown documents can be checked by exact hash and read/downloaded locally. Uploading a file never sends it to a server or RPC. User acknowledgement binds to the selected vault, canonical terms hash and wallet; changing account requires acknowledgement again.

Before enabling accept/lock, the page recomputes the canonical v1.2 terms hash (`schema, chainId, vault, ProjectTerms`) and compares deployed runtime bytecode with the compiled prototype, normalizing only compiler-declared immutable ranges. The matcher accepts the current 1–5-recipient build and the exact previous 2–5-recipient build, retaining its separately pinned fingerprint for existing vaults. This identifies known builds, not an independent audit. Regenerate the write ABI/runtime fingerprint after `forge build` with `node web/scripts/generate-agreement.cjs`.

Accept is limited to an unaccepted named party with a matching document. Lock is permissionless after all required parties have accepted and counts agree. Preflight rereads live state, code, hash, account and chain, then simulates the exact method before requesting wallet confirmation. These actions do not deposit USDC or approve token allowances. Pending action metadata is saved per vault in session storage; no keys or agreement bytes are stored by this page.

A hash alone never means success. The UI checks the mined receipt, actor, destination, zero native value, exact method/calldata, matching terms hash and resulting agreement state. Pending receipts are recoverable without resending; cancelled/reverted replacements can be dismissed explicitly. Wallet signing/broadcast remains a user action and is not executed by automated frontend tests.

Tests cover exact-byte document verification, inconsistent rights, canonical address/schema bindings, actor eligibility, unanimous acceptance before lock, receipt replacement checks, and runtime rejection. `LIVE_ARC_TEST=1 npm test` also verifies the deployed self-test's real runtime, independently computed terms hash and six acceptances without broadcasting.


## Wallet configuration and loading

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` to your public Reown project ID. The local ID supplied by the project owner is configured in ignored `.env.local`; configure the same public variable on the deployment platform and allowlist the deployed domain in Reown. Without this ID, RainbowKit still provides browser extension discovery, but mobile QR connectors are omitted. Connections are requested explicitly; reconnect-on-mount and Wagmi connection persistence are disabled. The chosen live connector remains available during client navigation, and stale serialized connectors are not restored after reload. No key is embedded in the frontend.

`cuer` is pinned to `qr@0.5.5` through a scoped override: current newer QR releases reject the border-zero option used by RainbowKit and crash its pairing modal. A regression test exercises the actual installed QR generator. The x402 packages satisfy optional peer imports in the upstream Base/CDP SDK pulled in by Wagmi; Lurro does not offer x402 or Solana payment flows.

`LogoLoader` reuses `/lurro-mark.webp` with CSS orbit/breathe animations, an accessible live status and reduced-motion support. It covers workspace hydration, query-param Suspense, vault reads, history reads and pending receipts. No artificial minimum duration or animation library is added.

## Funding, Milestones, Payments and Governance

`WorkflowFrame`, `Metrics`, `MilestoneHeading`, `Deadline`, `ActionButton`, `HashFile` and `ActionPanel` reuse the workspace shell and UI primitives. Regenerate `workflow-abi.ts` after `forge build` with `node web/scripts/generate-workflow.cjs`. `readWorkflow` reads state, revision/hash bindings, token balance/allowance, cancellation version and approvals at the same vault snapshot block. Current public reads use batches of at most five requests; history queries use sequential unbatched requests to respect provider limits. For Testnet builds, history also falls back to the [Blockdaemon Arc Testnet host](https://www.blockdaemon.com/blog/blockdaemon-expands-arc-testnet-support-with-websockets), whose HTTPS JSON-RPC, chain ID, original 36-event window and CORS were verified locally. The explorer indexer remains the final history fallback.

Funding separates ERC-20 approval of the exact selected amount from deposit, checks capacity and funder balance, and reserves complete milestone allocations in order. Arc exposes one underlying USDC balance through native and ERC-20 interfaces; gas consumes that same balance, so the UI reminds funders to leave room for fees. See [Arc wallet balance guidance](https://www.arc.io/blog/supporting-arc-in-wallets-one-balance-usdc-fees-and-complete-history). Milestones hashes exact evidence bytes locally, supports up to the contracted revision limit, checks the verifier's selected file against the current commitment, and binds review transactions to its exact revision/hash. File bodies and rejection reason text stay local and must be shared separately with the assigned parties.

Payments separates committed, claimable and paid entitlements, settles all recipients atomically and sends refunds only to the original funder. Both payout and refund execution are permissionless under the actual contract rules. Governance exposes approval/rejection challenges, review timeout escalation, primary/backup arbitration, timed defaults, and unanimous cancellation with proposal/version/expiry guards. Cancellation does not extinguish already submitted work.

Every workflow write checks the selected account and chain, rereads contract identity/terms/state, validates current eligibility and simulates before wallet confirmation. Shared transaction recovery keeps only public metadata scoped to the vault in session storage. Receipt verification binds actor, target, exact calldata and zero native value; replacement/revert cannot masquerade as success. Signing and broadcasting are user wallet actions, not part of automated frontend testing.

## Audit Explorer

`/app/audit/?project=0x…` finds the deployment block, then reads and decodes original contract events from there. The documented public self-test deployment receipt accelerates that vault's lookup; other immutable vaults check indexed creation metadata against the actual RPC receipt, with historical code lookup as a fallback. When RPC history is unavailable, the [Blockscout REST API](https://docs.blockscout.com/devs/apis/rest) on the official Arc explorer supplies paginated raw event bytes. The source is marked explicitly and indexer lag is disclosed. Event names and amounts are decoded locally from raw topics/data, never copied from API display labels. The timeline filters agreement, funding, evidence, governance and settlement events, links transaction receipts and exports exact BigInt amounts as JSON strings.

History is paginated in 10,000-block windows with individual requests of at most 2,000 blocks. Loaded coverage is displayed explicitly; partial ranges never claim complete history. Load subsequent windows, select a block range or jump to recent activity. Both provider failures surface retry and explorer links; a known start block can be entered if deployment discovery fails. The browser keeps at most 2,000 events in one accumulated timeline before requiring a fresh range.

Tests cover amount precision, role/deadline boundaries, review revision binding, permissionless settlement, current cancellation consent and lossless exports. The live workflow check verifies the real vault's identity/accounting and its original 36-event window, including six agreement acceptances, two recipient settlements and a funder refund. It sends no transactions.

Final verification: all 55 tests pass with `LIVE_ARC_TEST=1`, alongside lint, TypeScript and the static production build for all ten product routes. Brave browser checks covered the actual vault on Funding, Milestones, Payments, Governance and Audit, Rainbow's pairing QR, and mobile/desktop Audit layouts. These checks verify reads and pairing display; wallet signing and newly broadcast transactions have not been tested end to end.

## Project switcher

The sidebar workspace button opens the reusable `ProjectSwitcher`. It lists browser bookmarks and the current vault, marks the current selection, and preserves Agreement/Funding/Milestones/Payments/Governance/Audit when changing projects. Dashboard selections open Overview. Create project and Open vault address are available from the same popover; address entry validates the EVM format, then the destination page checks actual vault data. Opening an address does not automatically bookmark it. Labels use shortened addresses because this picker has no verified agreement document containing project names.

The shared bookmark module validates, normalizes and deduplicates up to twelve addresses and notifies mounted pickers after same-tab writes or cross-tab storage changes. Dashboard linking, Overview saving and confirmed creation all use it. No balances, documents or keys are persisted by the picker. During a wallet transaction the picker is disabled. Escape restores focus to the trigger; outside clicks and focus leaving dismiss the popover. Browser checks covered the empty state, invalid input, opening the actual public proof vault, instant bookmark visibility and Escape focus.

## Landing navigation

The landing header follows Dub's navigation hierarchy as a visual reference, with original Lurro components: Product and Resources dropdowns, an Open app link, and a Create project CTA. Product opens the real Agreement/Funding/Payments pages plus Milestones/Governance/Audit, with dashboard and creation shortcuts. Resources opens the public proof in Audit, protocol source and FAQs. Hero and closing CTAs now lead to the workspace and project creation respectively. Mobile navigation retains a visible Open app action and exposes both workspace/creation actions inside its expandable menu. No authentication service or marketing pages are implied. The implementation adds no UI or animation dependency.

## Transaction UX

Agreement acceptance and workflow actions finish automatically after receipt and current-state verification; successful receipts remain visible as nonblocking notices with explorer links. Pending, unverified and reverted transactions never become success or permit duplicate submission. Workflow actions use a native modal review dialog with keyboard focus and Escape handling; its status can be reopened while a submitted transaction is tracked. Explicit cancellation/refund decisions retain acknowledgment; routine actions use concrete confirmation labels.

Same-vault refresh retains the last displayed snapshot with an Updating indicator and pauses actions until fresh data arrives. Initial reads use a layout skeleton; a different vault or failed read never displays the previous vault data. Unassigned wallets receive an observer notice without losing public/permissionless access. Funding guides allowance → deposit → reserve with separate wallet confirmations, and milestone controls explain unavailable states and next steps. Evidence remains local hash-only with original-file sharing outside the app.

Project names in the switcher, dashboard search and overview come from locally verified agreement metadata. Creation saves the name only after the successful vault receipt and document-hash check; uploading the original matching agreement can populate names for existing vaults. A separate address/document-hash-bound local name cache preserves the existing address-only bookmark format. Unknown names fall back to a short vault address, and names are not inferred from RPC or treated as financial authority.


## Network-bound builds and Mainnet workspace

Production builds default to Mainnet; development defaults to Testnet. Set `NEXT_PUBLIC_LURRO_NETWORK=mainnet` or `testnet` **before building** to select explicitly. The example configuration now selects Mainnet.
Invalid values fail closed. Next.js embeds these public values in the static
bundle; changing a deployment variable without rebuilding does not change its
network. Keep separate deployments for each environment rather than changing
the network of an open workflow. RainbowKit recognizes both networks; the app's
reads, simulations, writes, document hashes and explorer links stay bound to its
build. Switching a wallet never submits an action automatically.

Mainnet stores linked vaults, names and pending receipts under chain-5042 keys;
existing Testnet keys are retained for compatibility and never read by Mainnet.
No project is automatically seeded in Mainnet storage and no Mainnet settlement is claimed. Mainnet landing, Resources and Docs link to the actual deployed Mainnet vault, creation receipt and Sourcify exact-match evidence through `lib/public-proof.ts`. Testnet builds retain their separately labelled historical payout/refund evidence. Mainnet writes remain disabled unless explicitly enabled after review.

Mainnet transactions are **disabled by default**, including creation and
agreement actions. Only after owner review of the release commit, real terms,
signer and strictly capped budget may a deployment be rebuilt with
`NEXT_PUBLIC_LURRO_MAINNET_WRITES_ENABLED=true`. This flag is a release control,
not contract authorization. Every Mainnet action still requires an explicit
acknowledgement of real USDC, immutable recipients and the unaudited prototype,
plus live role/network/state checks and wallet confirmation. The deployment
script is documented in `contracts/README.md`; enabling a frontend flag does not deploy a vault or certify its financial safety. The existing Mainnet deployment does not automatically authorize further transactions.

### Optional selected-network RPC

`NEXT_PUBLIC_LURRO_RPC_URL` prepends a public HTTPS endpoint (or loopback HTTP endpoint for local development) to the selected network RPCs. URL credentials are rejected; never put a secret in this public setting. Reads and wallet transports use the same selected-chain endpoints, and live vault reads still verify chain ID and deployed vault schema. The setting does not switch networks, enable Mainnet writes, or authorize a transaction. A local read-only forwarding server can be used when browser content blockers prevent direct RPC access; responses must come from the real selected chain, not fixtures.
