# EONAPP W217 Phase 1 Change Log — Canonical Routes and Legacy Retirement

**Date:** 24 June 2026  
**Scope:** Phase 1 only. No new monetisation, reward, token, payment, payout, or user-commerce capability was enabled.

## Added

- `config/route-contract.mjs`: one source of truth for canonical, informational, compatibility, retired, and fallback routes.
- `scripts/sync-route-contract.mjs`: generates root and public Cloudflare redirect files.
- `scripts/verify-route-contract.mjs`: checks generated files, duplicate origins, and contract validity.
- `tests/unit/w217-route-contract.test.mjs`: contract, redirect, and Vite rewrite coverage.
- `scripts/gpt55-route-truth-device-audit.mjs`: current route/static-link/fragment audit with browser-proof requirements.
- `docs/W217_PHASE1_CANONICAL_ROUTE_CONTRACT.md`: route contract and operator guidance.

## Changed

- Root and `public/_redirects` are generated and conflict-free.
- Vite clean-route rewriting uses the route contract.
- Static-site audit uses the contract map, including clean informational/trust routes.
- Build synchronizes redirects before asset synchronization and validates the new canonical build set.
- The service worker moved to `v46` with current Chat-first canonical routes and no-store treatment for disabled reward surfaces.
- Sitemap uses current clean canonical routes.
- Primary shell no longer exposes Rewards navigation.
- Legacy pages no longer link to nonexistent route fragments; broken fragment count is zero.
- Stale historic gates now verify contract behavior rather than obsolete duplicate redirect/Vite text.

## Data safety

No persistence keys, local data migrations, backup formats, Vault logic, IndexedDB handling, or user data clear behavior were modified. The existing Vault boundary/backup suite remains green.

## Verification

- Full `npm run qa:w216-release-candidate`: PASS.
- `npm run qa:w217-route-contract`: PASS; 117 route rows; no duplicate origin.
- `npm run gpt55:route-truth-device-audit`: PASS; 14 canonical primary routes, 84 retired aliases, zero broken internal links/fragments.
- `npm run lint -- --max-warnings=0`: PASS.
- `npm run build`, `npm run smoke:build`, `npm run audit:site`, `npm run qa:pwa-install`: PASS.
- `npm audit --omit=dev`: 0 production vulnerabilities.

## Still required

- Browser interaction and redirect-loop proof in a permitted local/CI/Cloudflare Preview environment.
- Phase 2 implementation: Chat-first shell, desktop collapse, mobile drawer, semantic themes, and real local chat thread behavior.
