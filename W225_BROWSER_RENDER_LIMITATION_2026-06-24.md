# W225 browser-proof limitation — 24 June 2026

The W225 Playwright browser specification is included at:

```bash
npm run qa:w225-account-catalog-foundations:browser
```

A system Chromium binary was found at `/usr/bin/chromium` and launched through the existing `CHROMIUM_PATH` fallback. Navigation to the local Vite server was blocked by the sandbox administrator policy:

```text
page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR at http://localhost:4173/profile
```

This is an environment restriction, not passing visual/interactivity proof. Run the command in Codex/CI or a permitted local environment after installing/configuring Chromium. The source-level, targeted-unit, lint, build, PWA/site, release-candidate, and production dependency checks are documented separately.
