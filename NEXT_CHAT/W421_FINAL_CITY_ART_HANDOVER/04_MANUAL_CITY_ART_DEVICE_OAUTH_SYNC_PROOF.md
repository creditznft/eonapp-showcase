# Manual Proof Checklist — W421

## City art and composition

- [ ] `/eoncity` opens without console errors.
- [ ] **Lite:** essential street/emblem/wayfinding art stays clear and does not load the full art set.
- [ ] **Balanced:** wet street, graphite, glass, carbon, neon circuit, skyline, emblems, wayfinding and EONBOT halo are visible and correctly mapped.
- [ ] **Cinematic:** ACES profile, fog, bounded shadows and richer local art appear without obvious visual defects.
- [ ] City controls → **Art review** opens and lists 18 original local assets.
- [ ] Each of the six review views produces a coherent composition and is safely overridden by movement/reset.
- [ ] No stretched/blank texture, z-fighting, unreadable sign, accidental external redirect or dark plane.
- [ ] Capture clean screenshots/video with browser/device controls. The City itself must not create uploads.

## Device controls

- [ ] Desktop: keyboard, mouse, HUD, pause/resume, reset, Command Deck and each quality profile.
- [ ] Android: joystick, camera swipe, safe areas, portrait/landscape and reduced motion.
- [ ] iOS: joystick, camera swipe, safe areas, portrait/landscape and reduced motion.
- [ ] Record device, OS, browser/version, route, time, quality profile and every defect.

## Google OAuth

- [ ] Private browser and disposable approved Google testing account.
- [ ] Guest → Sign in compact modal → Google chooser/callback returns to same route.
- [ ] Refresh and sign-out behavior are correct; local work remains untouched.
- [ ] Deletion only with the disposable tester.

## Sync Basic after Cloudflare setup

- [ ] Device A guest workspace → sign in → explicit Sync opt-in.
- [ ] Device B gets explicit import/merge choice.
- [ ] Offline text edits create expected conflict copies after reconnect.
- [ ] Tombstone/delete propagation is controlled.
- [ ] Empty-device restore succeeds.
- [ ] No Vault/API secret/API key has left the browser.
