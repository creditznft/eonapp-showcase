# Codex — EONAPP W399 Pre-launch Continuation

Use the latest source bundle as the only baseline. Do not merge old archive code, legacy commerce flows, browser-managed social publishing or referral rewards.

## Phase 1 — source certification

```bash
npm ci
npm run verify:w399-prelaunch-candidate
```

Expected: lint, source gates, current runnable tests, build, smoke, static audit and launch-readiness all pass. Do not use `npm audit fix` blindly. Record the 6 dependency findings for a dedicated remediation change.

## Phase 2 — Google/D1 controlled test proof

Read `docs/W395_CLOUDFLARE_GOOGLE_TEST_PROOF_PROTOCOL_2026-06-28.md` before deployment.

Important: the previous Google OAuth client secret was exposed to AI conversations during setup. Rotate it in Google Cloud **before** enabling/calling the production callback, then update the masked Production Cloudflare Secret directly. Never add a secret to source, `.env.local`, logs, test fixtures, Git history, or this handover.

Apply only `identity/migrations/0001_eon_identity.sql` to dedicated `eonapp-identity-preview` and `eonapp-identity-prod`. Verify with `identity/verify-identity-migration.sql`. Never use legacy referral/payment/reward databases.

Deploy Pages source with `functions/` included. Keep Production `EON_AUTH_ROLLOUT=testing` and Preview `EON_AUTH_ROLLOUT=disabled`. Run the controlled test-user sequence in the W395 proof protocol. Return redacted proof only.

## Phase 3 — deliberately locked future foundations

These are source-only preparation and must remain disabled until their own launch gates:

- W390A/B Collection and deterministic Vault Reveal: no grants, chance, paid openings, transfer, sale, crypto/NFT, storage or cloud record.
- W391A/B/C EON Relay: no invitation links, referral rewards, cash, discount, credits, subscription time, database mutation or anti-abuse claim.
- W406/W407 Action Gateway: no external action, approval execution, connector call, GitHub call or deploy.
- W388B/C/D: no platform OAuth, stored social token, direct post, scheduler or analytics claim.
- W389: no GitHub OAuth/repository creation/Cloudflare deploy; local source preflight only.
- W398/W399: local opt-in count-only diagnostics only; no remote pilot analytics.

## Next genuine implementation gates after controlled proof

1. W390 Collection visual pilot and deterministic server-reviewed grant design.
2. W391 legal/support/anti-abuse/reversal packet, then small direct-referral pilot only.
3. W406 Action Gateway database, user approval, idempotency and receipt proof.
4. W388B/C/D one connector at a time with official platform approval, server-side token custody, explicit per-post review/cancel/revoke and live proof.
5. W389 GitHub/Cloudflare integration only with account identity, repo/project selection, source scan and final deployment confirmation.
6. W398/W399 measure a consented creator/remix pilot with no content/URL/referral/account recording.

## Required return package

Return: source diff, commands/results, package checksum, deployed version/ID, D1 table-name proof, redacted login/logout/deletion proof, real-device City evidence, dependency decision, and an exact list of anything not proved.
