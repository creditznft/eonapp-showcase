# EONAPP R4 W378 — Full Source Handover Status

## Scope

W378 is a release-safety and operator-handover wave on top of W377. It closes
the CI/Preview/Production gate gap and creates current, source-honest
Cloudflare Google identity and Codex documents.

## What changed

- Added the W378 Cloudflare/Codex readiness contract, source gate and unit test.
- Added `npm run qa:r4-current-program` as the canonical current source gate.
- Updated GitHub CI, Preview and Production deploy workflows to run that gate
  before test/build/deploy work.
- Added an exact manual Cloudflare D1, variables/secrets and controlled Google
  OAuth Testing checklist.
- Added a safe Cloudflare AI infrastructure prompt that never requests secrets.
- Added a complete Codex merge/Preview/Production handover.

## What is still deliberately not done

- No D1 database has been created or bound by this source.
- No Cloudflare variable or secret has been set.
- No Google Login test, Preview OAuth or public OAuth rollout has happened.
- No payment provider, payment, subscription, paid Pack, entitlement, EON
  Invite benefit, referral promotion, ad, CPA or payout is activated.
- No W276 update-and-rollback evidence has been collected.

## Validation required before a new handover

```text
npm run qa:r4-current-program
npm run lint -- --max-warnings=0
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run security:secret-scan
npm run launch:readiness
```

## External blockers

1. Manual Cloudflare D1 binding and secret configuration.
2. Controlled Google OAuth Testing proof with no secret/token/cookie capture.
3. W276 update-and-rollback local-data restoration proof.
4. Browser/mobile Apps and City certification.
5. Provider/product/promotion approval and later payment lifecycle proof.
