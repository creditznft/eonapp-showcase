# Manual Art and Device Proof Checklist — W419

## W419 vector-art acceptance

- [ ] `/eoncity` loads without console errors.
- [ ] Balanced mode visually shows wet street, facades, glass grid, carbon panels, route lights, skyline, district emblems and EONBOT halo.
- [ ] Lite mode remains readable and does not request the full art set.
- [ ] Cinematic mode enables the intended richer art and bounded shadows without obvious stalls.
- [ ] No broken textures, stretched decals, z-fighting, unreadable signs or dark/blank planes.
- [ ] Offline repeat visit uses the service-worker asset policy as expected.
- [ ] Check all 18 SVG URLs directly on preview/production; none should redirect to another origin.

## Device controls

- [ ] Desktop: keyboard movement, mouse camera, HUD click, pause/resume, reset view and Command Deck.
- [ ] Android: touch joystick, camera swipe, safe areas, portrait and landscape.
- [ ] iOS: touch joystick, camera swipe, safe areas, portrait and landscape.
- [ ] Reduced-motion mode stops optional rain/ambient animation correctly.
- [ ] Record browser/device/version/date, screenshots, a short clean video and every observed defect.

## Google identity proof

- [ ] Private browser, disposable approved Google test account.
- [ ] Guest sees Sign in and opens compact modal.
- [ ] Google chooser/callback returns to same EONAPP route.
- [ ] Refresh keeps session; sign-out returns Guest without deleting local work.
- [ ] Account deletion tested only with the disposable account.

## Sync proof — only after W412 Cloudflare setup

- [ ] Device A local guest work → sign in → explicit opt-in.
- [ ] Device B → explicit import/merge choice.
- [ ] Offline edits → reconnect → expected conflict copies.
- [ ] Controlled tombstone/delete propagation.
- [ ] Empty-device recovery/restore.
- [ ] Verify no Vault/API secret leaves the browser.
