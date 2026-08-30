# Current live baseline and source-delta discipline

## Included physical source

The source in this package is the canonical full runnable baseline whose upstream identity is recorded in:

`CANONICAL_HANDOVER/CANONICAL_SOURCE_IDENTITY.md`

It is the full W479-V + W479-P0 source snapshot. It includes City, Voice/Dictate, Ready-to-Post, Local AI onboarding, route/SEO, CSP/release controls, and prior full history already retained in source.

## Reported live main state

Codex reported the live production branch was fast-forwarded to:

`9048e3308c8a302be2460c5098a435381c2aa4d5`

Codex reported this post-snapshot work:

1. W228/W210 compatibility repair:
   - `sw.js`
   - `public/sw.js`
   - `assets/js/vault/eon-vault-lifecycle.js`
2. Test-only City E2E realignment:
   - `tests/e2e/w221-cityworldstate-2d-rpg.spec.ts`
   - `tests/e2e/w224-cityworldstate-3d-parity.spec.ts`
   - `tests/e2e/w228-ceo-visual-proof.spec.ts`
   - `tests/e2e/w231-eon-city-flagship.spec.ts`
   - `tests/e2e/w232-my-realm-return-loop.spec.ts`
   - `tests/e2e/w233-local-ai-3d-device-proof.spec.ts`

The exact post-merge file bytes are not recoverable from this ChatGPT environment. Therefore:

- the next ChatGPT session must not say this archive is byte-identical to live main;
- Codex must fetch the live current main and rebase/apply the W479-R patch onto it;
- the W479-R patch must preserve the compatibility repair and the current City E2E contract;
- no old ZIP may be overlaid onto `main`.

## Live W479 evidence state

Evidence captured on `https://eonapp.ch` against the reported main SHA concluded:

`FIX REQUIRED`

The source of truth for exact observed defects is `CITY_EVIDENCE_COMPACT/CITY_CERTIFICATION_STATUS.md`.
