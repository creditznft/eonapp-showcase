import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEonExpanseW769JUpgradeCeremonyDirector } from '../../assets/js/city/w769/eon-expanse-w769j-my-frontier-upgrade-ceremony.js';

const projection = (operational = false) => ({ plots: [{ plotId: 'plot-creator', buildingId: 'creator-workshop', level: operational ? 2 : 1, upgradeStatus: operational ? 'operational' : 'foundation', upgradeReceiptId: operational ? 'upgraded:permit-1' : '' }] });

test('W769J treats restored operational districts as baseline and does not replay ceremonies', () => {
  const director = createEonExpanseW769JUpgradeCeremonyDirector();
  assert.equal(director.noteProjection(projection(true), { at: 100 }).active.length, 0);
});

test('W769J starts one bounded ceremony only for a newly verified operational transition', () => {
  const director = createEonExpanseW769JUpgradeCeremonyDirector({ durationMs: 1000 });
  director.noteProjection(projection(false), { at: 100 });
  const started = director.noteProjection(projection(true), { at: 200 });
  assert.equal(started.active.length, 1);
  assert.equal(started.active[0].plotId, 'plot-creator');
  assert.equal(director.update({ at: 701 }).active[0].progress > 0.4, true);
  assert.equal(director.update({ at: 1200 }).active.length, 0);
});

test('W769J reduced motion is brief and owns no progression or render loop', () => {
  const director = createEonExpanseW769JUpgradeCeremonyDirector({ reducedMotion: true });
  director.noteProjection(projection(false), { at: 0 });
  const state = director.noteProjection(projection(true), { at: 10 });
  assert.equal(state.active[0].durationMs, 240);
  assert.equal(state.ownsRenderLoop, false);
  assert.equal(state.grantsXp, false);
  assert.equal(state.mutatesMissionState, false);
  assert.equal(state.automaticUpgrade, false);
});

test('W769J owns no timer, persistence, network, runtime or automatic upgrade authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w769/eon-expanse-w769j-my-frontier-upgrade-ceremony.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /setTimeout|setInterval|fetch\s*\(|localStorage|runRenderLoop|new\s+(?:BABYLON\.)?(?:Engine|Scene)|awardXp|confirmUpgrade/);
});

test('W769J is driven by the canonical renderer and receives the real upgrade projection', () => {
  const renderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(renderer, /createEonExpanseW769JUpgradeCeremonyDirector/);
  assert.match(renderer, /noteProjection\(upgradeProjection/);
  assert.match(renderer, /apply\(\{ unlocked: nextUnlocked = false, myFrontierState = \{\}, constructionProjection = \{\}, upgradeProjection = \{\}/);
  assert.match(renderer, /activate\(\{ unlocked: nextUnlocked = false, myFrontierState = \{\}, constructionProjection = \{\}, upgradeProjection = \{\}/);
  assert.match(renderer, /activeOperationalUpgradeCeremonies/);
  assert.match(runtime, /expanseMyFrontierRenderer\?\.update\?\.\(timeMs, playerAnchor\.position\)/);
  assert.equal((runtime.match(/runRenderLoop/g) || []).length, 1);
});
