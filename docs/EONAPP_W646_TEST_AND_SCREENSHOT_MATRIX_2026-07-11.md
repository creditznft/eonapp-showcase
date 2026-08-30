# W646 test and screenshot matrix

## Permanent source gate

- Clean `npm ci` log.
- `npm run verify:codex-predeploy`: 81/81.
- Maintained unit totals, historical skips and zero failures.
- Secret scan, lint, build, smoke, reachability and performance receipts.
- Candidate manifest/digest verification.

## Public routes

Capture desktop and mobile screenshots plus status/header receipts for `/`, `/create`, `/projects`, `/workspace`, `/forge`, `/automations`, `/preview-studio`, `/eoncity`, `/billing`, `/eon-keys`, `/vault`, `/support`, `/privacy`, `/terms` and offline/update recovery.

## Identity and custody

Capture guest, manual Google sign-in, signed-in shell, sign-out and session-expiry behavior. Never capture the account email, cookies, OAuth query values or DevTools storage tokens.

## EON City

Mandatory screenshots: guest access gate; signed-in first usable frame; Command Room; EONBOT useful-work review; project/travel/resume surface; desktop controls; mobile portrait; mobile landscape; reduced motion; refresh recovery; visible release identity; clean console/network summaries. Include one screen recording and performance receipt.

## Local Creator / ComfyUI

Mandatory screenshots: runtime detected; reviewed 512×512 image workflow; progress; completed image; saved/reopened Library item; project continuation; invalid-input recovery; runtime-off recovery; 4 GB video blocked before side effects; supported-device guidance. Reference video screenshots are mandatory only if video is enabled.

## Billing

Use designated test accounts. Capture plan truth, real checkout URL creation, provider confirmation, signed webhook receipt, redacted D1 lifecycle/entitlement rows, cross-session refresh, portal and receipt links. Cancellation/reactivation/refund/dispute/tier change need prior owner approval artifacts. Capture duplicate/out-of-order/forged rejection evidence without exposing signatures or raw payloads.

## Referral/EONKEY

If active, capture distinct-account attribution, self/tamper rejection, no browser grant, activation-once, retained-paid progression, cap/idempotency, reversal and Vault Reveal migration. If gated, capture the closed gate, truthful copy and proof that sharing cannot grant value.

## Security/recovery

Capture security headers, WAF/rate-limit/request-size outcomes, secret-scan receipt, update persistence, Drive/Capsule recovery where enabled, all four kill-switch rehearsals, previous production deployment identity and non-destructive rollback plan.

## Final live production

Repeat critical screenshots after production promotion. Every image must show or be accompanied by the exact candidate digest and production deployment ID. Final proof requires zero page errors, zero console errors, zero first-party HTTP errors and zero unexplained request failures.
