# W624C Browser and Device Proof Commands

Date: 2026-07-11

## One-command desktop and responsive-browser proof

From the extracted W624C source root:

```bash
npm ci
npx playwright install chromium
npm run proof:w624c-command-district:browser
```

The runner starts a loopback Vite server, intercepts only `/api/city/access` with a clearly marked loopback authenticated fixture, boots the real Babylon runtime, captures desktop/mobile-emulated frames, checks WebGL, exercises Unstuck, inspects the six-destination map, writes evidence, and shuts the server down.

Evidence output:

```text
reports/w624c-command-district/browser-proof/
```

Expected report:

```text
reports/w624c-command-district/browser-proof/W624C_BROWSER_PROOF.json
```

## System Chromium override

When Playwright-managed Chromium is unavailable, set `CHROMIUM_PATH` to a local Chromium/Chrome executable.

PowerShell example:

```powershell
$env:CHROMIUM_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run proof:w624c-command-district:browser
```

Bash example:

```bash
CHROMIUM_PATH=/usr/bin/chromium npm run proof:w624c-command-district:browser
```

## Evidence boundaries

A passing loopback proof establishes real browser/WebGL execution against the actual City code, but it does not establish:

- production Google-session authentication;
- physical mobile/controller behavior;
- WebGL-loss recovery on the owner's GPU;
- sustained FPS, memory, battery or thermal performance;
- owner visual approval.

Those must be recorded separately and never inferred from source or emulation.
