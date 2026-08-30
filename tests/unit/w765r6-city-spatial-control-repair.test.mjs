import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  resolveEonCityCameraGroundBasis,
  resolveEonCityCameraRelativeMovement
} from '../../assets/js/city/eon-city-camera-relative-movement.js';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function dot(a, b) {
  return (a.x * b.x) + (a.z * b.z);
}

test('W765R6 canonical camera basis maps left and right to opposite screen sides', () => {
  const cameraPosition = { x: 0, z: -10 };
  const cameraTarget = { x: 0, z: 0 };
  const basis = resolveEonCityCameraGroundBasis({ cameraPosition, cameraTarget });
  const left = resolveEonCityCameraRelativeMovement({ inputRight: -1, cameraPosition, cameraTarget, deadZone: 0 });
  const right = resolveEonCityCameraRelativeMovement({ inputRight: 1, cameraPosition, cameraTarget, deadZone: 0 });

  assert.ok(dot(left, basis.right) < -0.999, 'left input must move toward screen-left');
  assert.ok(dot(right, basis.right) > 0.999, 'right input must move toward screen-right');
  assert.ok(Math.abs(left.x + right.x) < 1e-9);
  assert.ok(Math.abs(left.z + right.z) < 1e-9);
});

test('W765R6 diagonal and held-intent normalization preserve the left/right sign', () => {
  const poses = [
    [{ x: 0, z: -10 }, { x: 0, z: 0 }],
    [{ x: 10, z: 0 }, { x: 0, z: 0 }],
    [{ x: -7, z: 5 }, { x: 1, z: -2 }]
  ];
  for (const [cameraPosition, cameraTarget] of poses) {
    const basis = resolveEonCityCameraGroundBasis({ cameraPosition, cameraTarget });
    for (const inputRight of [-1, 1]) {
      const move = resolveEonCityCameraRelativeMovement({ inputRight, inputForward: 1, cameraPosition, cameraTarget, deadZone: 0 });
      assert.ok(move.active);
      assert.ok(inputRight * dot(move, basis.right) > 0, 'diagonal motion must retain requested screen side');
      assert.ok(Math.abs(Math.hypot(move.x, move.z) - 1) < 1e-9, 'held input must remain normalized');
    }
  }
});

test('W765R6 live Command Hub delegates movement direction to the canonical authority', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /resolveEonCityCameraRelativeMovement/);
  assert.match(runtime, /inputRight:\s*input\.right/);
  assert.match(runtime, /inputForward:\s*input\.forward/);
  assert.doesNotMatch(runtime, /const right = new Vector3\(-forward\.z, 0, forward\.x\)/);
});

test('W765R6 keyboard and directional-control authorities preserve semantic left/right', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const contract = read('assets/js/city/eon-city-input-contract.js');
  assert.match(runtime, /KeyA:\s*'left'/);
  assert.match(runtime, /ArrowLeft:\s*'left'/);
  assert.match(runtime, /KeyD:\s*'right'/);
  assert.match(runtime, /ArrowRight:\s*'right'/);
  assert.match(runtime, /heldKeys\.set\(keyboardCode, directionName\)/);
  assert.match(runtime, /heldKeys\.delete\(keyboardCode\)/);
  assert.match(contract, /left:\s*'left'/);
  assert.match(contract, /right:\s*'right'/);
  assert.match(contract, /runtime\.setMove\(direction, Boolean\(enabled\)/);
  assert.match(contract, /runtime\.setMove\(direction, false/);
});

test('W765R6 station monitor orientation points the readable front face toward approach focus', async () => {
  const monitorModule = await import('../../assets/js/city/w765/eon-city-w765r5-station-monitor.js');
  const station = { position: { x: 8, y: 0, z: 3 }, focus: { x: 0, y: 0, z: 0 } };
  const profile = { setback: 1.8, y: 2.7 };
  const pose = monitorModule.resolveEonCityW765R5MonitorPose({ station, profile });
  const facing = monitorModule.validateEonCityW765R5MonitorFacing({
    worldPosition: pose.worldPosition,
    yaw: pose.yaw,
    focusPose: pose.focusPose
  });
  assert.equal(pose.ok, true);
  assert.equal(facing.ok, true);
  assert.ok(facing.dot >= 0.999, 'readable -Z display face must point toward the approach focus');

  const source = read('assets/js/city/w765/eon-city-w765r5-station-monitor.js');
  assert.match(source, /readable front on local -Z/);
  assert.match(source, /screen\.position\.z = -depth \* 0\.58/);
  assert.match(source, /readableFrontAxis: 'negative-z'/);
});

test('W765R6 canopy supports stay outside the camera corridor and reduce obstruction count', async () => {
  const spatial = await import('../../assets/js/city/w765/eon-city-w765r6-spatial-control-repair.js');
  const report = spatial.inspectEonCityW765R6CanopySupports();
  assert.equal(report.ok, true);
  assert.equal(report.supportCount, 4);
  assert.equal(report.violations.length, 0);
});

test('W766IR2-A discovery policy keeps the canonical Expanse Gate truthful and actionable', async () => {
  const spatial = await import('../../assets/js/city/w765/eon-city-w765r6-spatial-control-repair.js');
  const contract = await import('../../assets/js/city/w731/eon-city-w731-command-hub-contract.js');
  const report = spatial.validateEonCityW765R6DiscoveryPolicy(contract.EON_CITY_W737_DISCOVERIES);
  assert.equal(report.ok, true);
  assert.equal(spatial.EON_CITY_W765R6_DISCOVERY_POLICY['expanse-gate'].interactive, true);
  assert.equal(spatial.EON_CITY_W765R6_DISCOVERY_POLICY['expanse-gate'].truthfulRole, 'canonical-expanse-entry-gateway');
  assert.equal(spatial.EON_CITY_W765R6_DISCOVERY_POLICY['expanse-gate'].action, 'review-enter-cancel');
});

test('W765R6 NPC exclusion zones protect stations and central camera-safe space', async () => {
  const spatial = await import('../../assets/js/city/w765/eon-city-w765r6-spatial-control-repair.js');
  const contract = await import('../../assets/js/city/w731/eon-city-w731-command-hub-contract.js');
  const zones = spatial.createEonCityW765R6NpcExclusionZones(contract.EON_CITY_W731_STATIONS);
  assert.equal(zones.length, contract.EON_CITY_W731_STATIONS.length);
  const safeRoute = [{ x: 24, z: 0 }, { x: 23, z: 5 }, { x: 21, z: 11 }];
  assert.equal(spatial.inspectEonCityW765R6NpcRoute(safeRoute, zones).ok, true);
  const unsafeRoute = [{ x: 0, z: 7.2 }];
  assert.equal(spatial.inspectEonCityW765R6NpcRoute(unsafeRoute, zones).ok, false);
});

test('W765R6 assigns stationary operators and bounded local walkers', async () => {
  const cast = await import('../../assets/js/city/w754/eon-city-w754-cast-eonbot-npc-transit.js');
  const plan = cast.buildEonCityW754NpcSchedulePlan();
  for (const stationId of ['command-console', 'automation-theatre', 'local-ai-lab', 'plans-access']) {
    const entry = plan.schedules.find((candidate) => candidate.stationId === stationId);
    assert.equal(entry.role, 'stationary-operator');
    assert.equal(entry.enabled, false);
  }
  assert.equal(plan.schedules.every((entry) => entry.crossesCentralSpawn === false), true);
  assert.equal(plan.schedules.every((entry) => entry.fallbackWhenBlocked === 'idle'), true);
});

test('W765R6 ambient citizens stay on the outer walking ring', () => {
  const runtimeSource = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const radii = [...runtimeSource.matchAll(/assetAlias: 'ambient-citizen-[^']+', radius: ([0-9.]+)/g)].map((match) => Number(match[1]));
  assert.equal(radii.length, 4);
  assert.equal(radii.every((radius) => radius >= 23.2), true);
});

test('W765R6 spatial diagnostics warn only for actionable layout defects', () => {
  const runtimeSource = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtimeSource, /const actionableSpatialDefect = spatialReport\.arrivalOccluders\.length > 0/);
  assert.match(runtimeSource, /actionableSpatialDefect \? console\.warn : console\.debug/);
});

test('W765R6 monitor profiles are restrained, separated and outside central camera-safe space', async () => {
  const spatial = await import('../../assets/js/city/w765/eon-city-w765r6-spatial-control-repair.js');
  const monitor = await import('../../assets/js/city/w765/eon-city-w765r5-station-monitor.js');
  const contract = await import('../../assets/js/city/w731/eon-city-w731-command-hub-contract.js');
  const report = spatial.inspectEonCityW765R6MonitorLayout(
    contract.EON_CITY_W731_STATIONS,
    monitor.EON_CITY_W765R5_MONITOR_PROFILES,
    monitor.resolveEonCityW765R5MonitorPose
  );
  assert.equal(report.ok, true, JSON.stringify(report.violations));
  assert.equal(Object.values(monitor.EON_CITY_W765R5_MONITOR_PROFILES).every((profile) => profile.width <= 4.45), true);
});

test('W765R6 floor routes remain below the obstruction threshold', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /kind: 'w765r6-floor-route'/);
  assert.match(runtime, /floorOnly: true/);
  assert.match(runtime, /path\.position\.set\([^\n]+, 0\.035,/);
  assert.doesNotMatch(runtime, /w731-path-\$\{id\}.*height: 0\.05/);
});

test('W765R6 every visible station and discovery has a truthful registered interaction', async () => {
  const spatial = await import('../../assets/js/city/w765/eon-city-w765r6-spatial-control-repair.js');
  const contract = await import('../../assets/js/city/w731/eon-city-w731-command-hub-contract.js');
  const registryModule = await import('../../assets/js/city/w748/eon-city-w748-interaction-registry.js');
  const registry = registryModule.createEonCityW748InteractionRegistry();
  const report = spatial.auditEonCityW765R6VisibleDestinations({
    stations: contract.EON_CITY_W731_STATIONS,
    discoveries: contract.EON_CITY_W737_DISCOVERIES,
    interactionIds: registry.list({ visibleOnly: false }).map((entry) => entry.id)
  });
  assert.equal(report.ok, true, JSON.stringify(report.missing));
});

test('W765R6 animation return authority never leaves one-shot interaction or wave active', async () => {
  const spatial = await import('../../assets/js/city/w765/eon-city-w765r6-spatial-control-repair.js');
  assert.equal(spatial.resolveEonCityW765R6AnimationReturnState({ interactionUntil: 2000, now: 1000 }), 'interact');
  assert.equal(spatial.resolveEonCityW765R6AnimationReturnState({ interactionUntil: 1000, now: 2000 }), 'idle');
  assert.equal(spatial.resolveEonCityW765R6AnimationReturnState({ moving: true }), 'walk');
  assert.equal(spatial.resolveEonCityW765R6AnimationReturnState({ moving: true, running: true }), 'run');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /npcGestureUntil > 0 && timeMs >= record\.npcGestureUntil/);
  assert.match(runtime, /playStationary\?\.\('idle'\)/);
  assert.match(runtime, /playerAsset\.animations\?\.play\?\.\('idle'\)/);
});
