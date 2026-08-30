import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  deriveEonCityL95AdaptiveSceneDetail,
  validateEonCityL95AdaptiveSceneDetail
} from '../../assets/js/city/l95/eon-city-l95-adaptive-scene-detail.js';

const runtimeSource = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('L95 scene pressure sheds distant decoration before any gameplay or hero surface', () => {
  const nominal = deriveEonCityL95AdaptiveSceneDetail({ protectionLevel: 0 });
  const level1 = deriveEonCityL95AdaptiveSceneDetail({ protectionLevel: 1 });
  const level2 = deriveEonCityL95AdaptiveSceneDetail({ protectionLevel: 2 });
  assert.equal(validateEonCityL95AdaptiveSceneDetail(nominal).ok, true);
  assert.equal(validateEonCityL95AdaptiveSceneDetail(level1).ok, true);
  assert.equal(validateEonCityL95AdaptiveSceneDetail(level2).ok, true);
  assert.equal(level1.skyline.towerSilhouettes, true);
  assert.equal(level1.skyline.nearDecor, true);
  assert.equal(level1.skyline.farDecor, false);
  assert.equal(level2.skyline.midDecor, false);
  assert.equal(level2.skyline.distantTransit, false);
  assert.ok(Object.values(level2.preserve).every(Boolean));
  assert.equal(level2.truth.changesSelectedQuality, false);
});

test('W731 FPS protection applies scene-detail shedding in addition to hardware scaling', () => {
  assert.match(runtimeSource, /deriveEonCityL95AdaptiveSceneDetail/);
  assert.match(runtimeSource, /applyAdaptiveSceneDetail/);
  assert.match(runtimeSource, /skylineWindowRows/);
  assert.match(runtimeSource, /skylineFacadeBands/);
  assert.match(runtimeSource, /skylineLightStrips/);
  assert.match(runtimeSource, /skylineTransitRoot/);
  assert.match(runtimeSource, /sceneDetail/);
});
