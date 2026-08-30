This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex Start Here — EONAPP W448 through W462.1 / W450.1 / W452.1–W452.2

**Source checkpoint date:** 1 July 2026  
**Status:** source, test and build checkpoint only. It is not a deployment, real-device certification, merchant approval, checkout activation, Sync launch or release approval.

This is the clean continuation baseline for EONAPP. It includes W459.1/W460.1/W461.1/W462.1 source-only passes. Preserve the locked scope and run the checks below before changing source, deploying, quarantining history or enabling a provider.

## 1. Product boundary to preserve

EONAPP is launching as a **local-first AI workspace** with a premium original **EON Noir City** interface.

Canonical public routes:

- Chat: `/`
- City: `/eoncity`
- Research Lab: `/insights`

Inbound-only compatibility aliases must continue to resolve safely, but must never be emitted by active navigation:

- `/chat` and physical Chat aliases → `/`
- `/trade` and related legacy research aliases → `/insights`
- old Realm, City, map, tour, game and Three.js-style paths → `/eoncity`

Keep the following outside launch scope: ads, ad rewards, offerwalls, Telegram rewards/channel gates, sponsor unlocks, broker/trading execution, financial advice, prediction stakes, crypto/tokens/wallets, marketplace/resale, referral payouts, browser push, automatic social posting, automatic external actions and cloud Vault/secret custody.

## 2. Current facts that must not be regressed

- Production source uses an explicit route-contract HTML allowlist; historical/handoff material must not become a Vite entrypoint.
- Active code emits the canonical Chat root and Research Lab `/insights` routes; legacy aliases are redirect-only.
- EON City initializes core world first, then deferred non-critical City detail. Portrait uses the EON Noir Companion; full City requires explicit Landscape Explore Mode on phone.
- Current City visual kit is original source-controlled procedural geometry only. It is **not** final licensed/authored GLB/glTF/PBR art and must not be presented as such.
- City guide cast has original readable procedural roles on Balanced/Cinematic and intentional Lite silhouettes. It is **not** final rigged/animated NPC production.
- Sync Basic remains local/transport-gated. The supplied status probe is read-only and cannot prove Sync uploads, two-device merge, rollback or D1 configuration.
- W459.1 is a Profile-led redacted rehearsal only: it stores category counts/digest, never reads protected values or key names, and does not make a backup, restore, update, rollback or certification claim.
- W460.1 bridges only a current W435 persisted local receipt into the W434 in-app Activity Center. It never scans/replays history and cannot create push, network, provider, background or external work claims.
- W461.1 is an opt-in public-edge metadata probe for `/telegram`, `/insights` and two compatibility redirects. It has no Telegram session/Bot API/message/channel/reward/order capability and cannot replace live browser or bot evidence.
- W462.1 only consolidates current source gates for canonical-page accessibility, the 11-language/RTL matrix, default-off voice/typed fallback and CSP/supply-chain controls. It is not a screen-reader, device/locale, microphone, edge-header, independent security, privacy/legal or release certification.
- Dodo Payments is the **only** selected future hosted billing candidate. Merchant approval is pending. No checkout, trial, public price, webhook, portal or entitlement service is connected.

## 3. Dodo hard gate — do not activate early

The approved planning envelope is private:

- Tiers: **Free / Plus / Studio / Power / Max**.
- Future trial: one transparent **7-day** trial across paid tiers, after verified customer checkout consent.
- Reference ceiling: no paid tier may exceed **$49.99 USD/month** without a new owner decision and revised contract.
- India renewal timing mentioned during onboarding is unverified merchant guidance. Treat any scheduled mandate, checkout return or pending debit as **not settled**.
- Only a verified provider success event processed by a server-side signed entitlement service may grant or extend access.

Do not add browser-side entitlements, localStorage trials, provider SDKs, webhooks, D1 billing records, public prices, promotional trial copy or checkout buttons until the independent commercial evidence matrix is complete.

Required external proof before Dodo can move beyond planning:

1. Underwriting approval for EONAPP's actual scope.
2. Approved catalogue, pricing, terms, cancellation/refund/support copy and tax review.
3. Hosted checkout success, cancel and retry flows.
4. Verified signed webhook with replay rejection and idempotent entitlement grant/revoke/restore.
5. Trial start, cancel, expiry and renewal matrix.
6. India UPI/Indian-card pending settlement matrix and approved-account confirmation.
7. Failed/held/refunded/disputed/chargeback recovery rules.
8. Customer portal, accessibility, privacy, security and rollback proof.
9. Human commercial GO decision.

## 4. Required local verification before deploy

Use Node 22 and the repository lockfile.

```bash
node --version
npm ci
npm run lint -- --max-warnings=0
npm run qa:w449-production-cleanroom
npm run qa:w450-dodo-approval-readiness
npm run qa:w450a-dodo-catalogue-envelope
npm run qa:w451-legacy-source-inventory
npm run qa:w451-cleanup-execution-handoff
npm run qa:w452-app-shell-quality
npm run qa:w452a-active-canonical-destination
npm run qa:w452b-production-route-emission-cleanup
npm run qa:w453-city-performance-observation
npm run qa:w453a-production-city-edge-proof
npm run qa:w455a-noir-world-composition
npm run qa:w456a-noir-readable-guide-cast
npm run qa:w457a-city-mobile-share-proof
npm run qa:w458a-sync-basic-status-proof
npm run qa:w459-pwa-recovery-rehearsal
npm run qa:w460-eonbot-activity-receipts
npm run qa:w461-telegram-research-proof
npm run qa:w462-trust-accessibility-audit
npm run test:unit
npm run build
node scripts/w449-production-cleanroom-gate.mjs --require-dist
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run security:secret-scan:ci -- --allow-no-history
```

The W448–W458.1 baseline previously recorded 501/501 current runnable-product tests. W459.1 through W462.1 extend the deterministic source gates and focused tests; the W462.1 checkpoint recorded 514/514 passing only in this extracted source workspace. Re-run the complete suite from the canonical repository before relying on that count. ESLint, build, smoke, site audit, launch-readiness and secret scan remain mandatory.

## 5. Deploy order and mandatory production proof

Deploy through the existing Cloudflare Pages/Workers process only after the command set above is green. Do not deploy manually from a copied `dist/` directory.

Immediately after deployment:

```bash
node scripts/w453a-production-city-edge-proof.mjs \
  --base-url https://eonapp.ch \
  --confirm-network \
  --out artifacts/w453a-production-city-edge-proof.json
```

This tests 33 public edge cases, including 27 retired City aliases, supported `mission=arrival` query preservation and Service Worker delivery markers. It records redirect/document metadata and hashes only; it does not persist page bodies, credentials, cookies, prompts or user data.

Then perform actual browser/device review:

1. Load `/`, `/eoncity` and `/insights` as a guest and after owner-confirmed Google identity.
2. Verify address bar truth after every relevant legacy alias.
3. Test stale service-worker recovery from an older build before claiming cache proof.
4. Use the local Device Lab/Validation Lab evidence export on desktop, Android and iOS. Record first frame, p95/p99, estimated FPS, context loss, console/WebGL warnings, touch, rotation, safe-area, thermal/battery and visual acceptance manually.
5. Confirm portrait Companion and explicit Landscape Explore behavior on a real phone.
6. Confirm City stations reach real app modules only after the existing user confirmation boundary; do not convert in-world panels into fake job/output claims.
7. Capture fixed City review viewpoints for original-art sign-off. Do not claim final art until licensed/authored asset provenance, LOD and texture-budget proof exists.

## 6. Sync Basic: separate post-deploy status check only

The supplied check is deliberately low-risk and unauthenticated. It does not upload, delete, merge, sign in, write storage or establish a live Sync release.

```bash
node scripts/w458a-sync-basic-status-proof.mjs \
  --origin=https://eonapp.ch \
  --allow-network
```

Expected honest states are `not-configured` or `sign-in-required`. A response other than the approved public status must fail closed. Do not declare Sync Basic launched until D1 binding, consent, Device A/B upload/merge/tombstone, browser-clear, restore and rollback proof have passed.

## 7. Legacy cleanup: quarantine first, delete only after a second proof

The inventory currently classifies active runtime/route files, compatibility redirects, tooling, tests, historical material and root-level review candidates. Historical files are not active, but this source snapshot is not a substitute for canonical Git history.

Before any cleanup:

1. Confirm canonical branch and source revision.
2. Run `npm ci`, active-import fence, W449 cleanroom, full unit suite, build and `dist` cleanroom.
3. Generate the W451.1 manifest with `npm run qa:w451-cleanup-execution-handoff`.
4. Preserve active runtime, current route documents, compatibility redirects, production assets, scripts and tests.
5. Quarantine eligible historical roots only after the first proof is green.
6. Re-run the complete validation set and require human review before any deletion.

Do not automate deletion or move history into a folder served by the build. No legacy cleanup step may alter active routes, re-enable a retired value system or weaken the production cleanroom.

## 8. Remaining launch gates, in order

1. **W453–W458:** real City edge/device/visual/mobility/share and Sync Basic proof.
2. **City art/world/NPC production:** original licensed/authored landmarks, materials, props, vertical slice, NPC rigs/animation/LOD and human visual approval.
3. **W459:** source rehearsal is present; complete real PWA install, update, stale-service-worker adoption, rollback and protected local-data survival proof.
4. **W460:** source bridge is present; complete manual happy/error/cancel/retry UI proof and verify saved history never becomes a fresh Activity Center alert.
5. **W461:** source probe is present; deploy and collect Telegram onboarding/help/updates deep-link plus Research Lab production crawl evidence, with no reward surface.
6. **W462:** source audit is present; collect translation/content, non-English layout, voice-permission/typed fallback, keyboard/screen-reader/error-state, dependency/CSP/privacy evidence.
7. **W463–W465:** merchant-approved Dodo hosted checkout and server-side entitlement lifecycle, only after all core product gates.
8. **W466–W467:** production evidence matrix, rollback rehearsal and explicit human GO/NO-GO.

The detailed locked roadmap is in `EONAPP_W450_FINAL_LAUNCH_EXECUTION_PLAN_2026-06-30.md`.

## 9. Handoff boundaries

- Never add `.env`, Dodo credentials, Google OAuth client secrets, webhook secrets, D1 tokens, personal data, browser storage, screenshots containing private data or generated `dist/` output to a source commit or share bundle.
- Never claim deployment, approval, payment, trial, device performance, art completion or release certification from this source bundle alone.
- When reporting back, separate: **source validation**, **Cloudflare deployment proof**, **browser/device proof**, **merchant lifecycle proof**, and **release approval**.
