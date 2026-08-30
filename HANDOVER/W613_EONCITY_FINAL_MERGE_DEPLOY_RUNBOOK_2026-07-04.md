# W613 — Codex Merge, Build, Deploy and Evidence Runbook

**Scope:** merge the W613 final source-side EON City polish onto the real repository, build from a real Git revision, deploy normally, then run the outstanding normal-browser evidence lanes.  
**Non-negotiable:** do not certify production based on a local build. Do not use Codegen sign-in, cookie injection, Playwright storage state, exported sessions, Google bypasses, fake profiles or session mutation.

## 0. Merge preflight

Use the real repository, not the sanitized handoff alone.

```bash
git fetch origin --prune
git status --short
git rev-parse --show-toplevel
git rev-parse HEAD
git rev-parse origin/main
```

- Start from a clean worktree/branch.
- Preserve W599 authenticated City gating, W600A overlay checks, W607 gameplay contract, W612 provenance and client-only AI policy.
- Apply the **exact W613 delta**. Do not merge old W596–W598 variants or unrelated stale handovers.
- Resolve any conflict in favor of the current named direct HUD and fail-closed commercial/privacy boundaries.

## 1. Required source verification

After the merge and before deployment:

```bash
npm ci
npm run lint -- --max-warnings=0
npm run qa:w612-build-provenance
npm run qa:w600a-city-overlay-proof
npm run qa:w607-city-gameplay-contract
npm run qa:w613-eoncity-final-red-team
node --test tests/unit/w599-authenticated-city-access-and-cache.test.mjs
npm run test:unit
EONAPP_SOURCE_REVISION="$(git rev-parse HEAD)" npm run build
npm run smoke:build
```

Expected source checks:

- zero lint warnings;
- W612, W600A, W607 and W613 gates pass;
- W599 authenticated access/cache test passes;
- current maintained suite passes;
- build and smoke pass;
- `dist/build-provenance.json` exists and its `sourceRevision` equals `git rev-parse HEAD`.

Do not substitute a made-up revision. The sanitized source package has no Git identity by design; the real merge checkout must supply it.

## 2. Deploy normally

Use the ordinary verified deployment route for the intended EONAPP production target. Record:

- Git commit SHA;
- CI/build identifier;
- published time and target;
- the exact `dist/build-provenance.json` retained as the expected local candidate;
- redacted deployment logs/URLs according to repository policy.

Do not treat a browser cache hit, preview alias or old asset bundle as evidence of the new candidate.

## 3. W600A normal signed-in production closure

1. In a normal Chrome/Edge user profile, sign in to EONAPP through the ordinary Google flow.
2. Start that already-signed-in browser with a loopback-only DevTools endpoint. Do not extract or import credentials/cookies.
3. Run the production checker from the real checkout:

```bash
EON_CITY_AUTH_BASE_URL=https://eonapp.ch \
EON_CITY_CDP_ENDPOINT=http://127.0.0.1:9222 \
EON_CITY_EXPECTED_BUILD_PROVENANCE="$PWD/dist/build-provenance.json" \
node scripts/w599-run-authenticated-eoncity.mjs
```

4. Save only redacted summary, screenshots and deployed SHA.

The closure requires all of these:

- guest access does not boot full Babylon Play;
- the normal signed-in City may boot;
- the deployed provenance matches the exact candidate source revision and hashes;
- usable real canvas dimensions;
- `pointerOwnership.firstRunDismiss.topMatchesControl === true`;
- canvas is absent from the top stack above the visible Start Here dismiss control;
- Start Here, Voice, EONBOT, Menu and Command Deck open/close;
- named HUD inventory exists and generic `Interact` does not;
- refresh recovers signed-in City;
- runner outcome is `AUTHENTICATED_CITY_AND_GATE_PROVEN`.

`PASS_WITH_DIAGNOSTICS` is not closure. `CITY_OVERLAY_POINTER_INTERCEPT`, a provenance mismatch or unavailable canvas is a real blocker, not a test flake.

## 4. W613 wall, project and sharing walkthrough

Create `reports/w613-eoncity-final/` with redacted output only:

```text
reports/w613-eoncity-final/
  desktop-mouse-keyboard/
  controller/
  touch-landscape/
  low-end-mobile-lite/
  reduced-motion/
  summary.md
```

### Wall/camera checks

- Place camera sightlines so Command Centre and other eligible architecture lie between camera and operator.
- Confirm a true blocker fades enough to preserve operator visibility.
- Confirm only eligible architectural meshes fade; no operator, EONBOT, Navigator, beacon, ring or direct hit volume fades.
- Move/rotate until line clears; faded architecture restores cleanly.
- Confirm collision remains blocking and movement/input/camera controls retain expected behavior.
- Confirm landmark review cards still open from their dedicated direct hit volumes.
- Record any flicker, pop, material issue or frame drop as a blocker/diagnostic, not a cosmetic dismissal.

### Project District checks

- Use only existing local/reviewed project data. Do not seed test secrets, raw prompts or private files.
- Open Command Deck → Private project districts → Project Portals.
- Check distinct silhouette/visual profile exists only from allowlisted profile data.
- Confirm visible world content remains reviewed City-safe label/cards only.
- Confirm project files, keys, raw tasks, prompts and private notes remain absent from City world signage.
- Refresh/resume; confirm safe portal state behavior and a visible recovery path.

### Share checks

- Use Menu → Share City invite.
- Confirm the share sheet opens only after explicit click/tap.
- Confirm its URL/token is a signed City invite and that any clipboard/native-share fallback is visible.
- Confirm no automatic post, connection, referral record, reward, payment or subscription event occurs.

### HUD/controls/accessibility checks

Capture all exact direct actions: **EONBOT, Voice, Chat, Districts, Command Deck, Menu**.

- Desktop mouse/keyboard: W/A/S/D and arrows; physical right corresponds to visible screen-right.
- Controller: left stick movement; primary action reviews only the focused named landmark.
- Touch landscape: direct landmark tap, analogue move, safe-area layout and review/guide controls.
- Low-end mobile Lite: tier is visible; long/complex visual claims are not inferred.
- Reduced motion: static readable fallback, no unwanted resumption.
- Voice: panel opens only after direct action; mic never auto-starts; captions-first wording remains truthful.
- Chat: visible native route/action; return loop works.
- Native route portal: see → review → explicit enter → native surface → return; stable pose/camera and no false completion.
- Refresh/context recovery: first-run/resume do not compete and a visible return path remains.

## 5. Evidence decision record

**Allowed production statement after a complete pass:**

> The deployed named revision passed the authenticated City gate and the recorded W613 interaction walkthrough on the listed browser/device combinations. The receipt is limited to those combinations and does not certify untested devices or final art quality.

**Do not claim:** AAA approval, approved/cleared art, KTX2/Basis delivery, all-device compatibility, real voice conversation, completed referrals/rewards, completed payment/subscriptions, final release readiness, or owner approval unless separate evidence exists.

## 6. Rollback

If W613 wall fade causes flicker, conceals an intentional interaction mesh, degrades frame pacing, or breaks hit targeting:

1. Preserve evidence and exact deployed SHA.
2. Revert only the W613 camera/project/share delta; retain W612 provenance and W599/W600A/W607 hardening.
3. Rebuild with a real source revision.
4. Redeploy normally and rerun W600A authentication/provenance checks.

Do not “fix” a wall/pointer problem by disabling collision, removing sign-in gating, injecting a session or bypassing the production runner.
