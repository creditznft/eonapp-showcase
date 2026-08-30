import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const renderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');

test('W769G mounts bounded operational circuit and utility presentation inside each authored plot root', () => {
  assert.match(renderer, /w769g-\$\{plot\.plotId\}-operational-ring/);
  assert.match(renderer, /w769g-\$\{plot\.plotId\}-utility-beacon/);
  assert.match(renderer, /operationalRing\.parent = stateRoot/);
  assert.match(renderer, /operationalBeacon\.parent = stateRoot/);
});

test('W769G enables operational presentation only from level-two upgrade projection plus verified construction', () => {
  assert.match(renderer, /upgradeByPlot/);
  assert.match(renderer, /entry\.foundationVisible && Number\(upgrade\?\.level \|\| 0\) >= 2/);
  assert.match(renderer, /upgrade\?\.upgradeStatus === 'operational'/);
  assert.match(renderer, /target\.operationalRing\.setEnabled\(operational\)/);
  assert.match(renderer, /target\.operationalBeacon\.setEnabled\(operational\)/);
});

test('W769G keeps foundation and scaffolding truth visible at operational level', () => {
  assert.match(renderer, /target\.foundation\.setEnabled\(entry\.foundationVisible\)/);
  assert.match(renderer, /target\.scaffoldRoot\.setEnabled\(entry\.scaffoldingVisible\)/);
  assert.match(renderer, /levelThreeLandmarkArtPending: true/);
  assert.doesNotMatch(renderer, /finishedHeroPrimitives:\s*[1-9]/);
});

test('W769G reports district level through the maintained plot interaction without XP', () => {
  assert.match(renderer, /districtLevel: operational \? 2 : 1/);
  assert.match(renderer, /districtUpgradeStatus: operational \? 'operational' : 'foundation'/);
  assert.match(renderer, /operationalDistrictCount: operationalCount/);
  assert.match(renderer, /grantsXp: false/);
});

test('W769G reuses the canonical renderer and owns no engine, scene or render loop', () => {
  assert.doesNotMatch(renderer, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|runRenderLoop\s*\(/);
  assert.match(renderer, /oneEngine: true, oneScene: true, oneRenderLoop: true/);
});
