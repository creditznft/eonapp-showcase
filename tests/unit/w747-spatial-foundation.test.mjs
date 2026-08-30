import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_W747_ARRIVAL_CORRIDOR,
  EON_CITY_W747_CAMERA_POSES,
  EON_CITY_W747_FIVE_WING_ANCHORS,
  EON_CITY_W747_HERO_ZONE,
  EON_CITY_W747_OPERATIONS_CRESCENT,
  EON_CITY_W747_PRIMARY_PLACEMENTS,
  EON_CITY_W747_SPAWN,
  createEonCityW747SpatialDiagnostics,
  deriveEonCityW747CameraPosition,
  inspectEonCityW747ArrivalCorridor,
  inspectEonCityW747CameraFloorSafety,
  inspectEonCityW747PrimaryFootprints,
  sanitizeEonCityW747WorldPoint,
  validateEonCityW747SpatialFoundation
} from '../../assets/js/city/w747/eon-city-w747-spatial-foundation.js';
import {
  EON_CITY_W731_EONBOT_DOCK,
  EON_CITY_W731_STATIONS,
  EON_CITY_W743_ARRIVAL_CAMERA,
  inspectEonCityW743ArrivalCamera,
  validateEonCityW731CommandHubContract
} from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import {
  EON_CITY_W731_LAUNCH_ASSET_MANIFEST,
  EON_CITY_W747_RUNTIME_PROVENANCE,
  validateEonCityW731LaunchAssetManifest
} from '../../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const bounds = (min, max) => ({ min, max });

test('W747 locks one protected 12 metre Nexus Hero Zone and five coherent wings', () => {
  const validation = validateEonCityW747SpatialFoundation();
  assert.equal(validation.ok, true);
  assert.deepEqual(validation.errors, []);
  assert.equal(EON_CITY_W747_HERO_ZONE.diameter, 12);
  assert.equal(EON_CITY_W747_HERO_ZONE.radius, 6);
  assert.equal(EON_CITY_W747_FIVE_WING_ANCHORS.length, 5);
  assert.deepEqual(EON_CITY_W747_FIVE_WING_ANCHORS.map((entry) => entry.id), [
    'creator', 'operations', 'knowledge', 'systems', 'personal-transit'
  ]);
  assert.equal(EON_CITY_W747_PRIMARY_PLACEMENTS.length, 10);
  assert.equal(new Set(EON_CITY_W747_PRIMARY_PLACEMENTS.map((entry) => entry.primaryRole)).size, 10);
  assert.deepEqual(inspectEonCityW747PrimaryFootprints(), {
    ok: true, overlaps: [], heroZoneViolations: [], footprintCount: 10
  });
  assert.deepEqual(inspectEonCityW747ArrivalCorridor(), { ok: true, blockers: [] });
});

test('W747 camera and spawn authority are finite, floor-safe and reveal the centre', () => {
  assert.deepEqual(EON_CITY_W747_SPAWN, { x: 0, y: 0, z: 16.2, heading: Math.PI });
  const arrivalPosition = deriveEonCityW747CameraPosition(EON_CITY_W747_CAMERA_POSES.arrival);
  assert.ok(Math.abs(arrivalPosition.x) < 0.001);
  assert.ok(arrivalPosition.y > 8);
  assert.ok(arrivalPosition.z > EON_CITY_W747_SPAWN.z);
  assert.deepEqual(EON_CITY_W743_ARRIVAL_CAMERA.target, { x: 0, y: 1.55, z: 3.8 });
  assert.equal(inspectEonCityW743ArrivalCamera().ok, true);
  assert.ok(inspectEonCityW743ArrivalCamera().minimumClearance >= 0.2);
  assert.equal(EON_CITY_W747_ARRIVAL_CORRIDOR.from.z, EON_CITY_W747_SPAWN.z);
  assert.equal(sanitizeEonCityW747WorldPoint({ x: Number.NaN, y: -9, z: Number.POSITIVE_INFINITY }).y, 0);
  assert.equal(sanitizeEonCityW747WorldPoint({ x: Number.NaN, y: -9, z: Number.POSITIVE_INFINITY }).sanitized, true);
});

test('W766IR2-G camera safety detects under-floor, invalid-target and beta failures', () => {
  assert.equal(inspectEonCityW747CameraFloorSafety({
    position: { x: 0, y: 4, z: 10 },
    target: { x: 0, y: 1.35, z: 0 },
    beta: 1.08
  }).ok, true);
  const unsafe = inspectEonCityW747CameraFloorSafety({
    position: { x: 0, y: -2, z: 10 },
    target: { x: 0, y: -1, z: 0 },
    beta: 2.2
  });
  assert.equal(unsafe.ok, false);
  assert.deepEqual(unsafe.reasons, [
    'camera-below-floor-clearance',
    'camera-target-below-safe-height',
    'camera-beta-out-of-bounds'
  ]);
});

test('W747 loaded-bound diagnostics catch real occlusion, overlap, role and floor defects', () => {
  const diagnostics = createEonCityW747SpatialDiagnostics();
  diagnostics.registerLoadedAsset({
    id: 'nexus', bounds: bounds({ x: -2, y: 0, z: -2 }, { x: 2, y: 4, z: 2 }),
    primaryRole: 'living-nexus-core', groupId: 'nexus', allowHeroZone: true, allowArrivalRay: true
  });
  diagnostics.registerLoadedAsset({
    id: 'arrival-blocker', bounds: bounds({ x: -1, y: 0, z: 9 }, { x: 1, y: 8, z: 12 }),
    primaryRole: 'blocker', groupId: 'blocker'
  });
  diagnostics.registerLoadedAsset({
    id: 'hero-intruder', bounds: bounds({ x: 5.4, y: 0, z: -0.5 }, { x: 7.2, y: 3, z: 0.5 }),
    primaryRole: 'intruder', groupId: 'intruder'
  });
  diagnostics.registerLoadedAsset({
    id: 'overlap-a', bounds: bounds({ x: 12, y: 0, z: -3 }, { x: 15, y: 3, z: 0 }),
    primaryRole: 'overlap-a', groupId: 'a'
  });
  diagnostics.registerLoadedAsset({
    id: 'overlap-b', bounds: bounds({ x: 14.5, y: 0, z: -2 }, { x: 17, y: 3, z: 1 }),
    primaryRole: 'overlap-b', groupId: 'b'
  });
  diagnostics.registerLoadedAsset({
    id: 'duplicate-role-a', bounds: bounds({ x: -18, y: 0, z: -12 }, { x: -16, y: 2, z: -10 }),
    primaryRole: 'duplicate', groupId: 'duplicate-a'
  });
  diagnostics.registerLoadedAsset({
    id: 'duplicate-role-b', bounds: bounds({ x: -14, y: -0.5, z: -12 }, { x: -12, y: 2, z: -10 }),
    primaryRole: 'duplicate', groupId: 'duplicate-b'
  });
  const report = diagnostics.getReport();
  assert.equal(report.ok, false);
  assert.ok(report.arrivalOccluders.includes('arrival-blocker'));
  assert.ok(report.heroZoneIntersections.includes('hero-intruder'));
  assert.ok(report.primaryOverlaps.some((entry) => entry.leftId === 'overlap-a' && entry.rightId === 'overlap-b'));
  assert.deepEqual(report.duplicatePrimaryRoles, [{ role: 'duplicate', count: 2 }]);
  assert.ok(report.belowFloor.includes('duplicate-role-b'));
});

test('W766IR2-A retires the Hub Archive Garden and preserves one canonical Expanse Gate', () => {
  assert.equal(validateEonCityW731LaunchAssetManifest().ok, true);
  assert.equal(validateEonCityW731CommandHubContract().ok, true);
  assert.equal(EON_CITY_W747_RUNTIME_PROVENANCE, 'eon-city-living-nexus-command-core-w757-1');
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.version, '757.0.0');
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.cacheVersion, EON_CITY_W747_RUNTIME_PROVENANCE);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.coreWorld.some((entry) => entry.alias === 'command-centre-shell'), false);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.visibleFrame.coreAssetAliases.includes('command-centre-shell'), false);
  const orientationUses = [
    ...EON_CITY_W731_LAUNCH_ASSET_MANIFEST.coreWorld,
    ...EON_CITY_W731_LAUNCH_ASSET_MANIFEST.stationWorld,
    ...EON_CITY_W731_LAUNCH_ASSET_MANIFEST.discoveryWorld
  ].filter((entry) => entry.sourceId === 'eoncity-orientation-hall');
  assert.equal(orientationUses.length, 0);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.discoveryWorld.filter((entry) => entry.alias === 'expanse-gate-world').length, 1);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.centralOrientationShellRetired, true);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.hubArchiveGardenRetired, true);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.truth.expanseGateCanonical, true);
});

test('W747 moves the command furniture into the operations crescent and synchronizes EONBOT dock authority', () => {
  for (const entry of [
    EON_CITY_W747_OPERATIONS_CRESCENT.commandTable,
    EON_CITY_W747_OPERATIONS_CRESCENT.commandSeat,
    EON_CITY_W747_OPERATIONS_CRESCENT.districtHologram
  ]) {
    const distance = Math.hypot(entry.position.x, entry.position.z);
    assert.ok(distance > EON_CITY_W747_HERO_ZONE.radius + entry.footprintRadius);
  }
  assert.deepEqual(EON_CITY_W731_EONBOT_DOCK, EON_CITY_W747_OPERATIONS_CRESCENT.eonbotDock.position);
  assert.equal(EON_CITY_W747_OPERATIONS_CRESCENT.canopy.columnRadius, 11.25);
  assert.equal(EON_CITY_W747_OPERATIONS_CRESCENT.canopy.columnAngleOffset, Math.PI / 8);
});

test('W747 runtime uses actual post-transform GLB bounds and keeps diagnostics advanced-only', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const loader = read('assets/js/city/w731/eon-city-w731-local-assets.js');
  assert.match(loader, /wrapper\.computeWorldMatrix\?\.\(true\);[\s\S]*bounds = computeBounds\(container\);[\s\S]*bounds: finalBounds/);
  assert.match(runtime, /createEonCityW747SpatialDiagnostics\(\)/);
  assert.match(runtime, /registerLoadedSpatialAsset\('authored:living-nexus-core'/);
  assert.match(runtime, /spatialDiagnostics\.unregisterLoadedAsset\(`fallback:station:\$\{station\.id\}`\)/);
  assert.match(runtime, /advanced-diagnostics-required/);
  assert.match(runtime, /ownerVisibleByDefault: false/);
  assert.match(runtime, /spatialFoundation: freeze\(/);
  assert.match(runtime, /applyCameraPose\(EON_CITY_W747_CAMERA_POSES\.arrival, 'arrival'\)/);
  assert.match(runtime, /captureWorldState:[\s\S]*camera: captureCameraPose\(\)/);
  assert.match(runtime, /restoreWorldState:[\s\S]*restoreCameraPose\(snapshot\.camera\)/);
  assert.doesNotMatch(runtime, /anchor\('command-centre-shell'/);
});

test('W747 preserves one Babylon owner, Menu and shared work-surface flows', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.equal((runtime.match(/new Engine\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\(/g) || []).length, 1);
  assert.equal((runtime.match(/engine\.runRenderLoop\(/g) || []).length, 1);
  const presenter = read('assets/js/city/w748/eon-city-w748-workspace-presenter.js');
  assert.match(runtime, /createEonCityW748WorkspacePresenter/);
  assert.match(presenter, /dispatchEonWorkSurfaceOpen/);
  assert.match(presenter, /EON_WORK_SURFACE_OPEN_EVENT/);
  assert.match(presenter, /EON_WORK_SURFACE_CLOSE_EVENT/);
  assert.match(runtime, /openCityMenu/);
  assert.match(runtime, /guideToStation/);
  assert.match(runtime, /createEonCityW745HeroPresentationDirector/);
  assert.equal(EON_CITY_W731_STATIONS.length, 10);
  assert.equal(new Set(EON_CITY_W731_STATIONS.filter((entry) => entry.wing !== 'hero').map((entry) => entry.wing)).size, 5);
  assert.equal(EON_CITY_W731_STATIONS.filter((entry) => entry.wing === 'hero').length, 1);
});
