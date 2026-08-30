import test from 'node:test';
import assert from 'node:assert/strict';
import { createEonExpanseW787AReleaseEvidence, serializeEonExpanseW787AReleaseEvidence } from '../../assets/js/city/w787/eon-expanse-w787a-release-evidence-export.js';

test('W787A exports only bounded certification evidence', () => {
  const evidence = createEonExpanseW787AReleaseEvidence({
    releaseMatrix: { regionId: 'storm-sector', status: 'incomplete', completedGates: 2, totalGates: 6, rows: [{ id: 'art', complete: false, status: 'replacement required', secret: 'remove' }] },
    packageReadiness: { status: 'evidence-required', completedRequirements: 0, totalRequirements: 7, privatePrompt: 'remove' },
    performanceReadiness: { status: 'foreground-browser-measurement-required', staticBudgetPass: true, metrics: [{ key: 'drawCalls', used: 20, limit: 40, withinBudget: true, rawFrames: [1, 2] }] },
    artAudit: { releaseReady: false, blockingProxyCount: 12, visibleDevelopmentProxyCount: 0, assetUrls: ['remove'] },
    generatedAt: 123
  });
  assert.equal(evidence.generatedAt, 123);
  assert.equal(evidence.regionId, 'storm-sector');
  assert.deepEqual(Object.keys(evidence.releaseMatrix.rows[0]), ['id', 'complete', 'status']);
  assert.deepEqual(Object.keys(evidence.performance.metrics[0]), ['key', 'used', 'limit', 'withinBudget']);
  assert.equal(JSON.stringify(evidence).includes('privatePrompt'), false);
  assert.equal(JSON.stringify(evidence).includes('assetUrls'), false);
});

test('W787A never claims certification or activates a gateway', () => {
  const evidence = createEonExpanseW787AReleaseEvidence({ releaseMatrix: { releaseReviewReady: true } });
  assert.equal(evidence.certificationClaimed, false);
  assert.equal(evidence.gatewayActivated, false);
  assert.equal(evidence.regionRendered, false);
  assert.equal(evidence.privateContentStored, false);
});

test('W787A serializes a stable JSON evidence package', () => {
  const evidence = createEonExpanseW787AReleaseEvidence({ generatedAt: 456 });
  const json = serializeEonExpanseW787AReleaseEvidence(evidence, { pretty: false });
  assert.equal(JSON.parse(json).generatedAt, 456);
});
