# W767D — Unified Expanse Authored-Asset Truth Diagnostics

## Authority

- Base commit: `55bb7a5` (`fix(expanse): avoid duplicate proximity prompt`)
- Working branch: `chatgpt/w767-expanse-companion-clarity`
- Runtime boundary: the existing canonical Babylon engine, scene, Gateway, NPC runtime and living-content runtime remain authoritative
- Deployment: none
- Production/browser certification: not claimed

## Delivered scope

### 1. One bounded asset-truth report

W767D combines the existing hero landmark, NPC and activity asset summaries into one canonical report:

- `eon.city.expanse.asset-diagnostics.w767d.v1`
- requested, presented, pending and rejected counts;
- primary, authored-fallback and procedural-fallback classification;
- five-zone hero-landmark coverage;
- missing-zone identification;
- bounded failure reasons and attempted asset paths;
- an explicit `releaseReady` result.

A fulfilled import promise is not treated as proof that an asset is visibly presented.

### 2. Hero landmark pending and failure truth

The hero-asset runtime now retains:

- pending placement IDs;
- zone IDs for rejected landmarks;
- attempted primary/fallback paths;
- validated visible mesh, material and world-bound evidence for presented landmarks.

A procedural proxy remains represented as such until the authored presentation passes its existing validation gate.

### 3. NPC and activity diagnostics

NPC loading now records every attempted authored path and its bounded failure reason. Activity anchors expose detailed loaded, failed and pending asset states instead of only aggregate counts.

These records contain safe authored IDs and technical paths only. They do not project prompts, credentials, private file names or project content.

### 4. Canonical Gateway/runtime access

The Gateway owns report assembly from its existing child controllers. The Command Hub runtime exposes:

- `getExpanseAssetTruthReport()` for in-memory inspection;
- `exportExpanseAssetTruthReport({ explicitUserAction: true })` for a source-safe JSON receipt.

Export fails closed without explicit user action. UI synchronization receives only bounded counts and a release-ready flag.

### 5. Release boundary

`releaseReady` is true only when:

- no asset is pending;
- no presentation has a failure reason;
- no procedural fallback remains;
- every expected Signal Frontier zone has at least one visibly presented authored hero landmark.

An authored fallback can remain acceptable when it has itself passed visible-presentation validation. Browser evidence remains mandatory before release certification.

## Validation completed

Evidence: `W767D_FOCUSED_REGRESSION_161_PASS.log`

- Tests: 161
- Pass: 161
- Fail: 0
- Skipped: 0

Additional checks:

- syntax checks pass for all changed JavaScript modules;
- Git diff/whitespace check passes;
- loading and rejected states remain distinct;
- five-zone coverage calculation passes;
- private/unrelated fields are excluded from export;
- explicit-action export enforcement passes;
- canonical Gateway/runtime integration passes;
- no second engine or scene owner was introduced;
- all prior focused W766/W767 tests remain green.

## Environment limitations retained

No production build, authenticated browser render, live GLB presentation audit, foreground FPS proof, W747 spatial proof or deployment is claimed. The locked dependency install remains unavailable in this sandbox because the configured package source cannot provide `ws@7.5.11`.

## Next bounded coding wave

W767E should apply the same visible-presentation gate to NPC and activity authored assets themselves:

1. validate non-empty visible renderable meshes after import;
2. validate finite bounds, scale, grounding and expected-zone placement;
3. keep procedural fallbacks visible until validation succeeds;
4. record actual mesh/material/bounds evidence rather than inferred counts;
5. reject and dispose malformed or off-world imports before trying the next authored variant.
