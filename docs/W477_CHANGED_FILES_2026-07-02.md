# W477 changed-file guide — 2026-07-02

## New source controls

- `config/w477-route-seo-legacy-contract.mjs` — public index/noindex map, canonical URLs, generated sitemap/robots, legacy quarantine policy.
- `scripts/sync-w477-route-seo.mjs` — deterministic metadata/sitemap/robots synchronizer.
- `scripts/w477-route-seo-legacy-gate.mjs` — source gate and redirect-ledger report.
- `tests/unit/w477-route-seo-legacy.test.mjs` — contract and truthful-release-boundary tests.

## Local AI beginner experience

- `config/local-ai-setup-guide-contract.mjs` — goals, reviewed runtime guidance, desktop/mobile policy and no-side-effect facts.
- `assets/js/local-ai/local-ai-setup-guide.js` — goal-first EONBOT setup UI.
- `assets/js/local-ai/local-ai-page.js` / `assets/css/local-ai.css` / `local-ai.html` — page integration and styling.
- `assets/js/local-ai/local-ai-catalog.js` — conservative first private-chat profile.
- `assets/js/chat/*` and `assets/js/utils/eonbot-proactive-suggestions.js` — EONBOT commands/CTAs now open the beginner guide anchor.

## Generated/metadata surface

- Canonical and robots metadata across active HTML documents.
- `sitemap.xml`, `public/sitemap.xml`, `robots.txt`, `public/robots.txt`.
- `package.json`, `scripts/build-production.mjs`, and `scripts/run-current-unit-suite.mjs` wire W477 checks into build/test flow.

## Documentation

- `docs/W477_ROUTE_SEO_LEGACY_AND_LOCAL_AI_SETUP.md`
- `docs/W477_RELEASE_EVIDENCE_PROTOCOL.md`
- `docs/W477_QUALITY_GATE_REPORT_2026-07-02.md`
- `docs/CODEX_W477_SAFE_MERGE_HANDOVER.md`
- Updated master W476–W480 plan and W479-M Creator Media programme.
