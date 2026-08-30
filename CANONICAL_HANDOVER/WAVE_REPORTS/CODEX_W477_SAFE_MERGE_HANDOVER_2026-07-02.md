# Codex handover — W477 canonical routes, SEO, legacy ledger and Local AI beginner setup

## Scope

Merge this package as the continuation from W476-B. It implements W477 source controls and a small Local Text AI onboarding bridge required for a non-technical EONBOT experience.

## Do not change these truth boundaries

- Do not claim Local Image, Image-to-Video, Text-to-Video or other Local Creator Media is working.
- Do not replace explicit user taps with automatic install, model download, runtime scan, terminal execution, endpoint probing or cloud fallback.
- Do not allow arbitrary LAN/private endpoints. Preserve the existing reviewed loopback runtime policy.
- Do not remove legacy documents or tighten broad CSP values because of static search alone.
- Do not start Dodo/payment work.

## Run before merge

```bash
npm ci
npm run qa:w477-route-seo-legacy
npm run lint -- --max-warnings=0
npm run release:verify
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

## Deploy and then capture the evidence

Follow `docs/W477_RELEASE_EVIDENCE_PROTOCOL.md`. W476-B/W477 live proof requires a real reviewed browser/device environment; no source script can substitute for it.

## Key files

- `config/w477-route-seo-legacy-contract.mjs`
- `scripts/sync-w477-route-seo.mjs`
- `scripts/w477-route-seo-legacy-gate.mjs`
- `config/local-ai-setup-guide-contract.mjs`
- `assets/js/local-ai/local-ai-setup-guide.js`
- `assets/js/local-ai/local-ai-page.js`
- `docs/W477_ROUTE_SEO_LEGACY_AND_LOCAL_AI_SETUP.md`
