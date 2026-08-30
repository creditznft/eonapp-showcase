# W438–W444 External Evidence Runbook

This checklist is deliberately separate from source verification. Do not mark a row complete because a static gate passes.

## 1. W432 performance and City evidence

1. Run the prepared 18-report W432 matrix on a supported Chrome environment where navigation does not resolve to `chrome-error://`.
2. Retain raw HTML/JSON reports, device/network profile, browser version, deployed commit, timestamp, and screenshot for each route.
3. Run real City entry and safe-mode recovery on desktop, Android, and iOS targets. Record first rendered frame, controls, context loss/recovery behavior, and a 30-minute stability session.
4. Verify no prompt, raw project data, keys, or account data appears in the City.

## 2. W433 Sync Basic

1. Keep Sync hidden/inactive until a dedicated transport and account-index design is deployed.
2. Verify device A/B, offline edits, conflict copy behavior, deletion propagation, sign-out/sign-in, browser-clear recovery, and update/rollback.
3. Review encryption and recovery separately before any Vault Sync claim.

## 3. W434 Notifications

1. Validate the in-app Activity Center on actual browsers.
2. Only after consent/endpoint design exists, test permission request timing, device subscription, delivery, unsubscribe, quiet hours, dedupe, TTL, error handling, and category preferences.
3. Do not send promotional notifications by default.

## 4. W438/W439 City privacy and work integrity

1. Manually create a private project district and inspect the City on target devices.
2. Confirm only City-safe labels and approved cards are visible; verify project references, seeds, prompts, files, account names, credentials, and raw output are absent.
3. Drive W435 receipt states through City and confirm AgentSignal bubbles match only real local records, never decorative fake work.

## 5. W440 PWA installation/update/rollback

1. Test install guidance and actual installation on supported desktop/browser and Android/iOS target paths.
2. Capture real before/after W145 data manifests around an update.
3. Test a rollback with preserved local state and a manual recovery path.
4. Retain screenshots and redacted logs; do not upload secrets or raw storage values.

## 6. W441 Action Gateway

1. Do not enable browser execution.
2. Before any pilot, implement server action records, per-action scope, expiry, nonce/idempotency, cancellation, audit receipt, and provider-specific OAuth.
3. Test failed, expired, cancelled, duplicate, and permission-revoked actions before one narrow external action is approved.

## 7. W442 Connectors and collaboration

1. Create a platform-by-platform legal/policy, OAuth, token custody, revoke, and support design.
2. Test consent, expiry, revoke, error, and per-action approval before connection.
3. Do not use local consent drafts as proof of external account access or collaboration permission.

## 8. W443 commercial systems

1. Decide each plane separately: ads, Telegram, rewards, payments, referrals, marketplace/trading.
2. Obtain policy, consent, privacy, support/reversal, abuse-control, provider, and webhook/postback proof appropriate to that plane.
3. Keep all user-facing activation controls hidden or disabled until that plane clears independent release review.

## 9. W444 human release board

A human release authority reviews the evidence set and decides whether to approve a scoped deployment. The source board may show evidence submitted; it must never self-certify.
