# W624D Browser and Physical-Device Proof Commands

Date: 2026-07-11

## Real loopback Chromium/WebGL proof

From the extracted W624D source root:

```bash
npm ci
npx playwright install chromium
npm run proof:w624d-wayfinder-camera:browser
```

When Playwright Chromium is unavailable, point the runner at an installed browser:

```powershell
$env:CHROMIUM_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run proof:w624d-wayfinder-camera:browser
```

The command boots the actual Babylon City through a clearly marked loopback-only authenticated access fixture. It verifies the nine-state/five-camera contract, visible camera cycle and Follow reset, four local pose controls, keyboard `C`/`R`, Unstuck state preservation and desktop/mobile-emulated runtime captures.

Evidence is written to:

```text
reports/w624d-wayfinder-camera/browser-proof/W624D_BROWSER_PROOF.json
```

## Physical-device checklist

Record a separate receipt for each tested device:

- keyboard/mouse: movement, camera drag, `C`, `R`, interaction and Unstuck;
- touch: visible movement control, visible context action, camera controls, portrait fallback and landscape guidance;
- controller: left stick/D-pad, south-button review action, right-shoulder camera cycle and left-shoulder Follow reset;
- walk the W624C first-sixty-second route and check clipping at every landmark approach;
- recover from each certified collision region using reset and nearest-safe-point Unstuck;
- background/resume and clean City exit/re-entry;
- note browser, OS, GPU, resolution, frame pacing, memory, battery and thermal observations.

## Evidence boundary

A passing loopback proof confirms real browser/WebGL execution against the source but does not prove production Google authentication, physical touch/controller behavior, sustained performance, thermal quality or owner visual approval. Those require separate honest receipts.
