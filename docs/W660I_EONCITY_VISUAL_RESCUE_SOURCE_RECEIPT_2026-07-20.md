# W660I EONCITY visual rescue — source receipt

**Prepared:** 2026-07-20
**Authority:** exact deployed W660H source takeover, production commit `f13bf91e3fb60eff1757e34aab7c98eb6d38a7c8`
**Deployment action:** none
**Production status:** unchanged W660H canary; W660I requires immutable Preview and headed acceptance before promotion.

## Confirmed live blockers addressed in source

### Touch movement route escape

A shared directional input contract now normalizes visual `up/down` controls to runtime `forward/backward`, forces `type="button"`, prevents default navigation, stops shell propagation, supports press-and-hold, and releases movement on pointer cancel, lost capture, blur, and document hiding. Both City entry surfaces use the same contract.

### District travel changed labels but not the world

Travel now activates an explicit district composition and awaits district residency before issuing the arrival receipt. The active district, signature landmark, and asset group are exposed as runtime datasets. The previous procedural district root is disposed so only one district composition remains resident.

A canonical nine-district authority now controls labels, purpose, centers, arrival poses, camera framing, palette, landmark, asset group, terminals, and skyline. Every arrival coordinate is validated to resolve to its intended district.

### Home Nexus discoverability

The Nexus Pulse now exposes one labeled, accessible open button with a stable data contract, explicit expand and full-screen actions, desktop double-click and mobile swipe-up support. It mounts through a dynamic import immediately after the shell load instead of waiting for idle time, and its z-index is above the composer/sidebar lane.

## Visual/readability repair

- All nine districts have a distinct procedural composition fallback with signature landmark, productive terminals, skyline depth, palette, fog, lighting, camera framing, and restrained ambient animation.
- A district identity banner displays the active district and its real product purpose.
- City starts with the app rail collapsed for immersion, while stronger icon contrast and focus-visible treatment preserve navigation accessibility.
- Canonical product names are `Archive Canopy` and `Vault Station`; the combined legacy `Vault Station / Local AI Observatory` and `Knowledge Archive` travel labels are removed.
- Exactly one review-first City Nexus station is mapped to each of the nine districts.

## Architecture and safety boundaries preserved

- one Babylon owner
- one canvas
- one render loop
- no second chat store
- no second project store
- no automatic travel
- no automatic AI work
- no automatic voice capture
- no automatic sharing or media upload
- no checkout completion in tests
- review-first City and Nexus actions
- Cloudflare Pages/Functions-compatible static assets

## Source-grounded counts

- playable districts: 9
- City Nexus stations: 9
- effective City assets: 34
- product-bound character assets: 14
- functional replacement assets: 6
- district productive terminals: 24 (minimum two per district)

These are source-authority counts. Physical visibility, scale, lighting, animation and interaction still require headed Preview evidence.

## Static certification completed

- W660 release source chain: passed
- W660I source gate: 28/28 (including five emitted-build assertions when run with `--require-dist`)
- W660I unit tests: 7/7
- W660B1 Nexus Pulse gate: 23/23
- W660B1 tests: 6/6
- W660F City Nexus gate: 18/18
- W660F tests: 3/3
- W659N Productive City source gate: 62/62
- W659N maintained tests: 36/36
- ESLint: passed with zero warnings
- workspace secret scan: passed
- production build: passed
- build smoke: passed
- emitted W659F/W660 candidate verification: passed
- emitted W660I district, terminal, touch and visible-Nexus tokens: passed


## Local browser-proof limitation

A real-WebGL local proof was attempted. It is **BLOCKED**, not passed: the available system Chromium is governed by an administrator `URLBlocklist` that rejects `http://127.0.0.1`, and the isolated environment could not download Playwright's bundled Chromium because external DNS/network access was unavailable. The generated proof report records `ERR_BLOCKED_BY_ADMINISTRATOR` with zero physical checkpoints. This does not indicate an application-origin failure, but it means headed and physical acceptance remains mandatory on the immutable Preview.

## Explicitly pending

Do not mark these passed from source tests:

- headed desktop and mobile acceptance
- touch route retention and real player-position change in a browser
- visual traversal of all nine districts
- close-up confirmation of all nine Nexus stations
- character/asset visibility, scale, animation and clipping matrix
- Creator Capture permissions, WebM playback and local download
- Sharing Center review/cancel
- membership server-backed state and safe checkout handoff
- FPS, transition time, transfer and cache measurements
- immutable Cloudflare Preview provenance
- production promotion

## Codex work boundary

Codex should receive this exact committed source candidate only after packaging. It should not write repair code. Its next run is limited to:

1. verify the candidate commit and checksum;
2. run the named maintained gates;
3. build and deploy one immutable Cloudflare Preview;
4. perform headed desktop/mobile acceptance with screenshots/video;
5. traverse all nine districts and inspect all nine City Nexus stations;
6. return evidence and an issue register;
7. make no production change.
