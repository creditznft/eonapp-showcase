# W624G Browser and Device Proof Commands

Date: 2026-07-11

## Loopback proof

```bash
npm ci
npx playwright install chromium
npm run proof:w624g-productive-rpg-loop:browser
```

An installed Chrome/Chromium binary may be supplied instead:

```bash
CHROMIUM_PATH=/absolute/path/to/chrome npm run proof:w624g-productive-rpg-loop:browser
```

Windows PowerShell:

```powershell
$env:CHROMIUM_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run proof:w624g-productive-rpg-loop:browser
```

## Required observations

- Real Babylon first frame appears through the W624B runtime owner.
- Exactly six mission cards and nine finite states load.
- Reviewing a mission does not navigate.
- A route appears only as a second visible choice.
- Start, cancel and resume are explicit local actions.
- Orientation completes only after explicit controls review.
- Mission storage contains no private-work fields.
- Desktop and mobile-landscape layouts do not hide core controls.

## Evidence boundary

Loopback proof is not production authentication, physical-device validation or proof of Local AI/BYOK generation, automation execution, backup/restore, payment, referral or reward lifecycle. Record those separately only after genuine actions occur.
