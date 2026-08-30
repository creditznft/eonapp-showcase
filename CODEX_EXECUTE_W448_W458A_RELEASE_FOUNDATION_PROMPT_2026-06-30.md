This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex execution prompt — EONAPP W448–W462.1 source foundation

Work from this source package as the baseline. Read `CODEX_START_HERE_W448_W458A_W452B_2026-06-30.md` and `EONAPP_W450_FINAL_LAUNCH_EXECUTION_PLAN_2026-06-30.md` before making changes. W459.1/W460.1/W461.1/W462.1 are included as source-only safety passes, not deployment or device proof.

## Your task

1. Confirm the canonical repository branch and copy this source into it without introducing `node_modules`, `dist`, local artifacts, secrets or historical bundle archives.
2. Run the full verification command set in the Start Here document on Node 22. Report each command outcome; do not treat a missing browser/device environment as a passing result.
3. If source validation is green, deploy through the existing Cloudflare Pages/Workers release path.
4. After deployment, run the W453.1 City edge proof against the intended HTTPS origin and save only its safe JSON metadata report.
5. Run the W458.1 Sync Basic status probe only as its supplied unauthenticated, read-only check. Do not add D1 writes, cookies, record upload, merge or delete behavior.
6. Keep W459.1 as a manual redacted rehearsal: do not turn it into automatic backup, restore, update, rollback, raw-storage scanning or recovery certification.
7. Keep W460.1 as a current local receipt bridge: do not replay job history, add push/device delivery, provider calls, background work, or external completion claims.
8. Run W461.1 only after deployment and only against the intended HTTPS origin. Keep it as anonymous public metadata proof; do not add Telegram Bot API, session, channel, message, reward or order actions.
9. Keep W462.1 as a source audit. Obtain browser/device/locale, screen-reader, microphone, edge-header, independent security and privacy/legal proof separately; do not call the audit a release certification.
10. Perform manual browser/device review separately. Report it as pending unless actual evidence is collected.
11. Start the W451 legacy cleanup only after the canonical branch and first complete proof set are green. Quarantine eligible historical files first; do not delete or move anything automatically. Rerun the full proof set and obtain human review before any deletion.

## Non-negotiable constraints

- Keep `/` as Chat, `/eoncity` as City and `/insights` as Research Lab. Old `/chat`, `/trade`, Realm, map, tour, game and Three.js-style links remain inbound compatibility only.
- Do not restore legacy app navigation or allow historical HTML/documents to become production entrypoints.
- Do not claim final EON Noir GLB/PBR art, rigged NPCs, real device performance, service-worker adoption or visual approval from source tests.
- Do not enable ads, rewards, Telegram reward mechanics, broker/trading execution, financial advice, crypto/wallets/tokens, marketplace/resale, referral payouts, browser push, social auto-posting or autonomous external actions.
- Dodo Payments remains approval-pending. Do not add checkout, public prices, trial marketing, a provider SDK, webhooks, customer portal, server entitlement, localStorage trial or client-side access grant.
- Do not turn W459.1/W460.1 source states into device, PWA, notification-delivery, agent, external-action or release claims without independent evidence.
- Do not turn W461.1/W462.1 source states into Telegram, browser/device, accessibility, locale, voice-permission, edge-security, privacy/legal or release claims without independent evidence.
- Any future paid access must wait for merchant approval, server-side verified provider success events, replay-safe webhooks and the full commercial proof matrix.

## Deliver back

Return a compact evidence table with separate rows for:

- source validation;
- Cloudflare deployment;
- City edge proof;
- browser/device proof;
- Sync Basic status proof;
- legacy quarantine proof;
- Dodo merchant/commercial status;
- explicit blockers and the next permitted wave.

Never merge these categories into one “launch passed” claim.
