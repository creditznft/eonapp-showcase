import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEonExpanseW768SConstructionCeremonyDirector } from '../../assets/js/city/w768/eon-expanse-w768s-my-frontier-construction-ceremony.js';

const presentation = (status = 'empty') => ({ plots: [{ plotId: 'plot-creator', status, constructedBuildingId: status === 'constructed-foundation' ? 'creator-workshop' : '', buildingLabel: 'Creator Workshop' }] });

test('W768S treats restored construction as baseline and does not replay ceremonies on load', () => {
  const director = createEonExpanseW768SConstructionCeremonyDirector();
  assert.equal(director.notePresentation(presentation('constructed-foundation'), { at: 100 }).active.length, 0);
});

test('W768S starts one bounded ceremony only for a newly verified foundation transition', () => {
  const director = createEonExpanseW768SConstructionCeremonyDirector({ durationMs: 1000 });
  director.notePresentation(presentation('empty'), { at: 100 });
  const started = director.notePresentation(presentation('constructed-foundation'), { at: 200 });
  assert.equal(started.active.length, 1);
  assert.equal(started.active[0].plotId, 'plot-creator');
  assert.equal(director.update({ at: 701 }).active[0].progress > 0.4, true);
  assert.equal(director.update({ at: 1200 }).active.length, 0);
});

test('W768S reduced motion uses a brief bounded presentation and never owns rendering', () => {
  const director = createEonExpanseW768SConstructionCeremonyDirector({ reducedMotion: true });
  director.notePresentation(presentation('empty'), { at: 0 });
  const state = director.notePresentation(presentation('constructed-foundation'), { at: 10 });
  assert.equal(state.active[0].durationMs, 260);
  assert.equal(state.ownsRenderLoop, false);
  assert.equal(state.grantsXp, false);
  assert.equal(state.mutatesMissionState, false);
});

test('W768S has no timer, network, persistence or runtime ownership', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768s-my-frontier-construction-ceremony.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /setTimeout|setInterval|fetch\s*\(|localStorage|runRenderLoop|new\s+(?:BABYLON\.)?(?:Engine|Scene)|awardXp/);
});

test('W768S is rendered by the canonical My Frontier renderer and existing City render loop', () => {
  const renderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(renderer, /createEonExpanseW768SConstructionCeremonyDirector/);
  assert.match(renderer, /construction-ring/);
  assert.match(renderer, /construction-beam/);
  assert.match(renderer, /update\(at = ceremonyClock\(\), playerPosition = null\)/);
  assert.match(runtime, /expanseMyFrontierRenderer\?\.update\?\.\(timeMs, playerAnchor\.position\)/);
  assert.equal((runtime.match(/runRenderLoop/g) || []).length, 1);
  assert.equal((runtime.match(/new\s+(?:BABYLON\.)?Engine/g) || []).length, 1);
  assert.equal((runtime.match(/new\s+(?:BABYLON\.)?Scene/g) || []).length, 1);
});
