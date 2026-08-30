# Manual Proof Checklist

Capture redacted evidence with browser/device, version, date/time, route and result for every pass/fail.

## A. Google OAuth — disposable test account only

1. Open production in a private browser profile.
2. Confirm Guest sees Sign in.
3. Confirm Sign in opens the small modal—not Profile, Vault, Backup or Settings.
4. Choose Continue with Google and capture the account chooser/consent journey without credentials.
5. Confirm callback returns to the same route, refresh retains session, and Log out restores Guest without deleting local work.
6. Test account deletion only with the disposable account.

## B. City desktop

At `/eoncity`, verify keyboard movement, mouse look, click-to-move, HUD buttons, Pause/Resume, Reset View, Command Deck, Creator/Forge routes, Metropolis district focus and a finite Signal Expedition. Check reduced motion and the performance-protection fallback.

## C. City Android and iOS

On a real Android device and a real iOS device, verify touch joystick, camera swipe, City controls, safe areas, portrait/landscape, pause/reset, reduced motion and return from a native destination. Save clean screenshots and short video; no DevTools or debug overlays.

## D. EON Sync Basic — two-device dedicated D1 proof only

1. Provision only `EON_SYNC_DB` and set the separate manual-proof configuration exactly as documented in W412.
2. Device A: local guest work → sign in → explicit opt-in → explicit import choice.
3. Device B: sign in → intentional merge/import choice.
4. Test offline edit on both, reconnect conflict behavior, tombstone/delete propagation, sign out/in and restore on an empty target.
5. Confirm Vault/API credentials never appear in Sync payloads.

## E. Final City art

For each licensed/original GLB, collect provenance/evidence, SHA-256, lod0/lod1/lod2, KTX2/Basis texture evidence and desktop/Android/iOS performance/visual proof. Run:

```bash
node scripts/city-asset-release-preflight.mjs --manifest docs/city-art/release-manifest.json
```

Only after this evidence exists may language move from procedural preview toward final flagship art.
