# W282 / W259 / W266 / W276 — external evidence protocol

**Purpose:** obtain real performance, visual, interaction, and data-survival evidence outside the sandbox.  
**Status:** not collected. This protocol does not approve beta, deployment, referral, rewards, wallet, chain, or final certification.

## Rules

- Use the exact source freeze and record its SHA-256 before testing.
- Run a fresh `npm ci` on the evidence machine.
- Keep all generated reports, screenshots, videos, and device data out of the source archive and Git unless explicitly redacted and approved.
- Never use a production user's data. Use a disposable browser profile and harmless local fixtures.
- Record `PASS`, `FAIL`, or `BLOCKED`; never replace missing evidence with a score or summary claim.

## W282 — normal-browser Lighthouse

Run on a normal desktop/browser environment with a Chrome-compatible browser that can navigate localhost or a controlled Preview deployment:

```bash
npm ci
npm run build
npm run lighthouse:desktop
npm run lighthouse:mobile
```

Record the raw LHCI output and a small redacted manifest containing: source hash, route list, device profile, browser version, date/time, each valid score, and any blocked route. Do not claim a score when Lighthouse reports navigation or browser-policy failure.

## W259 / W266 — visual, touch, accessibility, and device proof

Run the source guard first:

```bash
npm run qa:w259-city-preview-evidence
npm run qa:w266-visual-proof-lab
npm run qa:w266-visual-proof-lab:capture
```

Then collect a manually observed matrix for:

1. Desktop Chrome: City Lite, Three.js Visual Tour, Babylon City Play, an actual local mission/agent lifecycle cue, and `Manage in Chat`.
2. Mid-range Android: City Lite, touch controls, City Play entry/fallback, orientation guidance, and reduced motion.
3. Low-end Android: City Lite and enforced or chosen fallback; do not force Babylon success.
4. Keyboard-only desktop: focus order, dialogs, Interact, route review, pause/exit, and no auto-navigation.
5. Reduced-motion mode: no reliance on pulsing or huddle animation for meaning.
6. Optional controller: movement only; no automatic action confirmation.

Capture redacted screenshots/video only after confirming no prompts, results, keys, provider accounts, Vault contents, wallet data, or referral records are visible.

## W276 — observed update/restore proof

Run the source guard:

```bash
npm run qa:w276-data-survival-reaudit
```

Then complete a controlled browser/PWA drill with a disposable profile:

1. Create harmless local state: a non-sensitive display preference, City preference, and a local project title without private content.
2. Record a local before-state fingerprint (keys and redacted metadata only; never values/secrets).
3. Load the candidate build on the **same browser origin** and perform a normal reload/update path.
4. Verify protected state still exists, no unexpected wipe occurs, and City Lite fallback still opens.
5. If an installed PWA is in scope, test its update prompt/apply flow only with the test profile.
6. Record observed `PASS`, `FAIL`, or `BLOCKED`; a failed restore is a release blocker.

## Evidence exit criteria

All three lanes need raw artifacts plus a reviewer conclusion. A source gate, Playwright screenshot, or Lighthouse report alone cannot substitute for the complete device/accessibility/restore review.
