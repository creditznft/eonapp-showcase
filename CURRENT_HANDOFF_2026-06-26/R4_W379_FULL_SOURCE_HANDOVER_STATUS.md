# EONAPP R4 W379 — Full Source Handover Status

## Scope

W379 is a final planning, public-truth and handover-consolidation wave on top
of W378. It normalises the planned solo subscription ladder, fixes INR/USD
parity, removes Team/Scale/Enterprise from the present roadmap, cleans stale
Plans links from active public content, and adds an exact Codex return-evidence
contract.

## What changed

- Added R4-COMM-03 solo pricing and currency-parity contract/gate/test.
- Added internal price books from $4.99/₹499 through $49.99/₹4,999.
- Set annual planning books at approximately ten monthly payments.
- Marked Team, Scale and Enterprise out of the current roadmap.
- Preserved EON Invite as an inactive, single-level, non-cash customer
  promotion pending written provider acceptance and server-backed proof.
- Updated active legacy `Plans` links to route to the honest Billing Status page
  instead of a retired subscription route.
- Updated Terms metadata to describe the current local-first product rather
  than historic wallet/payment/NFT surfaces.
- Added Codex final merge and required return-evidence instructions.

## What remains deliberately not done

- No D1 database/binding/migration has been applied.
- No Cloudflare variable or secret has been set.
- No Google OAuth Test or public consent flow has happened.
- No payment provider is selected, no merchant KYC is completed and no checkout
  or subscription exists.
- No EON Invite coupon, extension or referral benefit is active.
- No W276 Preview/device update-and-rollback evidence has been captured.
- No real browser/device certification or production deployment is claimed.

## Required validation before any deploy decision

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

## Validation completed before packaging

- `npm run qa:r4-current-program` — PASS; W374/W374B, W276, R4 ledger, Apps, Market Intelligence, W377 and W378 gates passed.
- `npm run qa:w216-source-syntax` — PASS.
- `npm run lint -- --max-warnings=0` — PASS; 0 errors, 0 warnings.
- `npm run test:unit` — PASS; 319 tests, 0 failures.
- `npm run build` — PASS; 216 `dist/` files.
- `npm run smoke:build` — PASS.
- `npm run audit:site` — PASS; 42 HTML files scanned.
- `npm run security:secret-scan` — PASS; no potential secrets.
- `npm run launch:readiness` — PASS; commerce remains disabled with no active server handlers.
- `npm audit --omit=dev` — PASS; 0 production dependency vulnerabilities.

These are source/build checks. They do not replace the external launch blockers below.

## Launch blockers

1. Owner-only Cloudflare D1/secret configuration.
2. Controlled Google OAuth Testing proof with no sensitive capture.
3. W276 update-and-rollback local-data restoration proof.
4. Desktop/mobile visual proof for Apps, workrooms, Insights and City return.
5. Written provider acceptance for a narrow productivity-Pack catalogue,
   India/global payout path and EON Invite promotion.
6. Test-mode hosted checkout, signed webhook, personal licence, reversal and
   refund/dispute reconciliation proof before any public payment activation.
