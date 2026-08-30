# W624H Browser and Device Proof Commands

## Automated loopback browser proof

```bash
npm ci
npx playwright install chromium
npm run proof:w624h-truthful-command-center:browser
```

Installed Chrome may be used instead:

```bash
CHROMIUM_PATH="/path/to/chrome" npm run proof:w624h-truthful-command-center:browser
```

Expected receipt:

`reports/w624h-truthful-command-center/browser-proof/W624H_BROWSER_PROOF.json`

## Required review

- Real Babylon first frame.
- Six status cards visible.
- Source, authority, observed time and freshness visible.
- No seeded private project/job/billing fields visible.
- Route absent before Review and present only after Review.
- Billing refresh comes from mocked/server status, never LocalStorage.
- Desktop and mobile-landscape screenshots.

## Evidence boundary

Loopback fixture evidence is not production authentication, production billing, physical touch/controller proof or owner visual approval. Keep status `BLOCKED` when a browser cannot launch.
