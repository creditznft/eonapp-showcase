# W624I Browser, Device and Real-Job Proof Commands

## Loopback browser/UI proof

```bash
npm ci
npx playwright install chromium
npm run proof:w624i-genuine-agent-theatre:browser
```

Installed Chrome may be used instead:

```bash
CHROMIUM_PATH="/path/to/chrome" npm run proof:w624i-genuine-agent-theatre:browser
```

Expected receipt:

`reports/w624i-genuine-agent-theatre/browser-proof/W624I_BROWSER_PROOF.json`

## UI checks

- Real Babylon first frame.
- Genuine Agent Theatre visible in Command Room.
- Bounded W435, Local and Direct BYOK fixture receipts visible.
- Private prompt/output/key fixture fields absent.
- Native actions absent before Review.
- Authoritative progress shown only for the native receipt that supplied it.
- Direct BYOK privacy boundary visible and Review does not navigate.
- Desktop and mobile-landscape captures.

## Mandatory live certification still pending

1. Start one real Local job from a native EONAPP surface.
2. Observe queued/preparing/running or waiting state from a real bounded receipt.
3. Complete, fail or cancel it and verify the truthful terminal receipt/result handoff.
4. Start one real Direct BYOK job only after explicit user approval.
5. Verify the provider request occurs only in the native surface and no provider key, prompt or raw response appears in City.
6. Exercise timeout/failure, cancellation, retry and result handoff.

Loopback fixture evidence cannot certify production authentication, a real Local job, a real Direct BYOK provider request, physical controls or owner visual approval.
