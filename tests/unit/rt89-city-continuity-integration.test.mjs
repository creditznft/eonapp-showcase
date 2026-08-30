import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('RT89 exposes one durable next-action projection through the canonical Signal Frontier overlay', async () => {
  const runtime = await read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /deriveEonExpanseW772GPersistentNextAction/);
  assert.match(runtime, /persistentNextAction/);
  assert.match(runtime, /persistentGuidancePresentation/);
  assert.match(overlay, /data-eon-expanse-primary-next-action/);
  assert.match(overlay, /persistentNextActionVisible/);
  assert.match(overlay, /onPrimaryNextAction/);
  assert.match(overlay, /open-mission-board/);
});

test('RT89 exposes bounded Storm owner-review and My Frontier menu diagnostics without changing progression truth', async () => {
  const runtime = await read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  for (const field of [
    'eonCityStormAvailable',
    'eonCityStormOwnerReview',
    'eonCityStormReviewOnly',
    'eonCityStormReason',
    'eonCityStormMenuState',
    'eonCityStormButtonDisabled',
    'eonCityStormButtonLabel',
    'eonCityMyFrontierAvailable',
    'eonCityMyFrontierReason'
  ]) assert.match(runtime, new RegExp(field));
  assert.match(runtime, /ownerReview: availability\.stormSector\.ownerReview === true/);
  assert.match(runtime, /grantsXp: false/);
});

test('RT89 My Frontier entry records every real boundary and catches renderer failure truthfully', async () => {
  const runtime = await read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  for (const stage of ['request','availability','starter-unlock','expanse-entry','entry-target','renderer-mount','renderer-activate','scene-prepared','first-frame']) {
    assert.match(runtime, new RegExp(`['\"]${stage}['\"]`));
  }
  assert.match(runtime, /try \{\s*myFrontierRenderer = ensureMyFrontierRenderer\(\)/);
  assert.match(runtime, /w768i-my-frontier-renderer-mount-failed/);
  assert.match(runtime, /myFrontierEntryAwaitingFirstFrame/);
  assert.match(runtime, /canonical-scene-rendered/);
  assert.match(runtime, /mounted-inactive/);
  assert.match(runtime, /previousRegionPreserved: true/);
  assert.match(runtime, /Retire the previous presentation only after the destination/);
  assert.doesNotMatch(runtime, /my-frontier.*fake.*fallback/i);
});

test('RT89 keyboard, pointer and touch interaction paths share one diagnostic dispatch and rejected E is no longer silent', async () => {
  const runtime = await read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /recordExpanseInteractionDiagnostic/);
  assert.match(runtime, /eonCityLastExpanseInteractionAccepted/);
  assert.match(runtime, /eonCityLastExpanseInteractionReason/);
  assert.match(runtime, /activeInputLockOwners/);
  assert.match(runtime, /source: 'keyboard-e'/);
  assert.match(runtime, /source: 'expanse-3d-pick'/);
  assert.match(overlay, /source: 'touch-hud'/);
  assert.match(runtime, /Move closer to the highlighted object, then press E \/ tap Use\./);
  assert.match(runtime, /lastRawKeyboardEvent = freeze\(\{ \.\.\.rawEvent\(\), accepted: interacted\.ok === true/);
});

test('RT89 current Command Hub mounts the maintained camera sightline controller and Expanse retires duplicate base HUD ownership', async () => {
  const runtime = await read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const frontier = await read('assets/js/city/w766/eon-expanse-w766b-signal-frontier.js');
  const css = await read('assets/css/eon-city-play.css');
  assert.match(runtime, /createEonCityCameraOcclusionController/);
  assert.match(runtime, /cameraOcclusion\.update\(frameAt\)/);
  assert.match(runtime, /eonCityCameraSightlineProtected/);
  assert.match(runtime, /cameraOcclusion\.destroy/);
  assert.match(frontier, /family: 'beacon-shard'.*eonCityCameraOcclusion: true/);
  assert.match(frontier, /decorativeOnly: true, interactive: false, eonCityCameraOcclusion: true/);
  assert.match(css, /data-eon-city-presentation-mode="expanse"[^\n]*>\.eon-city-reduced-hud \.eon-city-reduced-brand/);
  assert.match(css, /data-eon-city-presentation-mode="expanse"[^\n]*>\.eon-city-reduced-objective\{display:none!important\}/);
});

test('RT89 world labels use a deterministic viewport and avatar safe zone', async () => {
  const { projectEonExpanseW766HLabelSafePosition } = await import('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  const centre = projectEonExpanseW766HLabelSafePosition({ x: 640, y: 430, viewportWidth: 1280, viewportHeight: 720, index: 0 });
  assert.equal(centre.adjusted, true);
  assert.equal(centre.reason, 'avatar-safe-zone');
  assert.notEqual(centre.x, 640);
  const edge = projectEonExpanseW766HLabelSafePosition({ x: -40, y: 999, viewportWidth: 1280, viewportHeight: 720, index: 1 });
  assert.equal(edge.adjusted, true);
  assert.equal(edge.reason, 'viewport-clamp');
  assert.ok(edge.x > 0 && edge.x < 1280);
  assert.ok(edge.y > 0 && edge.y < 720);
});

test('RT89 Mission Board is viewport-bounded with a sticky accessible close/header', async () => {
  const overlay = await read('assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(overlay, /data-eon-expanse-ui="board-header"/);
  assert.match(overlay, /\[data-eon-expanse-ui="board-header"\]\{position:sticky;top:0/);
  assert.match(overlay, /overscroll-behavior:contain/);
  assert.match(overlay, /scrollbar-gutter:stable/);
  assert.match(overlay, /min-height:44px/);
  assert.match(overlay, /boardHeader\.append\(title,close\)/);
});
