import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import {
  W140_COMMAND_CENTER_SCHEMA,
  W140_PROTECTED_USER_STORAGE_KEYS,
  buildW140CommandCenterLayer,
  buildW140CommandCenterPlan,
  scoreW140CommandCenterPlan
} from '../../assets/js/realm3d/engine/EonCityW140CommandCenterRuntime.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('W140 command center plan covers launcher apps, zones, and user-data safety', () => {
  const plan = buildW140CommandCenterPlan({ quality: 'standard', worldKind: 'private-workstation', owner: 'unit' });
  const score = scoreW140CommandCenterPlan(plan);
  assert.equal(plan.schema, W140_COMMAND_CENTER_SCHEMA);
  assert.equal(score.score, 100);
  assert.equal(score.ok, true);
  assert.ok(plan.zones.length >= 6);
  assert.ok(plan.appDeck.length >= 10);
  assert.ok(plan.quickActions.length >= 6);
  assert.equal(plan.layoutPolicy.minimumTapTargetPx >= 48, true);
  assert.equal(plan.privacyPolicy.noApiKeysRendered, true);
  assert.equal(plan.storageSafety.backupPhaseSeparated, true);
  assert.ok(plan.storageSafety.protectedKeys.includes('eon:api-key-vault:v1'));
  assert.ok(plan.storageSafety.protectedKeys.includes('eon:nft-collection:v3'));
});

test('W140 private workstation world embeds the command center score', () => {
  const world = buildPrivateWorkstationVoxelWorld({ owner: 'unit' });
  assert.equal(world.kind, 'private-workstation');
  assert.equal(world.w140CommandCenterPlan.schema, W140_COMMAND_CENTER_SCHEMA);
  assert.equal(world.w140CommandCenterScore.score, 100);
  assert.ok(world.w140CommandCenterPlan.appDeck.some((app) => app.id === 'vault' && /redacted/i.test(app.secretPolicy)));
  assert.ok(world.w140CommandCenterPlan.appDeck.some((app) => app.id === 'market' && app.zoneId === 'market-nft-ops'));
});

test('W140 3D layer is low-end safe and keeps every major visual as a use target', () => {
  const plan = buildW140CommandCenterPlan({ quality: 'low' });
  const layer = buildW140CommandCenterLayer({ quality: 'low', plan });
  assert.equal(layer.stats.schema, W140_COMMAND_CENTER_SCHEMA);
  assert.equal(layer.stats.appMonitorCount, plan.appDeck.length);
  assert.equal(layer.stats.zoneCount, plan.zones.length);
  assert.equal(layer.stats.everyVisualClusterHasUseTarget, true);
  assert.equal(layer.stats.noSecretRendering, true);
  assert.ok(layer.animated.length >= plan.zones.length + plan.appDeck.length);
  assert.ok(W140_PROTECTED_USER_STORAGE_KEYS.length >= 10);
});

test('W140 command center UI, engine, CSS, and gate artifacts are wired', () => {
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /realmCommandCenterSession\s*=\s*'w140'/);
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /openW140CommandCenter/);
  assert.match(read('assets/js/realm3d/engine/EngineBoot.js'), /data-realm3d-command-center/);
  assert.match(read('assets/js/realm3d/engine/EonCityFlagshipScene.js'), /buildW140CommandCenterLayer/);
  assert.match(read('assets/js/realm3d/engine/WorldPanels.js'), /data-w140-command-center="true"/);
  assert.match(read('assets/js/realm3d/engine/WorldPanels.js'), /Protected storage keys/);
  assert.match(read('assets/css/realm3d.css'), /W140 EON City command-center redesign/);
  const statsPath = path.join(root, 'tmp', 'w140-eoncity-command-center-redesign-stats.json');
  if (!fs.existsSync(statsPath)) {
    fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
    execFileSync(process.execPath, [path.join(root, 'scripts', 'w140-eoncity-command-center-redesign-gate.mjs')], { cwd: root, stdio: 'ignore' });
  }
  const stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
  assert.equal(stats.schema, W140_COMMAND_CENTER_SCHEMA);
  assert.equal(stats.score, 100);
  assert.equal(stats.ok, true);
});
