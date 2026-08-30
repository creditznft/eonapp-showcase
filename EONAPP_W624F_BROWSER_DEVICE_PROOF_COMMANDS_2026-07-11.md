# W624F Browser and Physical-Device Proof Commands

Date: 2026-07-11

## Real loopback Chromium/WebGL proof

From the extracted W624F source root:

```bash
npm ci
npx playwright install chromium
npm run proof:w624f-command-district-npcs:browser
```

When Playwright Chromium cannot be downloaded, point the runner at an installed Chrome/Chromium executable.

PowerShell:

```powershell
$env:CHROMIUM_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run proof:w624f-command-district-npcs:browser
```

Linux/macOS:

```bash
CHROMIUM_PATH=/usr/bin/google-chrome npm run proof:w624f-command-district-npcs:browser
```

Evidence is written to:

```text
reports/w624f-command-district-npcs/browser-proof/W624F_BROWSER_PROOF.json
```

The fixture checks the four archetypes, nine states, review-first cards, authored-path placement, LOD controls, central sightlines, desktop/mobile emulation and no-autonomy boundaries against the actual Babylon source.

## Current managed-environment result

The Vite loopback fixture started successfully. Playwright then reported that its Chromium executable was not installed. The receipt status is `BLOCKED`; no screenshot, visual pass, physical-device result, crowd-performance result, production-authentication result or production-agent claim is made.

## Physical-device checklist

- Desktop keyboard/mouse: walk all four NPC paths, inspect every card, cancel/stay, confirm routes separately, cycle/reset camera and verify no obstruction.
- Mobile landscape: verify readable cards, touch targets, guide spacing, Wayfinder/Orbit coexistence and LOD controls.
- Portrait fallback: verify the normal honest companion/fallback instead of a crowded forced canvas.
- Controller: verify movement/camera remain responsive while opening, closing and confirming NPC cards.
- Reduced motion: verify guides stay readable without forced patrol animation.
- Weak device: test `balanced`, `lite` and `disabled`; productive navigation must remain unchanged.
- Recovery: trigger Unstuck, background/resume, logout/session expiry, disposal and re-entry.
- Record browser, OS, GPU, resolution, FPS/frame pacing, memory, battery and thermal observations.

## Evidence boundary

A passing loopback proof confirms browser execution against the source. It does not prove production authentication, physical touch/controller quality, sustained performance, final imported character art, voice acting, live AI agents, real jobs or owner visual approval.
