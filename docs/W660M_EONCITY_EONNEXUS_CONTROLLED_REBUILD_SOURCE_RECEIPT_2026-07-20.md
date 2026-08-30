# W660M EONCITY + EONNEXUS Controlled Rebuild — Source Receipt

Date: 2026-07-20  
Status: SOURCE AND PRODUCTION BUILD CERTIFIED; HEADED VISUAL ACCEPTANCE PENDING  
Production changed: No

## Authority

- Parent authority: W660L complete source.
- Verified parent source SHA-256: `8e8e75fd9fbc5ec65bdeaa3f9bb07429c10f2bd7c387f44709820dfd26392717`.
- W660L source archive remained untouched.
- W660M work was performed in a separate working tree.
- W660L's immutable deployment candidate and no-rebuild promotion rules remain valid only for W660L. W660M is a new source evolution and must receive a new visual acceptance and deployment package before production promotion.

## Chosen direction

W660M implements the integrated “Option 2” direction: EONCITY and EONNEXUS behave as one premium, productive, living experience rather than as disconnected visual add-ons.

The controlled rebuild preserves:

- one maintained Babylon engine, scene, canvas and render loop;
- nine playable districts;
- nine physical City Nexus stations;
- six functional stations;
- the existing authentication, Productive City, review-first, referral, billing and privacy contracts;
- the lightweight application-shell Nexus outside City;
- no second chat, project, assistant or state store;
- no autonomous work claims.

## Implemented W660M behavior

### Pathfinder

- Standing still no longer means a frozen avatar.
- Pathfinder cycles through real available `idle`, `idle-alt`, `interact` and `wave` clips.
- Walk and run remain movement-driven.
- Reduced-motion mode uses restrained state changes rather than arbitrary animation fallback.

### District residents

- Animated residents now have curated local patrol and work routines.
- Residents face and acknowledge Pathfinder at close range.
- Operator interactions can trigger supported talk/interact animation.
- Unsupported states safely fall back to `idle`.
- The routines are presentation-only and never claim autonomous work.

### EONBOT companion

- EONBOT follows Pathfinder while moving.
- It guides or observes nearby stations and terminals.
- It scans physical Nexus stations.
- It orbits curiously during longer idle periods.
- It can return to the canonical Creator Atrium docking station.
- Dock coordinates come from the existing W659F functional-asset authority rather than a duplicated constant.
- EONBOT remains local, camera-safe, review-first and non-autonomous.

### Unified City–Nexus context

- Productive City now exposes one living context containing the current district, nearby station, terminal, operator, physical Nexus, open-panel state and resident activity.
- The maintained City owner updates district residency, productive systems and W660M choreography in one ordered frame flow.
- The old companion-intent recursion between the core and product layer was removed.
- A compact living-world status is shown without per-frame redundant DOM writes.

## Primary source changes

- `assets/js/city/w660m/eon-city-w660m-experience-director.js` — new living-world director.
- `assets/js/city/eon-city-companion-director.js` — scan/dock behavior and stable docking.
- `assets/js/city/w649/eon-city-w649-babylon-core-runtime.js` — `idle-alt` animation state.
- `assets/js/city/w649/eon-city-w649-animation-manifest.js` — real alternative idle aliases.
- `assets/js/city/w649/eon-city-w649-district-runtime.js` — living resident routines and safe animation fallback.
- `assets/js/city/eon-city-play-core.js` — one-owner W660M frame integration and recursion removal.
- `assets/js/city/w659n/eon-city-w659n-product-layer.js` — unified living context, status and operator reactions.
- `assets/css/eon-city-product-layer.css` — responsive living-world status treatment.
- `tests/unit/w660m-eoncity-living-rebuild.test.mjs` — behavioral tests.
- `scripts/w660m-eoncity-living-rebuild-gate.mjs` — architectural source gate.
- `package.json` — W660M source QA commands.

## Final source and build validation

All commands completed successfully in the W660M working tree:

- Targeted ESLint: zero warnings.
- W660M architectural gate: 19/19 passed.
- W660M behavioral tests: 6/6 passed.
- W649 controllable-core tests: 4/4 passed.
- W649 district-runtime tests: 8/8 passed.
- W659N Productive City source gate: 62/62 passed.
- W659N Productive City tests: 36/36 passed.
- W660F physical City Nexus gate: 18/18 passed.
- W660F physical City Nexus tests: 3/3 passed.
- W660G application-shell Nexus gate: 17/17 passed.
- W660G application-shell Nexus tests: 4/4 passed.
- W660K movement/travel/live-evidence source gate against final `dist/`: 16/16 passed.
- W660I district/input/Nexus-discoverability gate against final `dist/`: 30/30 passed.
- Production reachability: passed; 366 reachable files and zero quarantined reachable files.
- Production build: passed; 581 files.
- Build smoke: passed; 24 required files plus emitted assets.
- Final distribution SHA-256: `2d7399036a70600fc11a70b89278f253bc2d7580a43223399561a8bcf01485b3`.
- Final distribution size: recorded in `dist/build-provenance.json`.
- W660M dynamic director chunk: approximately 9.1 KB raw / 3.8 KB gzip.
- EONCITY route entry chunk: approximately 51.8 KB raw / 18.0 KB gzip.

## Headed visual evidence boundary

A real local Chromium browser lane was attempted after the final build. The browser was available, but the execution environment blocked navigation before the app loaded:

```text
net::ERR_BLOCKED_BY_ADMINISTRATOR
```

The same policy block occurred for direct loopback and a hostname mapped to loopback. This is an environment-level browser restriction, not a source or HTTP-server failure: the Vite preview responded with HTTP 200 outside Chromium.

Therefore this receipt does **not** claim:

- a measured 9.5/10 visual score;
- nine unobstructed headed district screenshots;
- physical press-and-hold movement evidence;
- mobile physical acceptance;
- preview or production certification;
- production deployment.

Those final acceptance items are intentionally delegated to the supplied W660M Codex visual-acceptance prompt. No production files were changed by W660M.
