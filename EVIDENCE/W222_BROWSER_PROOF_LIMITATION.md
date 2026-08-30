# W222 Browser Proof Limitation

**Date:** 24 June 2026

The W222 Playwright specification is included and was successfully discovered with:

```bash
npm run qa:w222-my-realm-mvp:browser -- --list
```

An actual system-Chromium run was attempted with:

```bash
CHROMIUM_PATH=/usr/bin/chromium npm run qa:w222-my-realm-mvp:browser
```

Chromium launched, but both test cases stopped before page interaction because this environment blocks navigation to the local Vite server:

```text
page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR
http://localhost:4173/realm-studio
```

This is an environment-policy limitation, not a passed browser proof and not a product runtime assertion. The full source/release candidate is green independently of this blocked browser navigation.

Required next action in a permitted coding/CI environment:

```bash
npx playwright install chromium
npm run qa:w222-my-realm-mvp:browser
```

Or provide a supported Chromium path:

```bash
CHROMIUM_PATH=/path/to/chromium npm run qa:w222-my-realm-mvp:browser
```
