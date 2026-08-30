# W266 local capture environment result — 2026-06-25

## Result

`npm run qa:w266-visual-proof-lab:capture` deliberately finished as
**environment-blocked** (exit code `2`), not as a pass and not as an EONAPP
application failure.

- The local Vite preflight returned **HTTP 200** for `/chat`.
- The current execution environment does not provide the Playwright Chromium
  executable required by the local capture runner.
- No screenshot was captured, reviewed or approved.
- This record does not establish Android, iPhone, PWA, accessibility, visual
  quality, Preview/live, or release evidence.

## Safety behavior verified

The W266 runner writes a structured `blocked-environment` manifest for each
planned capture rather than throwing an unhandled error or claiming success.
The manifest remains under excluded generated `artifacts/` output and is not a
release-evidence substitute.

## Required follow-up

Run the same command in a reviewed environment with an approved local browser
binary, then collect the separate real-device/PWA/human-review lanes defined
in `release-evidence/W266_VISUAL_PROOF_LAB_2026-06-25/`.
