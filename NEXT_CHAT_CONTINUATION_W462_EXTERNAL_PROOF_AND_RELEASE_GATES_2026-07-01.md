This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Start here — EONAPP after W462.1

Work from this full source package. Read:

1. `EONAPP_W459_W462_SOURCE_CHECKPOINT_STATUS_2026-07-01.md`
2. `CODEX_START_HERE_W448_W458A_W452B_2026-06-30.md`
3. `EONAPP_W450_FINAL_LAUNCH_EXECUTION_PLAN_2026-06-30.md`
4. `CODEX_EXECUTE_W448_W458A_RELEASE_FOUNDATION_PROMPT_2026-06-30.md`

## Exact source status

W459.1, W460.1, W461.1 and W462.1 are source-complete and validated in this package. They are not deployment, device, Telegram, PWA, payment, Sync or release proof.

## First permitted work

1. Copy the clean source to the canonical repository branch. Do not copy `node_modules`, `dist`, `.env*`, local artifacts, browsers, customer data or this ZIP into the repository.
2. Re-run the complete command list in the Start Here document on Node 22.
3. Deploy only through the existing Cloudflare Pages/Workers path after all local source checks pass.
4. After deployment, separately run:

```bash
node scripts/w453a-production-city-edge-proof.mjs \
  --base-url https://eonapp.ch \
  --confirm-network \
  --out artifacts/w453a-production-city-edge-proof.json

node scripts/w458a-sync-basic-status-proof.mjs \
  --origin=https://eonapp.ch \
  --allow-network

node scripts/w461-telegram-research-production-proof.mjs \
  --origin=https://eonapp.ch \
  --allow-network \
  --out artifacts/w461-telegram-research-production-proof.json
```

The three commands are public/read-only proof tools. They do not replace browser/device/manual evidence.

5. Collect the manually required W453/W457/W459/W460/W462 evidence from desktop, Android and iOS. Do not call a missing environment a pass.
6. Begin W451 legacy quarantine only after canonical-branch, build, deployed-edge and first browser/device proof are reviewed. Quarantine first; never automatically delete.

## Do not start yet

- Do not implement W463–W465 billing/checkout/entitlements until Dodo merchant approval and the earlier core evidence matrix are complete.
- Do not enable any retired commercial/reward/trading/crypto/referral/push/auto-action scope.
- Do not claim original final GLB/PBR art, rigged NPCs, service-worker adoption, Telegram success, Sync success or release approval from source tests.

## Reporting format

Always report separately: source validation; Cloudflare deployment; City edge proof; Telegram/Research edge proof; Sync status proof; browser/device evidence; legacy quarantine; merchant/commercial status; blockers; next permitted wave.
