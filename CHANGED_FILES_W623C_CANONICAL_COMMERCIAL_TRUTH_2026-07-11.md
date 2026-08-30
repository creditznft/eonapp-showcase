# W623C — Canonical Commercial Truth

Date: 2026-07-11
Status: source-complete and focused-certification green

## CEO decisions frozen in source

1. Dodo Payments is the only EONAPP subscription checkout rail.
2. Final monthly prices are:
   - Plus: USD 4.99
   - Studio: USD 14.99
   - Power: USD 29.99
   - Max: USD 49.90
3. Every paid plan uses the live seven-day trial contract.
4. Referral rewards are EONKEYS only.
5. EONKEYS may unlock selected individual features, temporary limits, workflows, templates, or cosmetics.
6. EONKEYS never award a free subscription tier, whole-plan entitlement, first-month discount, renewal credit, cash value, provider credit, or unlimited AI generation.
7. Creator execution remains local AI or user-owned external-provider credentials. EONAPP does not provide a Cloudflare image/video generation backend and does not receive creator prompts, reference media, provider keys, or generated media.

## Product changes

- Added one canonical commercial catalogue and validation contract.
- Rebuilt the Billing surface around the live server status and Dodo hosted checkout.
- Published the exact four-plan catalogue from the billing status endpoint without exposing product IDs or secrets.
- Updated public About, Billing, EONKEYS, Legal, Privacy, Support, and Terms truth.
- Updated route status so Billing is no longer described as a disabled pre-launch surface.
- Reconciled locked-feature choices with live subscription checkout and proof-gated EONKEY redemption.
- Removed referral wording that implied subscription discounts, renewal rewards, free plans, or whole-tier grants.
- Kept local/BYOK AI boundaries explicit in Chat and runtime policy.
- Updated older commercial and support gates where their pre-Dodo assumptions had been superseded, without weakening their security and non-cash safeguards.

## Focused validation

- `npm run qa:w623c-commercial-truth`: 64/64 checks passed.
- Directly affected unit/regression tests: 53/53 passed.
- Targeted ESLint over all changed JavaScript, gate, and test files: passed with zero warnings/errors.
- `npm run build`: passed.
  - Distribution files: 450
  - Minified files: 288
  - Size saved: 41.08%
  - Distribution SHA-256: `bc9c032979db72d35e8a08df1e151f940d78e090596a204eb20d5621b2baea64`

## Evidence boundary

This wave did not repeat every historical/archived unit gate. W623A remains the last broad maintained-suite checkpoint. W623C used a deliberately narrow certification path to avoid long, stale test loops: the new canonical gate, every directly affected regression contract, targeted lint, and one production build.

## Next wave

W623D — active reachability graph and quarantine of obsolete commercial, tier, reward, NFT, wallet, and economy modules so only the canonical Dodo + EONKEYS architecture can be reached by production routes.
