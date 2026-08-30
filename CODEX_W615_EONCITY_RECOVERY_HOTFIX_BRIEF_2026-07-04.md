# Codex W615 — EON City Recovery / Shell / Live-Diagnostic Hotfix

> historical-only. Historical only.
> Use `CURRENT_PRODUCT_START_HERE.md` for current instructions and `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` for retained W524 provenance.

## Why this exists

A normal signed-in production visit to `/eoncity` reached the City recovery screen instead of the Babylon City. The screenshot exposed three release-blocking UX defects even before the renderer root cause is known:

1. The protected City route omitted the normal EONAPP shell, so no sidebar/mobile app navigation appeared.
2. The recovery page put every heading, paragraph, and control directly inside a two-column grid, scattering its content.
3. The page root locked overflow and the apparent support control looked disabled, leaving no obvious normal-app escape.

Production provenance parity is now clean. Access authorization is also reported as successful. That means this is a real City boot/render investigation, not a stale-deploy or authentication bypass issue.

## W615 source repair

- Restores the EONAPP shell on `eoncity.html` while keeping Babylon dynamically gated behind signed-in City access.
- Makes access/recovery states scrollable; immersive `running` City stays canvas-first and non-scrolling.
- Rebuilds the recovery UI as one accessible content panel plus a separate visual panel.
- Gives recovery clear actions: `Retry full City`, `Start low-detail City`, `Open EONBOT`, and `Get City help`.
- Prevents a low-detail retry loop: Lite is tried once, then the page exposes a retry and a redacted safe City code.
- Low-detail recovery retains the same direct City control model rather than falling back to a generic legacy HUD.
- Adds route/play/recovery state markers and a bounded loopback-only live-surface snapshot.
- Upgrades the authenticated runner to fail explicitly as `CITY_RECOVERY_VISIBLE` or `CITY_RENDER_SURFACE_MISSING`, with a redacted screenshot/report, rather than merely timing out for a canvas.

## Scope deliberately excluded

No session manipulation, cookie export, Google/login bypass, storage-state creation, data migration, payment, subscriptions, referral rewards, social posting, or visual-art claims are included. The patch is UI recovery/shell continuity plus diagnostics only.

## Required Codex order

1. Apply the exact W615 delta to the real `origin/main` checkout. Do not merge it over any unreviewed old W596–W598 branch.
2. Clean install and run the local gates in `HANDOVER/W615_EONCITY_RECOVERY_SHELL_HOTFIX_RUNBOOK_2026-07-04.md`.
3. Before deploying, capture the current signed-in live surface through loopback CDP only. Preserve the current screenshot/JSON as evidence of the pre-fix outcome.
4. Commit and deploy only after local gates pass from the real Git checkout with its true `EONAPP_SOURCE_REVISION`.
5. After deployment, rerun both the W615 snapshot and W599 authenticated proof. Do not close W600A unless the runner emits `AUTHENTICATED_CITY_AND_GATE_PROVEN` or the explicitly reviewed `PASS_WITH_DIAGNOSTICS` outcome.

## Immediate live root-cause decision table

- `CITY_IMPORT_FAILED`: inspect first-party dynamic City chunk response, cache headers, and CSP. Do not change auth.
- `CITY_ENGINE_CREATE_FAILED`: inspect WebGL/renderer initialization and hardware acceleration in the real browser; record GPU/context facts without exporting browser state.
- `CITY_CANVAS_MOUNT_FAILED`: inspect host element, DOM state and module initialization order.
- `CITY_ASSET_LOAD_FAILED`: inspect only first-party City asset responses; no remote asset substitution.
- `CITY_CONTEXT_LOST`: record GPU/context loss; retry Lite once; do not claim a full-graphics pass.
- `CITY_FIRST_FRAME_TIMEOUT`: inspect render loop, canvas dimensions and console evidence; no false success from a present-but-blank canvas.
- no marker plus access allowed: inspect access-station/import lifecycle and capture page errors through the already open normal browser.

## Completion rule

W615 repairs the bad recovery experience and makes the live failure legible. It does **not** prove the full City renderer. W600A remains blocked until real signed-in production evidence shows a usable Babylon canvas, Start Here pointer ownership, named controls, refresh recovery, and the current deployed provenance.
