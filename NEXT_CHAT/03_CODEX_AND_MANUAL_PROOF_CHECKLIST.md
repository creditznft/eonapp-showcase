# Codex and Manual Proof Checklist

## A. Before any deployment

- Confirm source begins from this W405 bundle only.
- Run `npm ci`.
- Run `npm run verify:w405-live-rescue-source`.
- Confirm no `.env`, Cloudflare token, OAuth secret, session key, D1 dump, R2 credential or customer data is staged.
- Keep Preview Google OAuth disabled.
- Verify the Google OAuth client secret was rotated if it was ever pasted into an AI/chat interface.

## B. Real Google proof — Production Testing mode only

Use a disposable approved Google test account.

1. Open `https://eonapp.ch` in a private browser profile.
2. Confirm Guest UI has a visible Sign in entry.
3. Click Sign in and verify the small modal—not Profile/Vault/Backup—opens.
4. Click Continue with Google and capture Google account chooser / consent flow without revealing credentials.
5. Verify callback returns to the same EONAPP route signed in.
6. Refresh; confirm session stays valid.
7. Sign out; confirm guest UI returns and locally retained work is not deleted silently.
8. Test account deletion only using the disposable tester. Confirm it does not delete local browser work without clear consent.
9. Record browser, version, date/time, route and redacted screenshots.

## C. EON City proof

Run after the W405 service-worker update is installed.

1. Test `/realm#my-realm-3d`; confirm redirect to `/eoncity`.
2. Desktop: keyboard movement, mouse look, HUD click then movement, Pause/Resume, Reset view, Command Deck.
3. Mobile Android/iOS: touch joystick, camera swipe, City controls, safe areas, portrait/landscape handling, reduced-motion mode.
4. Capture clean before/after screenshots and a short video. No DevTools/debug overlays.
5. List every remaining control/render defect honestly.

## D. Sync proof — only after W411/W412 implementation

- Device A local guest workspace -> sign in -> explicit sync opt-in.
- Device B sign in -> intentional merge/import choice.
- Offline edit on each device -> reconnect -> expected conflict outcome.
- Delete on one device -> controlled deletion propagation.
- Sign out/in retention behavior.
- Empty target recovery/restore drill.
- Verify no Vault secret/API key sync unless Secure Vault Sync has separate E2EE proof.

## E. Return package required from Codex

- full lean source ZIP under 200 MB;
- SHA-256 and source manifest;
- concise changed-file manifest;
- commands and actual results;
- browser/device screenshot index;
- redacted OAuth proof note;
- no secret values, `.env`, `node_modules`, `dist`, report caches or browser profiles;
- list of every blocker and unimplemented activation boundary.
