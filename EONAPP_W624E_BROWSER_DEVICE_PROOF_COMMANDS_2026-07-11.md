# W624E Browser and Physical-Device Proof Commands

Date: 2026-07-11

## Real loopback Chromium/WebGL proof

From the extracted W624E source root:

```bash
npm ci
npx playwright install chromium
npm run proof:w624e-eonbot-orbit:browser
```

When Playwright Chromium cannot be downloaded, point the runner at an installed Chrome/Chromium executable.

PowerShell example:

```powershell
$env:CHROMIUM_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run proof:w624e-eonbot-orbit:browser
```

Linux/macOS example:

```bash
CHROMIUM_PATH=/usr/bin/google-chrome npm run proof:w624e-eonbot-orbit:browser
```

The command boots the actual Babylon City through a clearly marked loopback-only authenticated access fixture. It checks the nine-state contract, route-aware non-repeating guidance, central-sightline layout, Help, Show Less, mute, dismiss/restore, desktop/mobile emulation and honest no-autonomy boundaries.

Evidence is written to:

```text
reports/w624e-eonbot-orbit/browser-proof/W624E_BROWSER_PROOF.json
```

## Current managed-environment result

The local Vite fixture started successfully, but Playwright reported that its Chromium executable was not installed. The receipt status is `BLOCKED`; no screenshots or runtime visual pass are claimed.

## Physical-device checklist

Record a separate receipt for each tested device:

- desktop keyboard/mouse: move, rotate camera, cycle/reset camera, inspect every Orbit control and walk the first-sixty-second route;
- mobile touch: verify caption readability, non-obstruction, Help, Show Less, mute, dismiss/restore, portrait fallback and landscape guidance;
- controller: confirm Wayfinder/camera input remains responsive while Orbit captions and controls are present;
- reduced motion: confirm lead/celebrate presentation becomes calm help behavior and no repeated motion is forced;
- optional voice: confirm captions work with voice off, microphone remains off, and speech begins only after an explicit Voice action;
- disposal/re-entry: logout/session-expiry/exit disposes Orbit state, and re-entry starts a fresh local cycle;
- record browser, OS, GPU, resolution, frame pacing, memory, battery and thermal observations.

## Evidence boundary

A passing loopback proof confirms real browser/WebGL execution against the source but does not prove production authentication, physical touch/controller quality, sustained performance, final imported character art, live AI conversation, autonomous work or owner visual approval.
