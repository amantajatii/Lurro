# Desktop Mainnet read-only smoke test

14 October 2026. Actual native Brave browser interaction against http://127.0.0.1:3042, Mainnet writes disabled. **Core pre-deployment desktop checks completed with mixed agent-observed and owner-reported evidence; not an all-gates PASS or Mainnet authorization.** No signature, deployment, approval, deposit or payout was sent to Mainnet.

The tested server is the retained Mainnet static export from the prior release verification (financial frontend at bcac11d; frozen contract bytecode unchanged). Later c91e264 added documentation/navigation; its new documentation route is not covered by this export smoke test. Current repository HEAD before this report was eec3027.

| Check | Status | Actual browser evidence |
| --- | --- | --- |
| Mainnet label / release warning | PASS | Dashboard and every project route say Arc Mainnet, real USDC and transactions disabled |
| Initial Mainnet project discovery | PASS | Empty Projects 0; no historical Testnet vault or proof shortcut seeded |
| Rabby discovery / connection | PASS | Installed wallet list; expected localhost connection prompt; connected backup wallet 0xa999…b306; app showed network switched to Arc. Connection only, no signing |
| Other wallet discovery | PASS | MetaMask, OKX, Rainbow and WalletConnect displayed; only Rabby connection tested |
| Testnet vault import on Mainnet | PASS | 0xaf400dd1dfb823fd7d6c1d8629c17f56fae5d945 read failed on Mainnet; no Testnet amounts/receipt substituted. Address was saved as an unverified bookmark with a clear failure, then unlinked; Projects 0 restored |
| Landing / product navbar / app entry | PASS | Actual Back to website and Open app navigation; Product menu lists dashboard, agreement, funding, payments, milestones, governance, audit and creation routes |
| Overview / agreement / funding / milestones / payments / governance / audit | PASS | Actual browser route loads and correctly labelled empty/open-project states; Mainnet reads required |
| Empty Create Project validation | PASS | Continue remains step 1 and focuses required Project name |
| Overlapping roles | PASS | Funder and backup duplicate rejected with explicit different-address error |
| Single recipient / milestone form | PASS | Valid smoke-only draft advanced through recipient and milestone steps to review |
| Review / immutable recipients / amounts | PASS | Smoke-only preview displayed permanent-address warning, agreed recipient and 1 USDC allocation. Not a live Mainnet agreement acceptance |
| Mainnet deployment disabled | PASS | Create vault on Mainnet remained disabled even with review checkbox checked and connected wallet matching this smoke-only draft funder. No deployment attempted |
| Desktop layout | PASS | Observed wide desktop dashboard, landing/menu and wizard; screenshots retained locally. Not an exhaustive responsive-width sweep |
| Console free of errors | FAIL | MetaMask global Ethereum provider collision error; MaxListenersExceededWarning and ObjectMultiplex extension warnings. Rabby EIP-6963 connection succeeded. No clean-console claim; no confirmed application exception identified in the inspected console |
| Wallet disconnect | PASS | Owner reported successful disconnect after the agent run. Manual owner evidence; not independently re-observed by automation |
| Wrong-network recovery | PASS | Owner reported automatic switch to Arc. Earlier agent connection also showed network switched to Arc. This establishes reported connection recovery, not every mid-session wrong-chain state |
| Live Mainnet project roles, funding and receipt presentation | NOT TESTED | No reviewed live Mainnet vault exists yet. Empty/invalid states were tested; a future deployment requires separate capped verification |
| Chain namespaces across rebuilds on the same origin | NOT TESTED | Separate port and negative import checked; no same-origin rebuild/storage experiment. Existing semantic namespace tests are separate evidence |

Evidence: ignored contracts/out/desktop-mainnet-smoke contains actual AX observations and screenshots (01–42). Console was read through actual DevTools UI, not replaced by unit tests. Browser input interruptions and native date-picker limitations slowed the run; native keyboard entry eventually completed the valid review. Any smoke-only draft is distinct from the owner's frozen deployment input packet and must never be deployed. The test bookmark was removed. No release write flag was changed; mobile remains outside the owner's desktop-only scope.

Owner subsequently confirmed disconnect works and wrong network automatically switches to Arc. Those gates are recorded as manual owner PASS, distinct from automated observations. Explicit mid-session wrong-chain action blocking was not separately reproduced in this browser run. The extension conflict remains an environment finding; do not disable wallet security protections or claim it fixed. This report does not grant a GO or permission to broadcast.
