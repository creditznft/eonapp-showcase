# EONAPP Post-Launch Mega Plan A-Z (Web, Web3 Domain, Decentralized Mirrors, Ad Approval)

Date: 2026-05-07
Owner: CEO + Copilot Auto-Ops
Status: Live on Cloudflare, contracts live on Polygon, post-launch hardening phase

## 0) Current Snapshot

- Site is live and deploys from GitHub -> Cloudflare Pages.
- Smart contracts are live and already integrated (no redeploy path in this plan).
- Strict TypeScript scan passed (tsc exit 0).
- Vite production build passed.
- Manifest Problems-tab blockers were fixed in this session.
- Live browser sanity checks passed for:
  - https://eonapp.ch/
  - https://eonapp.ch/workbench.html
  - https://eonapp.ch/vault.html
  - https://eonapp.ch/market.html

## 1) A-Z Launch Completion Framework

### A. Authority and Domains

Goal: keep eonapp.ch as primary and add eonlite.u as Web3/brand add-on.

- Primary web app: eonapp.ch (Cloudflare Pages production branch)
- Add-on brand/domain: eonlite.u
- Decentralized mirrors:
  - Arweave immutable release snapshot
  - IPFS + IPNS mutable decentralized pointer

Deliverable:
- eonapp.ch live and canonical
- eonlite.u forwarding/alias policy finalized
- decentralized URLs published in release docs and footer/status page

### B. Build and Runtime Health

Automated checks (daily for next 7 days):
- npm run lint
- npx tsc --noEmit --pretty false
- npm run build
- playwright chromium smoke suite (release gate)

Pass criteria:
- No build failures
- No TypeScript errors
- No manifest/schema blockers

### C. Contract Surface Validation (No Redeploy)

Keep these as verification-only tasks:
- Verify contract addresses in frontend config match deployment report.
- Verify chainId is 137 in production wallet interactions.
- Verify read-only token info panel data loads in Vault.

Manual only (wallet-signed):
- connect wallet
- switch to Polygon
- execute one non-destructive on-chain read/write flow in staging wallet

### D. Decentralized Delivery

Use existing runbooks and scripts.

1. Arweave publish (immutable snapshot)
- npm run deploy:arweave -- --keyfile ./arweave-key.json --dry-run
- npm run deploy:arweave -- --keyfile ./arweave-key.json

2. IPFS + IPNS publish (mutable decentralized pointer)
- npm run deploy:ipfs-ipns -- --check --config .ipns-config/eonapp-ch-ipns-config.example.json
- npm run deploy:ipfs-ipns -- --config .ipns-config/eonapp-ch-ipns-config.example.json

3. Record release
- npm run deploy:record-release -- --track hybrid --label post-launch-1

### E. eonlite.u Setup Strategy

Because .u is provider-specific, run this decision gate first.

Decision Gate:
- If eonlite.u supports standard DNS records:
  - Point eonlite.u -> eonapp.ch via redirect/CNAME policy.
- If eonlite.u supports only Web3/contenthash:
  - Point to IPNS or Arweave canonical release URL.

Recommended policy:
- eonapp.ch remains canonical app URL.
- eonlite.u acts as Web3 alias entry point with banner:
  - "Primary app: eonapp.ch | Decentralized mirror: <ipns/arweave URL>"

### F. Finance and Wallet Ops

Manual wallet checklist (cannot be fully automated in CI):
- MetaMask connect
- chain switch to Polygon (0x89)
- read token balances
- verify one signature flow
- verify one claim/mint/anchor flow using low-risk wallet

Evidence to save:
- tx hash
- screenshot of wallet prompt
- screenshot of success state in UI

### G. Growth and Ad-Network Approval Readiness

Ad approval preflight:
- Clear navigation and policy pages accessible:
  - /about.html
  - /privacy.html
  - /404.html
- No forced ads on trust surfaces (Vault/privacy/about).
- Rewarded offers only in optional reward contexts.
- No deceptive auto-open ad flows.
- Contact/support signal present (email/form/privacy statement).

Use checklist doc:
- docs/AD_NETWORK_SETUP_CHECKLIST.md

### H. Human-Minimum Operating Model

Automate everything possible; only keep manual where cryptographic intent is required.

Auto by Copilot/CI:
- lint/tsc/build/test gates
- release notes + release record files
- non-destructive browser smoke checks
- manifest/schema validation

Manual by CEO:
- wallet signing actions
- DNS registrar/web3 registrar account changes
- ad network dashboard submissions
- payment/account KYC actions

### I. Incident and Rollback

Rollback policy:
- Git revert to previous stable commit on main
- Cloudflare auto-redeploy from reverted commit
- keep decentralized snapshot metadata untouched as historical record

### J. KPI Window (First 14 Days)

Track daily:
- page load success rates
- JS error rate
- wallet connect success rate
- mission completion count
- referral loop starts
- ad policy warnings/rejections

## 2) Live Validation Matrix (Next 72 Hours)

### Automated (run twice daily)
- npm run lint
- npx tsc --noEmit --pretty false
- npm run build
- playwright smoke set (chromium release gate)

### Manual (one session/day)
- wallet connect + chain check
- one Signal query
- one WorkBench mission
- one Vault referral link copy and open on second browser profile
- one market browse + search action

## 3) What Copilot Already Verified Live This Session

- Homepage renders and core nav links are present.
- WorkBench renders, mode groups visible, setup CTA visible.
- Vault renders profile/identity/invite surfaces.
- Market renders catalog/filter/search surfaces.

Known manual-only gap:
- Wallet transaction confirmation cannot be fully completed from this automation environment (browser wallet extension approval is user-controlled).

## 4) 7-Day Post-Launch Plan

Day 1:
- finalize eonlite.u decision gate
- run decentralized publish cycle (Arweave + IPFS/IPNS)
- produce release record

Day 2:
- submit first ad network application packet
- attach policy pages + traffic/source explanation

Day 3:
- run wallet/manual verification script with test wallet
- archive tx hashes and screenshots

Day 4:
- monitor rejection/warning feedback from ad network
- apply compliance copy updates if requested

Day 5:
- re-run full launch gates
- publish post-launch patch if needed

Day 6:
- second decentralized snapshot publish
- compare Cloudflare vs decentralized availability

Day 7:
- CEO go/no-go review for paid growth scale-up

## 5) CEO Action List (Minimal Manual Burden)

Only these are required from you:
1. Approve final eonlite.u routing model (DNS redirect vs contenthash).
2. Execute wallet signature transaction checks (one short session).
3. Submit ad network application forms/accounts.
4. Approve or reject any compliance text updates requested by networks.

Everything else can remain automated in this repo workflow.

## 6) Definition of "Launch Complete"

Launch complete when all are true:
- eonapp.ch stable in production
- eonlite.u resolves to approved destination
- decentralized mirrors published and documented
- wallet smoke flows manually confirmed with evidence
- ad network application submitted with policy-compliant surfaces
- daily gate automation green for 3 consecutive days
