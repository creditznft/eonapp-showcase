#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import { buildWorkstationInteractionPlan, scoreWorkstationRuntime } from '../assets/js/realm3d/engine/EonCityWorkstationRuntime.js';

const worlds = [buildEonCityVoxelWorld(), buildPrivateWorkstationVoxelWorld(), buildMyRealmVoxelWorld({ username: 'gate' })];
for (const world of worlds) {
  assert.ok(world.upgradeMarketScore?.total >= 96, `${world.kind} upgrade market not ready`);
  assert.ok(world.livePanelScore?.total >= 82, `${world.kind} live panel readiness not ready`);
  assert.equal(world.upgradeMarketRuntime?.privacy?.noRawIpStorage, true, `${world.kind} raw IP privacy missing`);
  assert.equal(world.upgradeMarketRuntime?.privacy?.providerPostbackValueOnly, true, `${world.kind} provider value rule missing`);
}
const plan = buildWorkstationInteractionPlan({ quality: 'pro-city' });
const score = scoreWorkstationRuntime(plan);
assert.equal(score.checks.hasUpgradeMarketRuntime, true, 'workstation missing in-world upgrade runtime');
assert.equal(score.checks.hasLivePanelPolicy, true, 'workstation missing live panel policy');
console.log(JSON.stringify({ ok: true, worlds: worlds.map((world) => ({ kind: world.kind, upgradeMarketScore: world.upgradeMarketScore.total, livePanelScore: world.livePanelScore.total })), workstationScore: score.total }, null, 2));
