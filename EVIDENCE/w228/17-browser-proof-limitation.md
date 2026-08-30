# W228 Browser Proof Limitation — 24 June 2026

Command attempted:

```bash
CHROMIUM_PATH=/usr/bin/chromium npm run qa:w228-ceo-visual-proof:browser
```

Result: Chromium launched and Playwright discovered the W228 desktop and mobile City/Share Center visual specifications. Navigation to the locally served EONAPP app was blocked by the execution environment:

```text
page.goto: net::ERR_BLOCKED_BY_ADMINISTRATOR at http://localhost:4173/eoncity
```

This is not a passing visual or device proof. It is not evidence of an application failure either. Run the included browser matrix in Codex/CI against a permitted Cloudflare Preview URL and save screenshots, console logs, network failures, PWA update evidence, and mobile viewport results before production approval.
