# EONAPP W390–W399 Pre-launch Candidate — Codex Handover

**Date:** 2026-06-28  
**Baseline:** W388A2–W397 release-candidate source, extended with W390/W391/W406/W407/W388B/W389/W398/W399 pre-launch foundations.  
**Status:** source candidate validated locally. This is not a production, OAuth, connector, referral, or deployment certificate.

## Completed in this package

### Current product foundations

- W394 City mobile/touch/HUD pass remains intact.
- W382B/W383B local file viewers remain local-first and bounded.
- W394B multilingual voice language preference foundation remains local-first.
- W400–W404 Creator Engine, asset provenance, lean media lifecycle, Creator Atrium and Forge Bay remain in place.
- W388A.1–A.3 Share Pack, Remix Cards and explicit EONBOT shareable handoff remain local/export/native-share only.
- W395 source implementation is present: Google OAuth Pages Functions, minimal D1 identity migration, Profile acknowledgement/login/logout/delete controls and source readiness gate.
- W396 update/rollback/restore source proof remains intact.
- W397 release audit remains intact.

### New W390–W399 preparation

- **W390A/B Collection + deterministic Vault Reveal:** fixed mission-to-artifact maps only. No grant, randomness, paid opening, transfer, sale, NFT, blockchain, credit, discount, subscription time, storage write or cloud record.
- **W391A/B/C EON Relay:** a disabled pilot contract, disabled endpoints and a separate deferred ledger migration. No invite link, grant, referral claim, database query, cash or promotional benefit.
- **W406/W407 Action Gateway:** disabled proposal/status/execute surface and a separate deferred action/receipt schema. No external effect can be created.
- **W388B/C/D connector architecture:** global platform registry and read-only Workspace surface. No OAuth, token custody, scheduling or direct posting.
- **W389 Forge deployment preparation:** local source preflight only. No GitHub connection, repository, Cloudflare project or deployment.
- **W398/W399 pilot measurement:** local opt-in count-only diagnostics. No remote analytics, content, URL, referral, account or reach record.

## Local validation evidence

Run completed from a clean Node 22 install:

```bash
npm run verify:w399-prelaunch-candidate
```

Results:

- Strict lint: pass.
- Current runnable unit tests: **327/327 pass**.
- W393A/W394/W382B-W383B/W394B/W400-W404/W388A.1-A.3/W395-W397 gates: pass.
- W390/W391 gate: 9/9 pass.
- W406/W407 gate: 7/7 pass.
- W388B/W389 gate: 10/10 pass.
- W398/W399 measurement gate: 5/5 pass.
- W399 locked-feature audit: 11/11 pass.
- Production build: pass.
- Build smoke: pass (24 required outputs).
- Static site audit: pass (43 HTML files; sitemap and precache verified).
- Launch readiness: pass.
- Secret-pattern scan of package source: 0 confirmed credential-pattern files.

## Cloudflare and Google configuration reported by the operator

Treat this as external configuration evidence, not a live OAuth proof. The operator reported:

- Dedicated Production and Preview identity D1 databases exist.
- `EON_IDENTITY_DB` is bound separately in each environment.
- Production has the exact application origin/callback, testing rollout, client ID and masked server secrets.
- Preview rollout is disabled and does not have an active OAuth flow.
- The identity migration was deferred because the old production source did not yet contain it.

Do not inspect, print, export, overwrite or place real secrets in source. The Google OAuth client secret was disclosed in AI setup conversations. **Rotate it before any auth test or production callback deployment**, then update only the encrypted Production Cloudflare secret directly in the dashboard/API.

## Mandatory Codex work before any public claim

Read and follow:

- `docs/W395_CLOUDFLARE_GOOGLE_TEST_PROOF_PROTOCOL_2026-06-28.md`
- `docs/CODEX_W399_PRELAUNCH_CONTINUATION_PROMPT_2026-06-28.md`
- `identity/verify-identity-migration.sql`

Required:

1. Re-run `npm ci` and `npm run verify:w399-prelaunch-candidate`.
2. Confirm no real secret is in the workspace, logs or diff.
3. Rotate the exposed Google client secret and update only `GOOGLE_OAUTH_CLIENT_SECRET` in Production Secrets.
4. Apply only `identity/migrations/0001_eon_identity.sql` to the dedicated Preview then Production identity D1 databases.
5. Verify only the two expected identity table names using `identity/verify-identity-migration.sql`.
6. Deploy source using the established Pages delivery path with the repository-root `functions/` directory included.
7. Keep Production `EON_AUTH_ROLLOUT=testing`; keep Preview `EON_AUTH_ROLLOUT=disabled`.
8. Complete controlled test-user login, session, logout and deletion proof; redact all sensitive values.
9. Complete actual-phone City proof and W396 separate-empty-target recovery drill.
10. Decide remediation for the dependency audit; do not run a blind upgrade.

## Do not activate in this deployment

- No Collection grant, release animation, entitlement, access pass or storage.
- No Relay invitation link, referral reward, discount, coupon, cash, credit, subscription time or anti-abuse decision.
- No platform OAuth, social token, schedule, direct post or creator analytics.
- No GitHub repository connection, Cloudflare project selection or remote deploy from Forge.
- No automatic cloud backup, local-work restoration or cross-device sync.
- No rollout change from Google OAuth `testing` to `public`.

## Dependency audit (separate remediation required)

`npm audit` reports 6 findings: 4 high, 1 moderate, 1 low. Affected packages reported include `wrangler`, `miniflare`, `undici`, `ws`, `js-yaml` and `esbuild`. Assess compatible upgrades and rebuild/validate in a dedicated change; do not run an unreviewed bulk fix.

## Expected Codex return evidence

- Exact source diff and checksum.
- Commands and results.
- D1 table-name-only migration proof.
- Redacted `/api/auth/session`, Profile login/logout/delete proof from an approved Google test user.
- Production deployment ID/URL with no secrets/cookies/rows.
- Real phone and narrow desktop City evidence.
- W396 recovery drill evidence.
- Dependency remediation decision.
- A precise list of all remaining blockers.
