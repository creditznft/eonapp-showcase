import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonCityRt92CommandHubGoldMasterPlan, validateEonCityRt92CommandHubGoldMasterPlan } from '../../assets/js/city/rt92/command-hub/eon-city-rt92-command-hub-gold-master.js';

test('RT92 Command Hub gold-master plan is sharp, bounded and binary-free', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const plan = buildEonCityRt92CommandHubGoldMasterPlan({ quality });
    assert.equal(validateEonCityRt92CommandHubGoldMasterPlan(plan).ok, true);
    assert.equal(plan.performance.firstFrameNewBinaryBytes, 0);
    assert.ok(plan.materialLaw.emissiveShareMax <= 0.1);
    assert.equal(plan.verticality.collisionFreeDecoration, true);
  }
});

test('maintained W731 runtime mounts and animates the RT92 gold-master layer', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  for (const marker of ['createRt92CommandHubGoldMasterLayer', 'rt92-command-hub-art-root', 'nexusOrbitRings', 'microTraceNodes', 'guidePylons', 'overheadFins']) assert.match(source, new RegExp(marker));
  assert.match(source, /rt92CommandHubArt\.nexusOrbitRings/);
  assert.match(source, /rt92CommandHubArt\.pulseNodes/);
});
