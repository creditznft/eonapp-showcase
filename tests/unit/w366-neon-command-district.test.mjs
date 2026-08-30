import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_COMMAND_DISTRICT_BLUEPRINT,
  EON_COMMAND_DISTRICT_MISSION_STAGES,
  EON_COMMAND_DISTRICT_NPC_ROLES,
  createCommandDistrictState,
  getCommandDistrictMissionCard,
  readCommandDistrictState,
  recordCommandDistrictEvent,
  validateCommandDistrictBlueprint
} from '../../assets/js/city/eon-city-command-district.js';

function createStorage() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); }
  };
}

test('W366 Command District blueprint is original, bounded and route-review-only', () => {
  const result = validateCommandDistrictBlueprint();
  assert.equal(result.ok, true, result.errors.join(' | '));
  assert.equal(EON_COMMAND_DISTRICT_BLUEPRINT.rendererPolicy.remoteAssets, false);
  assert.equal(EON_COMMAND_DISTRICT_BLUEPRINT.rendererPolicy.remoteTelemetry, false);
  assert.equal(EON_COMMAND_DISTRICT_BLUEPRINT.interactionRules.nativeRoutesRequireVisibleReview, true);
  assert.equal(EON_COMMAND_DISTRICT_BLUEPRINT.interactionRules.autoNavigation, false);
  assert.equal(EON_COMMAND_DISTRICT_BLUEPRINT.interactionRules.autoExecution, false);
  assert.ok(EON_COMMAND_DISTRICT_BLUEPRINT.structures.some((item) => item.id === 'command-room-interior'));
  assert.ok(EON_COMMAND_DISTRICT_NPC_ROLES.length >= 6);
  assert.ok(EON_COMMAND_DISTRICT_NPC_ROLES.every((role) => String(role.truthRule || '').trim().length >= 24));
  assert.equal(EON_COMMAND_DISTRICT_MISSION_STAGES.length, 6);
});

test('W366 local First Command Route progresses only through allowlisted stages and stores no content', () => {
  const storage = createStorage();
  const now = Date.UTC(2026, 5, 26, 4, 0, 0);
  const blank = createCommandDistrictState({ now });
  assert.equal(blank.stageId, 'arrival');
  assert.equal(getCommandDistrictMissionCard(blank).progressLabel, '1/6');

  let step = recordCommandDistrictEvent('entered', { storage, now });
  assert.equal(step.ok, true);
  step = recordCommandDistrictEvent('met-eonbot', { storage, landmarkId: 'command-centre', now: now + 1 });
  assert.equal(step.state.stageId, 'meet-eonbot');
  step = recordCommandDistrictEvent('selected-work-route', { storage, landmarkId: 'workshop', now: now + 2 });
  assert.equal(step.state.stageId, 'choose-work-route');
  step = recordCommandDistrictEvent('route-prepared', { storage, landmarkId: 'workshop', now: now + 3 });
  assert.equal(step.state.stageId, 'review-route');
  step = recordCommandDistrictEvent('route-confirmed', { storage, landmarkId: 'workshop', now: now + 4 });
  assert.equal(step.state.stageId, 'native-handoff');
  step = recordCommandDistrictEvent('returned', { storage, landmarkId: 'workshop', now: now + 5 });
  assert.equal(step.state.stageId, 'return-to-city');
  assert.equal(step.state.lastLandmarkId, 'workshop');
  assert.equal(step.state.localOnly, true);
  assert.equal(step.state.remoteTelemetry, false);
  assert.equal(step.state.containsUserContent, false);
  assert.equal(JSON.stringify(step.state).match(/prompt|provider|vault|wallet|token|purchase/i), null);

  const reloaded = readCommandDistrictState({ storage, now: now + 6 });
  assert.equal(reloaded.ok, true);
  assert.equal(reloaded.state.stageId, 'return-to-city');
});

test('W366 rejects unsupported events and strips untrusted landmark identifiers', () => {
  const storage = createStorage();
  const rejected = recordCommandDistrictEvent('publish-everything', { storage, landmarkId: 'https://example.invalid' });
  assert.equal(rejected.ok, false);
  const progress = recordCommandDistrictEvent('selected-work-route', { storage, landmarkId: 'https://example.invalid' });
  assert.equal(progress.ok, true);
  assert.equal(progress.state.lastLandmarkId, null);
  assert.equal(progress.state.stageId, 'choose-work-route');
});
