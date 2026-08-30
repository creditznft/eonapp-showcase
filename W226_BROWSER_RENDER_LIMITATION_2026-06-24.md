# W226 browser-proof limitation — 24 June 2026

The W226 browser test is included at:

```bash
npm run qa:w226-commercial-decision-gate:browser
```

System Chromium launched via `CHROMIUM_PATH=/usr/bin/chromium`, but the sandbox administrator blocked local navigation:

```text
page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR at http://localhost:4173/billing
```

This is not a successful browser run. Execute the same specification in Codex/CI or another permitted local environment after Chromium setup. Source/unit, lint, build, PWA/site, release-candidate, and production dependency evidence are separate.
