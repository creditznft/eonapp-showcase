This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex handover — W265/W283/W284/W286 safe merge and evidence work

## Source authority and target

- **Source authority:** this cumulative freeze.
- **Canonical repository:** `creditznft/EONAPP`, branch `main`.
- **Required merge method:** create a clean safety branch first; do not write directly to `main`.
- **Deployment state:** no deploy, no Cloudflare change, no referral/milestone activation, and no chain/wallet work is authorised by this handover.

## Phase A — local safety merge only

1. Clone or open the canonical repository on a clean local branch such as `safety/w265-w286-w283-w284`.
2. Apply this freeze as the source authority, preserving the local repository’s `.env*`, `.dev.vars`, secrets, `node_modules`, `dist`, `artifacts`, cache and logs.
3. Do not copy generated output or any file excluded from this package.
4. Run:

```bash
npm ci
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run qa:w265-w286-city-district-expansion
npm run qa:w283-cloudflare-rollback-evidence
npm run qa:w284-referral-activation-decision
npm run qa:current-static-certification:tail
```

5. Review the diff. The expected functional changes are exactly Orientation Hall in City Lite/Visual Tour, W283/W284 source evidence contracts/gates, current unit-suite registration, and documentation/handover updates.
6. Create a reviewable commit or pull request only after the above checks pass. Do not merge to `main` merely because the source gates pass; `main` may trigger a deployment.

## Phase B — owner-only Cloudflare/D1 evidence (no mutation)

After the local branch is reviewed, use:

`HANDOFF/W283_W284_CLOUDFLARE_D1_EVIDENCE_2026-06-25/CODEX_READONLY_CLOUDFLARE_AND_D1_PROMPT.md`

Only an authenticated owner may run its read-only Pages/D1 inventory. Save redacted metadata receipts outside Git. Stop immediately if the task would deploy, bind a Worker, create/migrate/write D1, retrieve a secret, toggle a dashboard setting, inspect row-level referral data, or enable rewards/referrals.

## Phase C — evidence return, not activation

Return a short redacted evidence packet containing:

- Pages deployment metadata and the exact branch/environment checked;
- D1 database name(s) and `sqlite_master` schema metadata only for the candidate referral database;
- confirmation whether the historical schema is absent, incompatible, or a candidate for future counsel/security review;
- Preview rollback rehearsal result with responsible owner;
- no secrets, no raw IDs/rows, no referral token/click/open data, and no claim that a feature is active.

This evidence may inform W284. It does **not** authorise activation.

## W261/W262 / EON Lite rule

Do not add wallet, browser RPC, key/seed, signing, address, balance, transfer, token/coin, price, exchange, payout, claim, or referral-value code. W261 remains blocked by W258; the only permitted future lane is separately approved, backend-proxied, read-only public proof after independent chain, legal, privacy, security, operations and rollback evidence.

## Lighthouse

Collect W282 Lighthouse/Web Vitals only in a normal browser-capable environment. The ChatGPT sandbox result (`NO_NAVSTART`/`chrome-error://chromewebdata/`) is an environment block and must not be recorded as an application score.
