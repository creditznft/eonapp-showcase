import assert from 'node:assert/strict';
import test from 'node:test';
import { getEonNoirGuideArchetypes, getEonNoirGuidePlan, getEonNoirNpcKitSummary, validateEonNoirNpcKit } from '../../assets/js/city/eon-city-noir-npc-kit.js';
import { validateW456ANoirGuideCastContract } from '../../config/w456a-noir-readable-guide-cast-contract.mjs';
import { inspectW456ANoirReadableGuideCast } from '../../scripts/w456a-noir-readable-guide-cast-gate.mjs';

test('W456.1 defines one original procedural readable guide plan for every non-EONBOT City role', () => {
  assert.equal(validateEonNoirNpcKit().ok, true);
  assert.deepEqual(validateW456ANoirGuideCastContract(getEonNoirNpcKitSummary()), []);
  assert.deepEqual(getEonNoirGuideArchetypes().map((entry) => entry.castName), ['Builder', 'Curator', 'Guardian', 'Device Technician', 'Support Navigator']);
  for (const role of getEonNoirGuideArchetypes()) {
    const plan = getEonNoirGuidePlan({ roleId: role.roleId, quality: 'balanced' });
    assert.equal(plan.readableFace, true);
    assert.equal(plan.originalProcedural, true);
    assert.equal(plan.riggedAsset, false);
    assert.equal(plan.remoteAssets, false);
    assert.equal(plan.taskStatusFabricated, false);
    assert.ok(plan.accessories.length >= 3);
  }
});

test('W456.1 makes Lite an intentional silhouette reduction rather than pretending every device has final character detail', () => {
  for (const role of getEonNoirGuideArchetypes()) {
    const lite = getEonNoirGuidePlan({ roleId: role.roleId, quality: 'lite' });
    const cinematic = getEonNoirGuidePlan({ roleId: role.roleId, quality: 'cinematic' });
    assert.equal(lite.detail, 'silhouette');
    assert.equal(lite.readableFace, false);
    assert.equal(cinematic.detail, 'readable');
    assert.equal(cinematic.readableFace, true);
  }
  assert.equal(getEonNoirGuidePlan({ roleId: 'unknown' }), null);
});

test('W456.1 source gate keeps the guide cast local, non-autonomous and honest about final character work', () => {
  const report = inspectW456ANoirReadableGuideCast();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.equal(report.readableGuideCount, 5);
  assert.match(report.limitations.join(' '), /final rigged\/animated GLB/i);
});
