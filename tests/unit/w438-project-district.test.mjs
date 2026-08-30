import assert from 'node:assert/strict'; import test from 'node:test';
import { buildEonProjectDistrictRenderPlan, createEonProjectDistrictRegistry, getEonProjectDistrictTruth, reviewEonProjectDistrictPrivacy } from '../../assets/js/city/eon-city-project-district-manifest.js';
import { inspectW438ProjectDistrict } from '../../scripts/w438-project-district-gate.mjs';
function memoryStorage() { const data = new Map(); return { getItem: (key) => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key), get length() { return data.size; }, key: (index) => [...data.keys()][index] || null }; }
const NOW = Date.parse('2026-06-29T12:00:00.000Z');
function districtRegistry() { return createEonProjectDistrictRegistry({ storage: memoryStorage(), now: () => NOW }); }
test('W438 requires user and City-safe label approval before creating a private district', () => {
  const registry = districtRegistry(); const input = { projectReference: 'project_alpha-42', displayLabel: 'Campaign Lantern', paletteId: 'forge', missionState: 'needs-review', approvedTaskCards: [{ id: 'card_review', label: 'Review a local draft', state: 'needs-review', approvedForCity: true }] };
  assert.equal(registry.create(input).error, 'explicit-user-action-required');
  assert.equal(registry.create(input, { explicitUserAction: true }).error, 'city-safe-label-approval-required');
  const created = registry.create(input, { explicitUserAction: true, explicitCitySafeLabelApproval: true });
  assert.equal(created.ok, true); assert.equal(created.snapshot.activeCount, 1); assert.equal(created.publicProjection.projectReferenceExposed, false);
});
test('W438 builds deterministic City render plans with no private project reference or seed', () => {
  const registry = districtRegistry(); const created = registry.create({ projectReference: 'project_bravo-87', displayLabel: 'Quiet Forge', paletteId: 'signal', missionState: 'draft', approvedTaskCards: [] }, { explicitUserAction: true, explicitCitySafeLabelApproval: true });
  const planA = buildEonProjectDistrictRenderPlan(created.manifest, { index: 0 }); const planB = buildEonProjectDistrictRenderPlan(created.manifest, { index: 0 });
  assert.deepEqual(planA.geometry, planB.geometry); assert.equal(JSON.stringify(planA).includes('project_bravo-87'), false); assert.equal(planA.seedExposed, false); assert.equal(planA.remoteRequestCreated, false);
  const reviewed = reviewEonProjectDistrictPrivacy(created.manifest); assert.equal(reviewed.ok, true); assert.equal(reviewed.promptExposed, false); assert.equal(reviewed.secretExposed, false);
});
test('W438 delete and restore remain local and use the same deterministic registry', () => {
  const registry = districtRegistry(); const created = registry.create({ projectReference: 'project_delta-21', displayLabel: 'Garden Zone', paletteId: 'garden', missionState: 'needs-review' }, { explicitUserAction: true, explicitCitySafeLabelApproval: true });
  const id = created.manifest.districtId; const deleted = registry.delete(id, { explicitUserAction: true, confirmed: true }); assert.equal(deleted.ok, true); assert.equal(deleted.snapshot.activeCount, 0); assert.equal(deleted.snapshot.deletedCount, 1);
  const restored = registry.restore(id, { explicitUserAction: true, confirmed: true }); assert.equal(restored.ok, true); assert.equal(restored.snapshot.activeCount, 1); assert.equal(restored.networkRequestCreated, false);
});
test('W438 gate and truth preserve the private, source-only boundary', () => { const gate = inspectW438ProjectDistrict(); const truth = getEonProjectDistrictTruth(); assert.equal(gate.status, 'pass'); assert.ok(gate.checkCount >= 8); assert.equal(truth.remoteGeneration, false); assert.equal(truth.finalCityRendering, false); assert.equal(truth.deviceVisualProof, false); });
