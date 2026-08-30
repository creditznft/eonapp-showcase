import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonCityL95AdaptiveSceneDetail, validateEonCityL95AdaptiveSceneDetail } from '../../assets/js/city/l95/eon-city-l95-adaptive-scene-detail.js';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('RT96 weak-device protection sheds decorative work before core gameplay', () => {
  const l0 = deriveEonCityL95AdaptiveSceneDetail({ protectionLevel: 0 });
  const l1 = deriveEonCityL95AdaptiveSceneDetail({ protectionLevel: 1 });
  const l2 = deriveEonCityL95AdaptiveSceneDetail({ protectionLevel: 2 });
  const l3 = deriveEonCityL95AdaptiveSceneDetail({ protectionLevel: 3 });
  for (const plan of [l0,l1,l2,l3]) assert.equal(validateEonCityL95AdaptiveSceneDetail(plan).ok, true);
  assert.equal(l0.ambient.exteriorCitizenBudget, 4);
  assert.equal(l1.ambient.exteriorCitizenBudget, 2);
  assert.equal(l2.ambient.exteriorCitizenBudget, 0);
  assert.equal(l1.ambient.cinematicVfx, false);
  assert.equal(l2.skyline.midDecor, false);
  assert.equal(l3.ambient.maintenanceActor, false);
  assert.equal(l3.preserve.player, true);
  assert.equal(l3.preserve.interactions, true);
});

test('RT96 W731 applies adaptive citizen/VFX/ambience shedding in the canonical runtime', () => {
  assert.match(runtime, /eonCityAmbientCitizenBudget/);
  assert.match(runtime, /world\.rt92CinematicVfx\?\.setActive/);
  assert.match(runtime, /activeAdaptiveDetail\.ambient\.stationHaloAnimation/);
  assert.match(runtime, /activeAdaptiveDetail\.ambient\.circuitPulseAnimation/);
});
