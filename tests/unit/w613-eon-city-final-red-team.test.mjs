import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {
  EON_CITY_CAMERA_OCCLUSION_POLICY,
  isEonCityCameraOccluder,
  resolveEonCityCameraOccluders,
  validateEonCityCameraOcclusionPolicy,
  createEonCityCameraOcclusionController
} from '../../assets/js/city/eon-city-camera-occlusion.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { getEonCityQualitySummitPlan, validateEonCityQualitySummitPlan } from '../../assets/js/city/eon-city-quality-summit.js';

const station = fs.readFileSync(new URL('../../assets/js/eon-city-play-station.js', import.meta.url), 'utf8');
const babylon = fs.readFileSync(new URL('../../assets/js/city/eon-city-play-babylon.js', import.meta.url), 'utf8');
const projectDistricts = fs.readFileSync(new URL('../../assets/js/city/eon-city-project-district-manifest.js', import.meta.url), 'utf8');

test('W613 camera visibility policy only fades eligible architectural occluders', () => {
  assert.equal(validateEonCityCameraOcclusionPolicy().ok, true);
  assert.equal(isEonCityCameraOccluder({ name: 'command-room-rear-wall', visibility: 1 }), true);
  assert.equal(isEonCityCameraOccluder({ name: 'eon-universe-landmark-hit-volume-command-centre', visibility: 1 }), false);
  assert.equal(isEonCityCameraOccluder({ name: 'eonbot-companion-core', visibility: 1 }), false);
  const wall = { name: 'archive-canopy-shell', visibility: 1 };
  const pylon = { name: 'command-pylon-left', visibility: 1 };
  const beacon = { name: 'command-beacon', visibility: 1 };
  const resolved = resolveEonCityCameraOccluders([{ pickedMesh: beacon }, { pickedMesh: wall }, { pickedMesh: pylon }]);
  assert.deepEqual(resolved, [wall, pylon]);
  assert.equal(EON_CITY_CAMERA_OCCLUSION_POLICY.changesCollision, false);
  assert.equal(EON_CITY_CAMERA_OCCLUSION_POLICY.remoteNetwork, false);
});


test('W613 camera controller fades and restores an eligible wall without touching movement state', () => {
  const wall = { name: 'command-room-rear-wall', visibility: 1, metadata: { eonCityCameraOcclusion: true } };
  const scene = {
    metadata: {},
    multiPickWithRay() { return [{ pickedMesh: wall }]; }
  };
  const target = { position: new Vector3(0, 0, 0) };
  const camera = { position: new Vector3(0, 2, -5), globalPosition: new Vector3(0, 2, -5) };
  const controller = createEonCityCameraOcclusionController({ scene, camera, target });
  const first = controller.update(100);
  assert.equal(first.activeCount, 1);
  assert.equal(wall.visibility, EON_CITY_CAMERA_OCCLUSION_POLICY.fadeVisibility);
  scene.multiPickWithRay = () => [];
  controller.update(300);
  assert.equal(wall.visibility, 1);
  assert.equal(controller.getSummary().changesCollision, false);
  controller.destroy();
});

test('W613 direct City HUD stays named and reserves project districts plus safe share for deliberate secondary surfaces', () => {
  const summit = getEonCityQualitySummitPlan({ directEntry: true });
  assert.equal(validateEonCityQualitySummitPlan(summit).length, 0);
  assert.deepEqual(summit.primaryHudActions, ['Command Room', 'EONBOT', 'Districts', 'Menu']);
  assert.match(station, /data-eon-play-open-project-districts/);
  assert.match(station, /data-eon-play-share-city/);
  assert.match(station, /bindEonCitySharingCenter/);
  assert.match(station, /const bindCityShare = \(\) => bindEonCitySharingCenter/);
  assert.doesNotMatch(station, /openEonSharePopover/);
  assert.doesNotMatch(station, /Choose Interact/);
  assert.doesNotMatch(station, /data-eon-play-interact/);
});

test('W613 project districts remain local/sanitized while receiving a City visual profile', () => {
  assert.match(projectDistricts, /privateByDefault: true/);
  assert.match(projectDistricts, /projectReferenceExposed: false/);
  assert.match(projectDistricts, /promptExposed: false/);
  assert.match(projectDistricts, /visualProfile/);
  assert.match(babylon, /createEonCityCameraOcclusionController/);
  assert.match(babylon, /cameraOcclusion\.update/);
  assert.match(babylon, /cameraOcclusion\.destroy/);
});
