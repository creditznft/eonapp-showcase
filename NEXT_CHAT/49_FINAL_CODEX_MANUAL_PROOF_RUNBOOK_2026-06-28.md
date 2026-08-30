# Final Codex + Manual Proof Runbook

This runbook is deliberately evidence-first. Run only against an approved staging/production environment using a disposable approved Google test account. Redact account identifiers and never paste secret values into tickets, screenshots or chat.

## A. Production Google OAuth proof

1. Open `https://eonapp.ch` in a private browser profile.
2. Confirm the Guest shell shows a visible **Sign in** entry.
3. Click it and confirm the compact sign-in modal opens; no Vault/backup/Profile detour appears.
4. Choose **Continue with Google** and capture the Google chooser/consent stage without credentials.
5. Confirm the callback returns to the original EONAPP route signed in.
6. Refresh, then sign out. Confirm guest work remains local and is not silently deleted.
7. Record browser/version/date/route plus redacted screenshots.

## B. Canonical Babylon City proof

1. Confirm `/realm#my-realm-3d` resolves to `/eoncity` after the current service-worker update.
2. Desktop: keyboard movement, mouse look, direct HUD, City Controls, Command Deck, pause/resume/reset and all six district focus paths.
3. Android/iOS: touch joystick, camera swipe, City controls, safe areas, portrait/landscape and reduced-motion behavior.
4. Start and finish one local Signal Expedition. Verify it is finite, optional and returns only a public-safe postcard/Remix handoff.
5. Capture clean screenshots and one short video without DevTools/debug overlays. List every defect; do not call it certified without these records.

## C. W412 Sync Basic — dedicated test drill only

Preconditions: approved disposable test account, dedicated D1 database, current identity configuration, redacted operator access, and a rollback plan.
This is a **two-device** manual proof drill only; it is not a public Sync release.

1. Apply `sync/migrations/0001_eon_sync_basic.sql` to a **dedicated** D1 database. Bind it as `EON_SYNC_DB`; never reuse a Vault, payment, referral or unrelated production database.
2. Keep the transport disabled until the proof window. For the proof window only, set both `EON_SYNC_ROLLOUT=manual-proof` and `EON_SYNC_MUTATION_GATE=reviewed` in the approved environment secret/configuration system.
3. Device A: create local guest workspace content, sign in, inspect the Sync status explicitly, then select/import only approved safe records.
4. Device B: sign in and use the explicit read/merge review. Confirm text conflicts create review/conflict copies rather than a silent overwrite.
5. Make offline edits on both devices, reconnect, and record the review outcome.
6. Send one explicit tombstone. Confirm the other device shows a controlled deletion review, not automatic silent deletion.
7. Run an empty-target restore/recovery drill. Confirm Vault/API keys/recovery material/raw media/local models never appear.
8. Remove the two manual-proof flags after testing until an independently reviewed public release decision exists.

## D. Final City art/provenance intake

1. For each accepted asset, record license/original commission reference, creator/source, permitted use, file hash, GLB source, KTX2/Basis output, LOD tiers, triangle/material/texture budget and mobile fallback.
2. Do not use undocumented web assets or random generated cubes as hero-art substitutes.
3. Test actual first-frame and memory budgets on desktop/midrange/mobile before making any visual-quality claim.
4. Keep a provenance manifest and visual screenshot index alongside the source return package.

## E. Return evidence to the owner

Return: exact deployed commit/source checksum, test command results, redacted OAuth proof note, browser/device matrix, City screenshot/video index, Sync drill report, asset provenance manifest, failures/blockers, and no secret values.
