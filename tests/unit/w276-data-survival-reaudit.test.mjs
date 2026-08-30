import assert from 'node:assert/strict';
import test from 'node:test';
import {
  W276_DATA_SURVIVAL_REAUDIT_SCHEMA,
  W276_REQUIRED_EVIDENCE_IDS,
  buildW276EvidenceBoard,
  buildW276LocalStorageReaudit,
  validateW276EvidenceBoard
} from '../../assets/js/utils/w276-data-survival-reaudit.js';

class MemoryStorage {
  constructor(seed = {}) { this.rows = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)])); }
  get length() { return this.rows.size; }
  key(index) { return [...this.rows.keys()][index] || null; }
  getItem(key) { return this.rows.has(String(key)) ? this.rows.get(String(key)) : null; }
  setItem(key, value) { this.rows.set(String(key), String(value)); }
  removeItem(key) { this.rows.delete(String(key)); }
  toObject() { return Object.fromEntries(this.rows.entries()); }
}

function fixture() {
  return new MemoryStorage({
    'eon:chat:threads:v1': '{"thread":"test-safe"}',
    'eon:projects:v3': '{"project":"test-safe"}',
    'eon:city:preview-evidence:w259:v1': '{"localOnly":true}',
    'eon:custom-future-module:v1': '{"opaque":"dynamic"}'
  });
}

test('W276 re-audit preserves every observed app-owned key, including dynamic keys', () => {
  const before = fixture();
  const after = new MemoryStorage(before.toObject());
  const result = buildW276LocalStorageReaudit(before, after);
  assert.equal(result.schema, W276_DATA_SURVIVAL_REAUDIT_SCHEMA);
  assert.equal(result.ok, true);
  assert.equal(result.externalDeploymentEvidence, false);
  assert.ok(result.dynamicAppOwnedKeys >= 1);
  assert.equal(result.manifest.unclassifiedSummary.ok, true);
});

test('W276 re-audit rejects lost, changed, and unexpected dynamic app-owned keys', () => {
  const before = fixture();
  const changed = new MemoryStorage(before.toObject());
  changed.setItem('eon:custom-future-module:v1', '{"opaque":"changed"}');
  const changedResult = buildW276LocalStorageReaudit(before, changed);
  assert.equal(changedResult.ok, false);
  assert.ok(changedResult.changedKeys.includes('eon:custom-future-module:v1'));

  const lost = new MemoryStorage(before.toObject());
  lost.removeItem('eon:custom-future-module:v1');
  const lostResult = buildW276LocalStorageReaudit(before, lost);
  assert.equal(lostResult.ok, false);
  assert.ok(lostResult.lostKeys.includes('eon:custom-future-module:v1'));

  const newKey = new MemoryStorage(before.toObject());
  newKey.setItem('eon:unapproved-next-build:v1', 'new');
  const newResult = buildW276LocalStorageReaudit(before, newKey);
  assert.equal(newResult.ok, false);
  assert.ok(newResult.unexpectedNewAppKeys.includes('eon:unapproved-next-build:v1'));
});

test('W276 evidence board refuses release readiness without every external evidence lane', () => {
  const board = buildW276EvidenceBoard({ boardId: 'unit' });
  const validation = validateW276EvidenceBoard(board);
  assert.equal(board.verdict, 'NO_GO');
  assert.equal(board.canDeclareReleaseReadiness, false);
  assert.equal(validation.ok, true);
  assert.equal(board.requiredEvidence.length, W276_REQUIRED_EVIDENCE_IDS.length);
  assert.ok(board.requiredEvidence.every((row) => row.status === 'not-collected'));

  const invalid = {
    ...board,
    verdict: 'READY_FOR_INDEPENDENT_REVIEW',
    requiredEvidence: board.requiredEvidence.map((row, index) => index === 0 ? { ...row, status: 'passed', evidenceRefs: [] } : row)
  };
  const invalidValidation = validateW276EvidenceBoard(invalid);
  assert.equal(invalidValidation.ok, false);
  assert.ok(invalidValidation.errors.some((error) => error.includes('without an evidence reference')));
  assert.ok(invalidValidation.errors.some((error) => error.includes('incomplete')));
});
