# W223 browser proof limitation

## Attempt

```bash
CHROMIUM_PATH=/usr/bin/chromium \
  npx playwright test tests/e2e/w223-invite-share-center.spec.ts \
  --config=tests/e2e/playwright.config.ts --project=chromium --reporter=line
```

## Result

Chromium launched through the configured system-binary fallback. Navigation to the local Vite preview then failed before application code loaded:

```text
page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR at http://localhost:4173/chat
page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR at http://localhost:4173/profile
```

The W223 browser test is discoverable and lists two tests. It must be run in Codex/CI or another permitted local environment after setting `CHROMIUM_PATH` when Playwright browser binaries are omitted.

This is not recorded as passing browser interaction evidence.
