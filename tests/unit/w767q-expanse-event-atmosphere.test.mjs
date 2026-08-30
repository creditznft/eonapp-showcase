import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW767QEventAtmosphere } from '../../assets/js/city/w766/eon-expanse-w767q-event-atmosphere.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('W767Q maps each known event to a bounded navigation-safe atmosphere', () => {
  for (const eventId of ['signal-storm','archive-pulse','transit-interruption','rare-cosmetic-signal','lost-drone']) {
    const state = deriveEonExpanseW767QEventAtmosphere({ id: eventId });
    assert.equal(state.active, true);
    assert.equal(state.eventId, eventId);
    assert.ok(state.fogMultiplier >= 0.85 && state.fogMultiplier <= 1.2);
    assert.ok(state.moteSpeedMultiplier >= 0.75 && state.moteSpeedMultiplier <= 1.25);
    assert.ok(state.pulseIntensity >= 0 && state.pulseIntensity <= 0.1);
    assert.equal(state.preservesNavigation, true);
  }
});

test('W767Q reduced motion removes pulse and speed modulation', () => {
  const state = deriveEonExpanseW767QEventAtmosphere({ id: 'signal-storm' }, { reducedMotion: true });
  assert.equal(state.active, true);
  assert.equal(state.pulseIntensity, 0);
  assert.equal(state.moteSpeedMultiplier, 1);
});

test('W767Q unknown or inactive events restore neutral atmosphere', () => {
  for (const state of [deriveEonExpanseW767QEventAtmosphere(null), deriveEonExpanseW767QEventAtmosphere({ id: 'unknown' }), deriveEonExpanseW767QEventAtmosphere({ id: 'signal-storm' }, { active: false })]) {
    assert.equal(state.active, false);
    assert.equal(state.fogMultiplier, 1);
    assert.equal(state.moteSpeedMultiplier, 1);
    assert.equal(state.pulseIntensity, 0);
    assert.equal(state.externalWeatherData, false);
  }
});

test('W767Q extends the existing visual director and canonical render loop only', async () => {
  const visual = await read('../../assets/js/city/w766/eon-expanse-w766g-visual-director.js');
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(visual, /deriveEonExpanseW767QEventAtmosphere/);
  assert.match(visual, /applyDynamicEvent/);
  assert.match(runtime, /expanseVisuals\.applyDynamicEvent/);
  assert.doesNotMatch(visual, /new Engine|new Scene|runRenderLoop/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
