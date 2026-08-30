import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildEonCityVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W141_NPC_DEVICE_SCHEMA,
  W141_USER_DATA_SURVIVAL_PHASE,
  buildW141NpcDevicePlan,
  getW141RemainingPhaseSummary,
  resolveW141DeviceTier,
  scoreW141NpcDevicePlan
} from '../../assets/js/realm3d/engine/EonCityW141NpcDeviceRuntime.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('W141 scores NPC movement, robot quality, low mobile, and high desktop tiers', () => {
  const world = buildEonCityVoxelWorld();
  const plan = world.w141NpcDevicePlan;
  const score = world.w141NpcDeviceScore;
  assert.equal(plan.schema, W141_NPC_DEVICE_SCHEMA);
  assert.equal(score.score, 100);
  assert.equal(score.ok, true);
  assert.equal(plan.npcCount, world.npcs.length);
  assert.equal(plan.movingNpcCount, world.npcs.length);
  assert.ok(plan.robotNpcCount >= 1);
  assert.equal(plan.lowDevicePolicy.autoDowngradeEnabled, true);
  assert.equal(plan.lowDevicePolicy.maxActiveNpcs <= 4, true);
  assert.equal(plan.highDevicePolicy.nearAaaNpcTarget, true);
  assert.equal(plan.highDevicePolicy.futureW146NeededForFullAaa, true);
  assert.equal(plan.privacyPolicy.noApiKeysRendered, true);
});

test('W141 device resolver downgrades low phones and unlocks high-device neon', () => {
  const low = resolveW141DeviceTier({ quality: 'neon', mobile: true, touch: true, deviceMemory: 2, hardwareConcurrency: 2, webgl2: false, saveData: true });
  const high = resolveW141DeviceTier({ quality: 'neon', mobile: false, touch: false, deviceMemory: 16, hardwareConcurrency: 12, webgl2: true, saveData: false });
  assert.equal(low.id, 'low');
  assert.equal(low.autoDowngrade, true);
  assert.equal(low.lowDeviceProtected, true);
  assert.equal(high.id, 'neon');
  assert.equal(high.autoUpgrade, true);
  assert.equal(high.highDeviceCanLookNearAaa, true);
});

test('W141 reflects W145 Cloudflare update data survival completion', () => {
  const summary = getW141RemainingPhaseSummary();
  assert.equal(summary.dataSurvivalDone, true);
  assert.equal(summary.dataSurvivalPhase, 'W145');
  assert.equal(W141_USER_DATA_SURVIVAL_PHASE.status, 'completed-in-w145');
  assert.ok(W141_USER_DATA_SURVIVAL_PHASE.protectedStorage.includes('eon:api-key-vault:v1'));
  assert.ok(W141_USER_DATA_SURVIVAL_PHASE.protectedStorage.includes('eon:nft-collection:v3'));
  assert.ok(summary.phases.some((phase) => phase.id === 'W145' && /Cloudflare update-safe/.test(phase.title)));
  assert.ok(summary.phases.some((phase) => phase.id === 'W146' && /AAA graphics/.test(phase.title)));
});

test('W141 decorates private owner agents without exposing secrets', () => {
  const world = buildPrivateWorkstationVoxelWorld({ owner: 'unit' });
  assert.equal(world.w141NpcDeviceScore.score, 100);
  const ownerAgents = world.npcs.filter((npc) => npc.audience === 'owner-private-workspace-only');
  assert.ok(ownerAgents.length >= 6);
  for (const npc of ownerAgents) {
    assert.equal(npc.w141NpcQuality.robot, true);
    assert.equal(npc.w141NpcQuality.privacy.includes('no API keys'), true);
    assert.equal((npc.patrolPath || []).length >= 3, true);
    assert.equal(Number(npc.movement.speed) <= 0.48, true);
  }
});

test('W141 direct plan score covers CEO audit and future EON City phases', () => {
  const city = buildEonCityVoxelWorld();
  const plan = buildW141NpcDevicePlan({ quality: 'neon', worldKind: 'eon-city', npcs: city.npcs, device: { deviceMemory: 16, hardwareConcurrency: 12, webgl2: true } });
  const score = scoreW141NpcDevicePlan(plan);
  assert.equal(score.score, 100);
  assert.equal(plan.dataSurvivalDone, true);
  assert.ok(plan.ceoAudit.findings.some((finding) => finding.area === 'high-device-upscale'));
  assert.ok(plan.ceoAudit.findings.some((finding) => finding.area === 'privacy-and-user-data-safety'));
  for (const id of ['W143', 'W144', 'W145', 'W146', 'W147', 'W148']) {
    assert.ok(plan.remainingPhases.some((phase) => phase.id === id), `missing ${id}`);
  }
});

test('W141 engine, panels, character kit, CSS, package, and stats are wired', () => {
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /realmNpcDeviceSession\s*=\s*'w141'/);
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /getW141NpcDeviceState/);
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /data-w141-npc-device-tier/);
  assert.match(read('assets/js/realm3d/engine/WorldPanels.js'), /renderW141NpcDeviceAudit/);
  assert.match(read('assets/js/realm3d/engine/WorldPanels.js'), /data-w141-npc-device="true"/);
  assert.match(read('assets/js/realm3d/engine/EonCityCharacterKit.js'), /w141NpcDeviceQuality/);
  assert.match(read('assets/js/realm3d/engine/EonCityCharacterKit.js'), /character-w141-route-beacon/);
  assert.match(read('assets/css/realm3d.css'), /W141 NPC movement, robot quality, and device-tier performance/);
  const pkg = JSON.parse(read('package.json'));
  assert.ok(pkg.scripts['qa:w141-npc-device-quality']);
  const statsPath = path.join(root, 'tmp', 'w141-npc-device-quality-stats.json');
  if (!fs.existsSync(statsPath)) {
    fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
    execFileSync(process.execPath, [path.join(root, 'scripts', 'w141-npc-device-quality-gate.mjs')], { cwd: root, stdio: 'ignore' });
  }
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, W141_NPC_DEVICE_SCHEMA);
  assert.equal(stats.score, 100);
  assert.equal(stats.dataSurvivalDone, true);
});
