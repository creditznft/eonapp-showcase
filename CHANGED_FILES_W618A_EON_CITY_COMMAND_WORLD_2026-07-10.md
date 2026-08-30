# W618A — EON City Command World Emergency Usability + Plan Lock

Date: 2026-07-10  
Baseline: W617B Launch Master Plan source package.

## CEO decision locked in source

W618A starts the approved EON City rebuild direction without throwing away the existing City assets, districts, Command Deck, landmarks, useful work paths, local-safety boundaries or Babylon runtime.

Approved City direction:

1. **EON Command Room** — the default productivity cockpit.
2. **EON Living City Dashboard** — truthful status signals from real local/server state only.
3. **EON Agent Theater** — future visible agents/orbs only when real job receipts exist.

The source now carries the rule that billing/server activation waits until City usability, global Share/shell, Command Room and browser/mobile proof pass.

## Files changed

### New EON City plan contract

- `assets/js/city/eon-city-command-world-plan.js`
  - Adds the source-controlled Command World plan.
  - Locks the three approved layers: Command Room, Living Dashboard and Agent Theater.
  - Reuses existing City assets and districts.
  - Adds district-to-app-surface mapping for Command Centre, Forge Bay, Creator Atrium, Local AI Observatory, Knowledge Archive, Realm Relay, Vault Gardens, Share Tower and Automation Relay.
  - Adds the W618A → W618B → W618C → W618D → W618E → W618F → W619 roadmap.
  - Keeps commercial/reward boundaries disabled: no checkout, no live referral grants, no browser entitlement authority, no fake agent activity and no private prompt text inside the world.

### EON City control/usability fixes

- `assets/js/city/eon-city-gameplay-contract.js`
  - Adds `EON_CITY_CONTROL_CONVENTION`.
  - Locks the default convention as positive strafe = visible screen-right.
  - Sets direct City mouse travel/click-move on by default.
  - Keeps visible review before quick-open actions.
  - Updates the camera-relative right vector so the live left/right feel is no longer inverted for the default Babylon forward direction.

- `assets/js/city/eon-city-play-babylon.js`
  - Reads the control convention from the central gameplay contract.
  - Enables direct City mouse travel by default for direct `/eoncity` entry.
  - Updates canvas accessibility copy for W/Up, A/Left, D/Right and click/tap district signals.
  - Updates movement/click copy to make district signal review and local floor travel clearer.

- `assets/js/eon-city-play-station.js`
  - Imports the approved Command World plan.
  - Changes direct City framing to **EON City · Command World**.
  - Adds a persistent Command Room shortcut strip: Command Room, Districts, EONBOT and Share.
  - Adds a Share HUD action for the City.
  - Rewrites first-run copy to direct users toward Command Room, districts or Share instead of confusing route-review wording.
  - Replaces raw-looking first-run button language with clearer “Open review” wording.
  - Adds a Command World plan note to the controls/menu surface.

- `assets/css/eon-city-play.css`
  - Adds W618A emergency City CSS.
  - Styles the Command Room shortcut strip.
  - Makes first-run action grids/cards more readable.
  - Reduces the raw grey-button look and overlap risk.
  - Adds responsive/mobile protection for the new command strip and first-run panel.

### Account-return cleanup

- `assets/js/eon-app-shell.js`
  - Captures sign-in callback notice once.
  - Removes `account` and `accountCode` query parameters from the visible URL using `history.replaceState`.
  - Preserves the sanitized sign-in notice for the profile/sign-in dialog.
  - This directly addresses screenshots such as `/eoncity?account=error&accountCode=token_exchange` so City is not left carrying an OAuth/account error in the address bar.

### Tests and gates

- `scripts/w618a-eon-city-command-world-gate.mjs`
  - Adds a 15-check W618A source gate.
  - Checks the Command World plan, City control convention, direct mouse travel default, Command Room/Share station wiring, CSS, account-return URL cleanup and package script.

- `tests/unit/w618a-eon-city-command-world.test.mjs`
  - Adds five unit tests covering the approved three-layer plan, roadmap, movement convention, next-wave decision and standalone W618A gate.

- `scripts/w607-city-gameplay-contract-gate.mjs`
  - Updates the existing gameplay contract gate to the corrected default screen-right convention.

- `tests/unit/w607-city-gameplay-contract.test.mjs`
  - Updates existing gameplay tests to the corrected default screen-right convention.

- `package.json`
  - Adds `qa:w618a-eon-city-command-world`.

## Validation passed

```bash
npm ci
npm run qa:w618a-eon-city-command-world
npm run qa:w617b-launch-master-plan
npm run qa:w617a-shell-launch-readiness
npm run qa:w616d-locked-feature-surfaces
npm run qa:w616c-locked-feature-resolver
npm run qa:w616b-eon-keys-referral
node scripts/w607-city-gameplay-contract-gate.mjs
node --test tests/unit/w607-city-gameplay-contract.test.mjs tests/unit/w618a-eon-city-command-world.test.mjs
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
npm run launch:readiness
npm run launch:page-gate
npm run launch:identity-gate
npm run launch:quality-gate
npm run security:secret-scan
```

## Validation result

- `npm ci`: passed; 0 vulnerabilities.
- W618A gate: 15/15 passed.
- W618A unit tests: 5/5 passed.
- W607 + W618A focused unit set: 9/9 passed.
- W617B regression: passed; tests 6/6.
- W617A regression: passed; gate 10/10.
- W616D regression: passed; tests 5/5.
- W616C regression: passed; tests 6/6.
- W616B regression: passed; gate 9/9, tests 8/8.
- Lint: passed with `--max-warnings=0`.
- Build: passed.
- Build output: 444 dist files.
- Distribution SHA-256: `31d5f466823257d98d37e94e8383c2d62880010acc8a18c2ffa729eef394ade2`.
- Smoke build: passed.
- Launch readiness: PASS, 0 blockers, 0 warnings.
- Launch page gate: 0 blockers, 0 warnings.
- Launch identity gate: 0 blockers, 0 warnings.
- Launch quality gate: PASS, 0 blockers, 0 warnings.
- Secret scan: PASS.

## Still not claimed

- No Cloudflare deployment was performed in this chat runtime.
- No live browser/visual proof was captured after W618A.
- No mobile device proof was captured after W618A.
- No live Dodo checkout was activated.
- No live trial activation was activated.
- No live EON Key redemption was activated.
- No referral grant ledger was activated.
- No server entitlement ledger was activated.
- No browser-only entitlement unlock was added.

## Next coding wave

W618B should code the global top-right **EON Share Command Center** and compact shell/sidebar pass:

- A permanent top-right Share entry across app-shell pages.
- Invite/referral link, QR, share card, Realm identity and reward explanation surfaces.
- Explicit copy that rewards require verified server proof later.
- Compact primary sidebar with secondary tools grouped under Apps/Profile/Settings.
- City-friendly sidebar behavior so the 3D/Command Room surface has enough screen space.
