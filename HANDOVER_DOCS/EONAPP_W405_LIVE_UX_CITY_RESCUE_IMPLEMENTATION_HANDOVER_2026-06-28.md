# EONAPP W405 — Live UX + EON City Rescue Implementation Handover

**Date:** 2026-06-28  
**Baseline:** W400C/W391D post-deploy source  
**Status:** source-ready and fully validated; deployment and real-device proof still required.

## Why W405 exists

Manual production review exposed two unacceptable first-impression failures:

1. The ChatGPT-like shell was cluttered: detached popovers, duplicated utility links, clipped collapsed-rail labels, and weak guest identity discoverability.
2. EON City had split into two conflicting experiences: a basic Babylon procedural vertical slice at `/eoncity`, and an older cached Realm/Three-style preview path. The Babylon scene was not visually ready to be marketed as a finished or AAA City, and input could lose focus after HUD use.

W405 is a **rescue and truthfulness wave**. It does not pretend the procedural City is complete art. It fixes first-run UX, cache routing, discoverability, and interaction foundations while defining the art rebuild that must follow.

## Implemented changes

### Chat shell and guest identity

- Collapsed left rail uses readable hover/focus labels instead of clipped text.
- EONAPP brand is the collapsed top control and exposes an **Open sidebar** tooltip/action.
- New Chat, Search, More, and Profile use contextual anchored popovers instead of detached windows.
- Removed duplicated Guest/Install/Support/Privacy utility block from the side navigation.
- More contains only remaining settings utilities; Account/Install/Support/Privacy live under Profile.
- Guests always see a visible header **Sign in** control.
- The Google continuation link is disabled until the user explicitly acknowledges that Google Login is identity-only and is **not** backup for local Chats, Vault, projects, files, keys or City state.
- Header Sign in never silently starts OAuth. Signed-in users route to Profile.

### Canonical City and cache quarantine

- Canonical public City remains Babylon at `/eoncity`.
- Service-worker version is now `v50` and navigation requests for legacy Realm/world paths are redirected to `/eoncity` after the user receives the PWA update.
- `/eoncity/tour` and `/eoncity/3d` remain temporary compatibility preview paths only. They are not exposed by the primary EONAPP navigation and are not a second public game product.
- The legacy visual preview is an art/reference source, not a fallback flagship.

### Babylon control and direct-entry rescue

- Keyboard movement listens at the page level, ignores editable fields, and works after HUD interactions.
- Pointer input still focuses the canvas.
- Added **Reset view** to the City controls / manual HUD.
- Direct entry hides redundant diagnostic/status copy and retains only first-frame essentials.
- Fixed a duplicate `const` declaration in the City station gate path that could have created a syntax error.

## Deliberately not done

- No claim of live Google OAuth success. It still requires controlled testing with a Google test account.
- No real-phone/iOS/Android proof. Source tests are not device proof.
- No claim that current procedural City is AAA, cinematic, finished, or flagship quality.
- No Collection unlocks, Relay attribution, referral rewards, social OAuth, posting, payment, or external action activation.
- No additional public Three.js City route.

## W405 validation results

The composite source verification passed from this workspace:

```bash
npm run verify:w405-live-rescue-source
```

Included:

- `npm run lint -- --max-warnings=0` — pass
- W394 City mobile/HUD gate — 9/9 pass
- W400C Google identity entry gate — 7/7 pass
- W405 live UX + City rescue gate — 14/14 pass
- Current runnable unit suite — **334/334 pass**
- Vite build — pass
- Smoke build — pass
- Site audit — pass
- Launch readiness — pass

A local visual browser proof could not be automated in this execution environment: Playwright had no installed browser and system Chromium was blocked from localhost by the environment administrator. This is a tooling limitation, not proof of runtime quality.

## Required deploy and human proof

1. Merge/deploy W405 only after running the exact composite command above.
2. Open `eonapp.ch` in a private window and accept the service-worker update / unregister a stale old app worker before judging Realm redirects.
3. Test Chat expanded and collapsed rail, Search, More, Profile, guest Sign in acknowledgement, and the Google test-user OAuth round trip.
4. Test `/realm#my-realm-3d` resolves to `/eoncity` after update.
5. Test City keyboard, mouse, Reset view, Command Deck, pause/resume and mobile touch controls on actual devices.
6. Capture unedited evidence and catalogue any remaining render/control defects.

Detailed checklist: `HANDOVER_DOCS/W405_LIVE_UX_CITY_RESCUE_MANUAL_PROOF_2026-06-28.md`.

## Next City delivery sequence

- **W406A:** real browser/device interaction proof; remove any control that cannot be demonstrated.
- **W406B:** authored art intake manifest: asset provenance, license, LOD, texture and fallback policy.
- **W407:** Arrival District art rebuild: real Arrival Gate, Command Deck exterior, street kit, skyline, rain and one readable NPC/companion.
- **W408:** Creator Atrium and Forge Bay authored districts.
- **W409:** NPC behaviour, weather, city life, day/night and quality governor.
- **W410:** desktop/mid-range/mobile visual, control and performance certification.

The full architecture is in `docs/W405_EON_CITY_CHAT_SHELL_AND_ART_RESCUE_PLAN.md`.
