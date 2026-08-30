import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_CITY_W719_ARRIVAL_CAMERA_SCHEMA,
  estimateEonCityW719ArcRotatePosition,
  isEonCityW719PointInsideStructuralBounds,
  resolveEonCityW719ArrivalCamera
} from '../../assets/js/city/w719/eon-city-w719-arrival-camera.js';

test('W719.13 Orientation Hall camera looks across the plaza from above-ground open space', () => {
  const result = resolveEonCityW719ArrivalCamera({ districtId: 'orientation-hall', playerPosition: { x: -2.4, z: 40.8 } });
  assert.equal(result.schema, EON_CITY_W719_ARRIVAL_CAMERA_SCHEMA);
  assert.ok(result.target.z > 40.8);
  assert.ok(result.estimatedPosition.y > 8);
  assert.ok(result.cameraRadius >= 18);
  assert.equal(result.playerMoved, false);
  assert.equal(result.automaticNavigation, false);
});

test('W719.13 camera cycles away from a structural box containing the preferred camera', () => {
  const preferredPosition = estimateEonCityW719ArcRotatePosition({
    target: { x: -2.4, y: 1.22, z: 44.2 }, alpha: -1.16, beta: 0.86, radius: 20.5
  });
  const result = resolveEonCityW719ArrivalCamera({
    districtId: 'orientation-hall',
    playerPosition: { x: -2.4, z: 40.8 },
    structuralBounds: [{
      min: { x: preferredPosition.x - 1, y: preferredPosition.y - 1, z: preferredPosition.z - 1 },
      max: { x: preferredPosition.x + 1, y: preferredPosition.y + 1, z: preferredPosition.z + 1 }
    }]
  });
  assert.ok(result.candidateIndex > 0);
  assert.equal(isEonCityW719PointInsideStructuralBounds(result.estimatedPosition, {
    min: { x: preferredPosition.x - 1, y: preferredPosition.y - 1, z: preferredPosition.z - 1 },
    max: { x: preferredPosition.x + 1, y: preferredPosition.y + 1, z: preferredPosition.z + 1 }
  }), false);
});
