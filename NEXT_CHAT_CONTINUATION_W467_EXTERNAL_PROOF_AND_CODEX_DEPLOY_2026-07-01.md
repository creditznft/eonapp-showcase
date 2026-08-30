This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Start here — EONAPP after W467.1

Use the current full source checkpoint. Read in this order:

1. `EONAPP_W466_W467_SOURCE_CHECKPOINT_STATUS_2026-07-01.md`
2. `EONAPP_W459_W462_SOURCE_CHECKPOINT_STATUS_2026-07-01.md`
3. `EONAPP_W450_FINAL_LAUNCH_EXECUTION_PLAN_2026-06-30.md`
4. `CODEX_W466_W467_DEPLOYMENT_AND_EXTERNAL_PROOF_PROMPT_2026-07-01.md`
5. `CODEX_START_HERE_W448_W458A_W452B_2026-06-30.md`

## Exact source state

W449 through W467.1 are source-complete and local-validation ready. This is still not production, device, identity, Sync, merchant, checkout, trial, or release certification.

The remaining work is intentionally evidence- and approval-bound, not a missing feature implementation sprint:

- Cloudflare deployment and exact-origin edge proof;
- browser/device City, PWA/recovery, Activity Center, accessibility, locale and voice proof;
- Google identity lifecycle proof;
- dedicated D1 Sync Basic two-device proof;
- controlled legacy quarantine and second proof;
- Dodo underwriting and complete server-side commercial lifecycle only after approval;
- explicit human GO/NO-GO.

## First permitted operations

```bash
npm ci
npm run verify:w449-w467-source-foundations
npm run security:secret-scan:ci -- --allow-no-history
```

After a reviewed Cloudflare deployment, run the three supplied public/read-only probes from `CODEX_W466_W467_DEPLOYMENT_AND_EXTERNAL_PROOF_PROMPT_2026-07-01.md`.

## Do not do

- Do not activate or add Dodo checkout, trial, SDK, webhook, portal, entitlement service, public prices, or client-side access logic.
- Do not call a deployment, device, Service Worker, D1, Telegram, OAuth, payment, or manual proof “passed” unless real evidence is collected.
- Do not delete legacy files without the quarantine → full revalidation → independent review sequence.
- Do not reintroduce retired commercial/reward/trading/crypto/referral/push/auto-action features.
