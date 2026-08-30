# W220 Browser Proof Limitation

**Date:** 24 June 2026

The W220 Playwright browser specification was created and successfully discovered with:

```bash
npx playwright test tests/e2e/w220-market-local-generation.spec.ts \
  --config=tests/e2e/playwright.config.ts --project=chromium --list
```

The actual run was attempted. It did not start a browser because the configured Playwright Chromium executable is absent from this environment:

```text
browserType.launch: Executable doesn't exist at
/home/oai/.cache/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell
```

This is an environment dependency limitation, not a passed browser proof and not a product runtime result.

Required next action in a permitted coding/CI environment:

```bash
npx playwright install chromium
npm run qa:w220-market-generation:browser
```

Alternatively configure `CHROMIUM_PATH` to an approved system Chromium executable supported by the Playwright configuration.
