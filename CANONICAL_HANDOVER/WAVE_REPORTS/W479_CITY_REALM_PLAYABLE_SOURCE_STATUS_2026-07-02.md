# W479 — EON City / Realm playable vertical slice: source status

**Date:** 2 July 2026  
**Status:** source foundation complete; browser, visual, performance and device certification remain open.

## What this wave locks

EON City is a local-first visual workspace, not a fake game dashboard or an external-action launcher.

- Canonical entry remains `/eoncity`.
- The direct City route loads the Babylon Command District only after the user intentionally enters it.
- A new first-entry card offers exactly three human choices: **Plan a project**, **Make creator content**, or **Set up Local AI**.
- Each choice is a visible click to a native work surface. It never installs software, starts a model, opens an account connection, uploads media, schedules a post, calls a provider or makes an external request.
- The City retains the existing local work-loop review, Creator Atrium, device/performance checklist, reduced-effects mode, touch/keyboard/controller support and Realm Studio return routes.

## What is not claimed

This source wave does not certify:

- desktop, Android or iOS visuals;
- frame-rate, heat, battery, memory or WebGL stability;
- “AAA” performance or fidelity;
- local image/video generation;
- local voice/dictation;
- connected social accounts, direct posting, scheduling or analytics;
- marketplace, wallet, token, NFT resale, reward or payout behavior.

## Required external proof before W479 exit

1. Direct entry, first-run panel, exit/re-entry and fallback screenshots on desktop, Android and iOS.
2. One landmark-to-native-tool-to-City-return loop with a redacted evidence record.
3. Human art review: readable guide cast, district clarity, original-asset provenance, mobile-safe composition and reduced-motion state.
4. Keyboard, touch, controller, screen-reader/focus, sound-off and no-microphone-default checks.
5. Frame-time, memory, slow-device, low-quality and WebGL recovery observations. No unmeasured quality claim.
6. Realm Studio/local profile/share-return evidence with no account, marketplace, token or value path.

## Local source verification

Run:

```bash
npm run qa:w479-city-realm-playable
npm run verify:w479-city-realm-source-foundation
```

A passing source gate proves contracts and regressions only. It does not close W479.
