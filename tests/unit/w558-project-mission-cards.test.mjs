import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_PROJECT_DISTRICT_SCHEMA,
  buildEonProjectDistrictRenderPlan,
  createEonCityApprovedMissionCard,
  createEonProjectDistrictRegistry
} from '../../assets/js/city/eon-city-project-district-manifest.js';

function memoryStorage() {
  const records = new Map();
  return {
    getItem(key) { return records.has(key) ? records.get(key) : null; },
    setItem(key, value) { records.set(key, String(value)); },
    removeItem(key) { records.delete(key); }
  };
}

function createRegistry() {
  let tick = 1719878400000;
  return createEonProjectDistrictRegistry({ storage: memoryStorage(), now: () => ++tick });
}

function createPortal(registry, projectReference = 'project_alpha_123') {
  const result = registry.create({
    projectReference,
    displayLabel: 'Launch Atelier',
    paletteId: 'forge',
    missionState: 'focus',
    approvedTaskCards: []
  }, { explicitUserAction: true, explicitCitySafeLabelApproval: true });
  assert.equal(result.ok, true);
  return result;
}

test('W558 requires an explicit action and separate City-safe approval for every mission card', () => {
  const missingAction = createEonCityApprovedMissionCard({ label: 'Review launch checklist', state: 'focus' });
  assert.equal(missingAction.ok, false);
  assert.equal(missingAction.error, 'explicit-user-action-required');
  const missingApproval = createEonCityApprovedMissionCard({ label: 'Review launch checklist', state: 'focus' }, { explicitUserAction: true });
  assert.equal(missingApproval.ok, false);
  assert.equal(missingApproval.error, 'city-safe-card-approval-required');
  const approved = createEonCityApprovedMissionCard({ label: 'Review launch checklist', state: 'focus' }, { explicitUserAction: true, explicitCitySafeCardApproval: true, now: 1719878400000 });
  assert.equal(approved.ok, true);
  assert.match(approved.card.id, /^mission_[a-z0-9]{8,24}$/i);
  assert.equal(approved.card.label, 'Review launch checklist');
  assert.equal(approved.networkRequestCreated, false);
  assert.equal(approved.projectReferenceExposed, false);
  assert.equal(approved.rawTaskContentExposed, false);
});

test('W558 projects only reviewed labels and coarse state into a deterministic City render plan', () => {
  const registry = createRegistry();
  const created = createPortal(registry, 'project_private_launch_77');
  const added = registry.addApprovedMissionCard(created.manifest.districtId, {
    label: 'Review launch checklist',
    state: 'needs-review'
  }, { explicitUserAction: true, explicitCitySafeCardApproval: true });
  assert.equal(added.ok, true);
  assert.equal(added.deduped, false);
  assert.equal(added.renderPlan.schema, `${EON_PROJECT_DISTRICT_SCHEMA}.render-plan`);
  assert.equal(added.renderPlan.taskCards.length, 1);
  assert.deepEqual(added.renderPlan.taskCards[0], {
    id: added.card.id,
    label: 'Review launch checklist',
    state: 'needs-review'
  });
  const serialized = JSON.stringify(added.renderPlan);
  assert.equal(serialized.includes('project_private_launch_77'), false);
  assert.equal(serialized.includes('secret working title'), false);
  assert.equal(added.renderPlan.projectReferenceExposed, false);
  assert.equal(added.renderPlan.promptExposed, false);
  assert.equal(added.renderPlan.fileExposed, false);
  assert.equal(added.rawTaskContentExposed, false);
  const standalone = buildEonProjectDistrictRenderPlan({ schema: 'not-a-manifest' });
  assert.equal(standalone, null);
});

test('W558 keeps the local console state narrow, deduplicates reviewed cards, and requires confirmation to remove', () => {
  const registry = createRegistry();
  const created = createPortal(registry, 'project_mission_456');
  const first = registry.addApprovedMissionCard(created.manifest.districtId, {
    label: 'Confirm release notes',
    state: 'focus'
  }, { explicitUserAction: true, explicitCitySafeCardApproval: true });
  assert.equal(first.ok, true);
  const duplicate = registry.addApprovedMissionCard(created.manifest.districtId, {
    label: 'Confirm release notes',
    state: 'focus'
  }, { explicitUserAction: true, explicitCitySafeCardApproval: true });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.deduped, true);
  const state = registry.getLocalMissionCardState('project_mission_456');
  assert.equal(state.projectReferenceExposed, false);
  assert.equal(JSON.stringify(state).includes('project_mission_456'), false);
  assert.equal(state.approvedTaskCards.length, 1);
  const unconfirmed = registry.removeApprovedMissionCard(created.manifest.districtId, first.card.id, { explicitUserAction: true });
  assert.equal(unconfirmed.ok, false);
  assert.equal(unconfirmed.error, 'mission-card-remove-confirmation-required');
  const removed = registry.removeApprovedMissionCard(created.manifest.districtId, first.card.id, { explicitUserAction: true, confirmed: true });
  assert.equal(removed.ok, true);
  assert.equal(removed.missionCardState.approvedTaskCards.length, 0);
  assert.equal(removed.rawTaskContentExposed, false);
});

test('W558 rejects sensitive labels before any local City render-plan change', () => {
  const registry = createRegistry();
  const created = createPortal(registry, 'project_private_789');
  const blocked = registry.addApprovedMissionCard(created.manifest.districtId, {
    label: 'Attach API key for launch',
    state: 'focus'
  }, { explicitUserAction: true, explicitCitySafeCardApproval: true });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error, 'city-safe-card-label-required');
  const state = registry.getLocalMissionCardState('project_private_789');
  assert.equal(state.approvedTaskCards.length, 0);
});
