import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SPATIAL_COMMAND_CAMERA_PRESETS,
  SPATIAL_COMMAND_SPACE_SCHEMA,
  buildSpatialCommandProjection,
  getSpatialCommandCameraPose,
  normalizeSpatialCommandCameraPreset,
  validateSpatialCommandProjection
} from '../../assets/js/city/eon-city-spatial-command-space.js';
import { W367_SPATIAL_COMMAND_SPACE_CONTRACT, validateW367SpatialCommandSpaceContract } from '../../config/w367-spatial-command-space-contract.mjs';

function localCommandState() {
  return { stageId: 'review-route', lastLandmarkId: 'command-centre', eventCounts: {}, localOnly: true, remoteTelemetry: false, containsUserContent: false };
}

test('W367 command projection stays local, bounded and free of private City content', () => {
  const projection = buildSpatialCommandProjection({
    citySummary: {
      unlockedDistricts: ['command', 'workspace'],
      progress: { activeObjective: 'visit-command-centre' },
      navigation: { currentMode: 'command-space', lastTransition: { fromMode: 'portal' } }
    },
    commandDistrictState: localCommandState(),
    agentPresence: [
      { id: 'local-cue-1', role: 'builder', status: 'working', prompt: 'must never be copied' },
      { id: 'local-cue-2', role: 'reviewer', status: 'blocked', privateField: 'must never be copied' }
    ]
  });
  assert.equal(projection.schema, SPATIAL_COMMAND_SPACE_SCHEMA);
  assert.equal(projection.localOnly, true);
  assert.equal(projection.storesUserContent, false);
  assert.equal(projection.execution, 'none');
  assert.equal(projection.commandDistrict.mission.stageId, 'review-route');
  assert.equal(projection.crew.visibleCount, 2);
  assert.equal(JSON.stringify(projection).match(/must never be copied/), null);
  assert.equal(validateSpatialCommandProjection(projection).ok, true);
});

test('W367 camera controls are finite and invalid camera ids safely return to arrival', () => {
  assert.equal(SPATIAL_COMMAND_CAMERA_PRESETS.length, 3);
  assert.equal(normalizeSpatialCommandCameraPreset('command-centre'), 'command-centre');
  assert.equal(normalizeSpatialCommandCameraPreset('not-a-camera'), 'arrival');
  const pose = getSpatialCommandCameraPose('skyline');
  assert.equal(pose.id, 'skyline');
  assert.equal(pose.position.length, 3);
  assert.equal(pose.target.length, 3);
});

test('W367 contract blocks remote, private and automatic behavior', () => {
  assert.deepEqual(validateW367SpatialCommandSpaceContract(), []);
  assert.equal(W367_SPATIAL_COMMAND_SPACE_CONTRACT.truthRules.remoteAssets, false);
  assert.equal(W367_SPATIAL_COMMAND_SPACE_CONTRACT.truthRules.remoteTelemetry, false);
  assert.equal(W367_SPATIAL_COMMAND_SPACE_CONTRACT.truthRules.privateDataInRenderer, false);
  assert.equal(W367_SPATIAL_COMMAND_SPACE_CONTRACT.truthRules.automaticExecution, false);
});
