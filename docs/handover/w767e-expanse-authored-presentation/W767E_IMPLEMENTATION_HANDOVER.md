# W767E — NPC and Activity Authored-Presentation Gate

## Authority

- Base commit: `fbf6a26` (`feat(expanse): unify authored asset truth diagnostics`)
- Working branch: `chatgpt/w767-expanse-companion-clarity`
- Runtime boundary: one canonical Babylon engine, scene, Gateway, NPC runtime and activity runtime
- Deployment: none
- Production/browser certification: not claimed

## Delivered scope

### 1. Shared authored-presentation evaluator

W767E adds `eon-expanse-w767e-authored-presentation.js`, which provides a shared evidence and disposal contract for imported NPC and activity GLBs:

- finite full XYZ bounds;
- renderable mesh count;
- visibly enabled mesh count;
- material count;
- animation-group count;
- applied scale;
- target-height agreement;
- grounding delta;
- expected-zone placement distance;
- draw-call contribution.

It delegates final truth evaluation to the existing W767A asset-truth authority rather than creating a parallel release standard.

### 2. NPC fallback suppression is now proof-gated

Every Pathfinder, Navigator and Maintenance Worker authored variant must visibly pass the presentation contract before its procedural body is hidden.

For each primary/fallback attempt the NPC runtime now records:

- exact local W649 path;
- primary/fallback classification;
- pass/fail result;
- bounded rejection reason;
- visible meshes, materials and bounds;
- standardized truth record.

Invisible, empty, materialless, incorrectly scaled, ungrounded or off-zone imports are disposed before the next authored variant is tried. The procedural NPC remains available and interactive when all authored variants fail.

### 3. Activity and productive-mission assets use the same gate

The lost worker and all five productive-mission props now use the same validation contract. A procedural mission anchor is disabled only after the imported asset has passed visible presentation.

Rejected containers and wrappers are disposed. Attempt history is retained for the unified W767D diagnostic export.

### 4. Diagnostics now carry actual evidence

The W767D report now reads real NPC and activity values for:

- visible mesh count;
- material count;
- world bounds;
- attempted variants and paths;
- failure reasons.

The report no longer substitutes a hard-coded visible count for successfully loaded NPCs.

### 5. Compatibility contract updated

The maintained W766 animated-NPC regression now checks the stronger grounding and presentation gate rather than requiring the older direct `minY` subtraction implementation detail.

## Validation completed

Evidence: `W767E_FOCUSED_REGRESSION_165_PASS.log`

- Tests: 165
- Pass: 165
- Fail: 0
- Skipped: 0

Additional checks:

- four targeted W767E tests pass;
- syntax checks pass for every changed JavaScript module;
- Git whitespace check passes;
- empty/disposed child nodes do not count as renderable evidence;
- invisible, materialless and off-zone assets are rejected;
- fallback suppression occurs only after `presentation.ok`;
- actual truth evidence reaches the unified diagnostic report;
- no second engine, scene or render loop was introduced;
- all prior focused W766/W767 tests remain green.

## Environment limitations retained

No production build, authenticated browser render, live GLB presentation proof, foreground FPS proof, W747 spatial proof or deployment is claimed. The exact locked dependency install remains unavailable because the configured package source cannot provide `ws@7.5.11`.

## Next bounded coding wave

W767F should complete first-minute onboarding clarity:

1. guide the user through finding EONBOT, opening the regional map and reaching Pathfinder;
2. expose a short-lived, non-blocking orientation card;
3. support keyboard `M` and an explicit map action;
4. certify whether the key first-minute comprehension events occurred within the bounded window;
5. hide the orientation once completed, dismissed or returned to the Command Hub.
