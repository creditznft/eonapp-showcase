# EONAPP W400C + W391D Continuation Handover

Date: 2026-06-28  
Baseline: `EONAPP_W399_POSTDEPLOY_FULL_SOURCE_HANDOVER_2026-06-28.zip`  
Status: source-validated continuation. No production deployment has been performed from this package.

## What changed

### W400C — visible, guest-first Google identity entry

- Added an Account/Sign-in action to the top-right EONBOT chat header.
- It becomes **Sign in** only after `/api/auth/session` reports a configured, unsigned-in identity service.
- It always routes to the Profile account section first; it never starts OAuth in the header.
- Profile still requires the user to acknowledge that Google Login is not a backup before the existing `Continue with Google` action can start OAuth.
- Profile now reflects whether identity is unavailable, testing-ready, or signed in without exposing identity data.

### W391D — dedicated EON Relay tracking preparation

- Added a new server helper: `functions/_shared/eon-relay.js`.
- Added disabled-by-default server endpoints:
  - `POST /api/relay/invites/create`
  - `POST /api/relay/attribution/capture`
  - `GET /api/relay/status`
  - existing `POST /api/relay/claim` remains hard-disabled.
- Updated `relay/migrations/0001_eon_relay_pilot.sql` with:
  - an explicit disabled program state,
  - opaque invite-code HMAC storage only,
  - one direct attribution per invitee,
  - no raw invite code, email, IP address, device fingerprint, cookie, user-agent, chat, project, payment, or reward data.
- Added the exact operator requirements for any future activation:
  - dedicated `EON_RELAY_DB` binding;
  - `EON_RELAY_TOKEN_PEPPER` encrypted secret;
  - `EON_RELAY_ROLLOUT=tracking` or `pilot` only after approval;
  - matching `eon_relay_program_state` database kill switch;
  - authenticated inviter and invitee;
  - same-origin explicit POST actions.

## What did not change

- The removed stale `EONAPP_REFERRALS_DB` and `REFERRALS_DB` bindings are **not** recreated or reused.
- No invite URL, attribution, reward, Collection item, grant, subscription time, credit, payment, OAuth connector, social post, action gateway execution, GitHub connection, or Cloudflare deployment is active.
- Guest mode stays available.
- No Google secret, session material, provider key, customer data, or D1 row is present in this source or documentation.

## Validation evidence

Passed in this workspace:

```bash
npm run lint -- --max-warnings=0
npm run test:unit                  # 331 / 331
npm run qa:w390-w391-collection-relay
npm run qa:w395-google-identity-d1-readiness
npm run qa:w397-release-audit
npm run qa:w399-prelaunch-audit
npm run qa:w400c-google-identity-entry
npm run qa:w391d-relay-tracking-prep
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

`npm run verify:w400c-w391d-prelaunch` chains the original W399 composite plus both new gates. It is valid but long-running; execute it in Codex/CI without an artificial short tool timeout.

## Required live proof before activation

1. Rotate the Google OAuth client secret because it was exposed during setup conversations, then update only the Production Cloudflare encrypted secret.
2. Complete redacted Production test-user Google login, logout, and deletion proof.
3. Complete the W276 update → rollback → local-data restoration drill.
4. Capture actual desktop and mobile screenshots, including the new header entry and Profile acknowledgement.
5. Approve the Relay policy, support/reversal process, abuse review, and kill-switch ownership.

## Relay infrastructure — do not do yet

After the above proof and approval, create separate databases such as:

- `eonapp-relay-prod`
- `eonapp-relay-preview`

Bind as `EON_RELAY_DB`; do not use any legacy referral database/binding.

Add `EON_RELAY_TOKEN_PEPPER` as an encrypted secret. Keep `EON_RELAY_ROLLOUT=disabled` initially in both environments. Apply only:

```bash
npx wrangler d1 execute eonapp-relay-preview --remote --file=relay/migrations/0001_eon_relay_pilot.sql
npx wrangler d1 execute eonapp-relay-prod --remote --file=relay/migrations/0001_eon_relay_pilot.sql
```

The migration seeds a database state of `disabled`. Do not set it to `tracking` or set the environment rollout to `tracking` until policy and live proof are approved. Even then, `POST /api/relay/claim` must remain disabled until a separately reviewed reward wave.

## Remaining roadmap after this package

1. Real-browser Google identity / City / backup proof.
2. W391D Relay tracking operator proof, then limited tracking pilot only.
3. W390 Collection display and deterministic Vault Reveal proof; no transfer or sale.
4. W406/W407 approved Action Gateway execution proof.
5. W388C/D platform-specific OAuth app reviews and per-post publishing proof.
6. W389 GitHub/Cloudflare user-owned project deployment proof.
7. W398/W399 creator/remix pilot measurement review.
8. Payment provider approval and a separate subscription/entitlement integration wave.
